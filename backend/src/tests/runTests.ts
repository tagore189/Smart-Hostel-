import http from 'http';
import { app } from '../server';
import { connectDB, closeDB } from '../config/db';
import { runSeed } from '../seed/seed';

let testServer: http.Server;
let baseUrl: string;

const request = async (path: string, options: RequestInit = {}): Promise<any> => {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
};

const runAllTests = async () => {
  console.log('\n========================================');
  console.log('🧪 RUNNING AUTOMATED BACKEND INTEGRATION TESTS');
  console.log('========================================\n');

  // Seed DB first
  await runSeed(false);

  testServer = app.listen(0);
  const addr: any = testServer.address();
  baseUrl = `http://127.0.0.1:${addr.port}/api`;

  let residentToken = '';
  let adminToken = '';
  let testComplaintId = '';
  let testOutingId = '';

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await request('/health');
    assert(health.status === 200 && health.data.status === 'online', 'API Health Check Online');

    // 2. Auth: Resident Login
    const resLogin = await request('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'RESIDENT' }),
    });
    assert(resLogin.status === 200 && resLogin.data.success, 'Resident Dev-Login (Ananya Sharma)');
    residentToken = resLogin.data.token;
    assert(resLogin.data.resident?.roomNumber === '204', 'Resident Room is 204');
    assert(resLogin.data.resident?.bedCode === 'B', 'Resident Bed is Bed B');

    // 3. Auth: Admin/Warden Login
    const adminLogin = await request('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'WARDEN' }),
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'WARDEN', 'Warden Dev-Login (Mrs. Shanti Reddy)');
    adminToken = adminLogin.data.token;

    // 4. Resident Me & Stay
    const stay = await request('/residents/stay', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(stay.status === 200 && stay.data.success, 'Fetch My Stay Details');
    assert(stay.data.data.room?.roomNumber === '204', 'Stay Room 204 Verified');
    assert(stay.data.data.roommates?.length >= 1, 'Roommates in Room 204 returned');

    // 5. Payment Overview
    const payments = await request('/payments/overview', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(payments.status === 200 && payments.data.success, 'Fetch Payment Overview');
    assert(payments.data.data.monthlyRent === 8000, 'Monthly Rent is ₹8,000');
    assert(payments.data.data.securityDeposit === 10000, 'Security Deposit is ₹10,000');
    assert(payments.data.data.currentStatus === 'PAID', 'Current Rent Status is PAID');

    // 6. Process Payment in Development Mode
    const payRes = await request('/payments/pay', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        amount: 8000,
        month: 'October 2026',
        type: 'RENT',
        isDevelopmentMode: true,
      }),
    });
    assert(payRes.status === 200 && payRes.data.success, 'Process Development Mode Payment');
    assert(payRes.data.data.receipt?.receiptNumber !== undefined, 'Receipt Generated for Payment');

    // 7. Mess Today & Weekly Menu
    const messToday = await request('/mess/today', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(messToday.status === 200 && messToday.data.data.meals.length >= 3, 'Fetch Today Meals (Breakfast, Lunch, Dinner)');

    // 8. Submit Meal Feedback & Opt Out
    const feedbackRes = await request('/mess/feedback', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        mealType: 'Dinner',
        rating: 5,
        tasteRating: 5,
        hygieneRating: 5,
        comment: 'Paneer butter masala and fresh phulkas were exceptional tonight!',
      }),
    });
    assert(feedbackRes.status === 201 && feedbackRes.data.success, 'Submit Meal Feedback');

    const optOutRes = await request('/mess/opt-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        mealType: 'Snacks',
        reason: 'Office evening team outing',
      }),
    });
    assert(optOutRes.status === 200 && optOutRes.data.optedOut === true, 'Toggle Meal Opt-Out');

    // 9. Maintenance Ticket Creation
    const ticketRes = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        category: 'Electrical',
        title: 'Bedside reading lamp flickering',
        description: 'The LED tube near Bed B fluctuates slightly in the evening.',
        priority: 'MEDIUM',
      }),
    });
    assert(ticketRes.status === 201 && ticketRes.data.success, 'Create Maintenance Ticket');
    testComplaintId = ticketRes.data.data._id;

    // 10. Outing Request & Gate Pass
    const outingRes = await request('/outings/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        leavingDate: '2026-09-24',
        leavingTime: '17:00',
        expectedReturnDate: '2026-09-24',
        expectedReturnTime: '20:30',
        destination: 'Manjeera Mall Kukatpally',
        reason: 'Bookstore and grocery essentials',
      }),
    });
    assert(outingRes.status === 201 && outingRes.data.success, 'Request Outing Pass');
    testOutingId = outingRes.data.data._id;
    assert(outingRes.data.data.gatePassCode !== undefined, 'Gate Pass Code & QR Payload Auto-Generated');

    // 11. Visitor Registration
    const visitorRes = await request('/visitors/register', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        visitorName: 'Rajesh Sharma',
        relationship: 'Father',
        phone: '+91 98480 12345',
        visitDate: '2026-09-27',
        arrivalTime: '11:00 AM',
        expectedDepartureTime: '03:00 PM',
      }),
    });
    assert(visitorRes.status === 201 && visitorRes.data.success, 'Register Visitor & Issue Pass');

    // 12. Notices
    const notices = await request('/notices', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(notices.status === 200 && notices.data.data.length >= 3, 'Fetch Community Notices');

    // 13. Emergency Contacts & Silent Welfare Alert
    const emergencyContacts = await request('/emergency/contacts', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(emergencyContacts.status === 200 && emergencyContacts.data.data.hostelResponders.length >= 2, 'Fetch Emergency Responders (Warden Mrs. Shanti Reddy, Security)');

    const silentAlertRes = await request('/emergency/silent-welfare-alert', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        latitude: 17.4938,
        longitude: 78.3995,
        notes: 'Verification test for Silent Welfare Alert protocol',
      }),
    });
    assert(silentAlertRes.status === 201 && silentAlertRes.data.success, 'Trigger Silent Welfare Alert (Dispatches to Warden/Admins)');

    // 14. Admin Authorization: Resident CANNOT access Admin Endpoints
    const forbiddenTest = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(forbiddenTest.status === 403, 'Role Guard: Resident forbidden from /api/admin/dashboard');

    // 15. Admin Dashboard Metrics (Real DB Aggregations)
    const adminDash = await request('/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDash.status === 200 && adminDash.data.success, 'Admin Dashboard Real Database Metrics');
    assert(adminDash.data.data.totalResidents >= 2, 'Metric: Total Residents calculated');
    assert(adminDash.data.data.occupiedBeds >= 2, 'Metric: Occupied Beds calculated');
    assert(adminDash.data.data.availableBeds >= 1, 'Metric: Available Beds calculated');

    // 16. Admin Complaint Status Update
    if (testComplaintId) {
      const updateComp = await request(`/admin/complaints/${testComplaintId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          status: 'RESOLVED',
          note: 'Electrician replaced the LED driver module.',
        }),
      });
      assert(updateComp.status === 200 && updateComp.data.data.status === 'RESOLVED', 'Admin Resolve Complaint');
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    testServer.close();
    await closeDB();
  }

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

if (require.main === module) {
  runAllTests();
}
