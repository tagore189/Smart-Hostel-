import http from 'http';
import { app } from '../server';
import { connectDB, closeDB } from '../config/db';
import { runSeed } from '../seed/seed';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

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
  let otherResidentToken = '';
  let adminToken = '';
  let testComplaintId = '';

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
    const noToken = await request('/admin/dashboard');
    assert(noToken.status === 401, 'Admin API rejects requests without a token');
    const invalidToken = await request('/admin/dashboard', { headers: { Authorization: 'Bearer invalid.token.value' } });
    assert(invalidToken.status === 401, 'Admin API rejects invalid tokens');

    // 2. Auth: Resident Login
    const resLogin = await request('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'RESIDENT' }),
    });
    assert(resLogin.status === 200 && resLogin.data.success, 'Resident Dev-Login (Ananya Sharma)');
    residentToken = resLogin.data.token;
    assert(resLogin.data.resident?.roomNumber === '204', 'Resident Room is 204');
    assert(resLogin.data.resident?.bedCode === 'B', 'Resident Bed is Bed B');

    const otherLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'sneha.patel@slgluxury.com', password: 'Welcome@123' }),
    });
    assert(otherLogin.status === 200 && otherLogin.data.user.role === 'RESIDENT', 'Second resident can authenticate normally');
    otherResidentToken = otherLogin.data.token;

    // 3. Auth: Admin/Warden Login
    const adminLogin = await request('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'WARDEN' }),
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'WARDEN', 'Warden Dev-Login (Mrs. Shanti Reddy)');
    adminToken = adminLogin.data.token;

    // Forced password reset blocks the rest of the API until a strong new
    // password is set, even for clients that bypass app navigation.
    const forcedPassword = 'TempPass123';
    const forcedUser = await User.create({
      name: 'Password Reset Test', email: 'password-reset-test@slg.invalid', phone: '9000000001',
      passwordHash: await bcrypt.hash(forcedPassword, 10), role: 'RESIDENT', mustChangePassword: true,
    });
    const forcedLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier: forcedUser.email, password: forcedPassword }) });
    const forcedToken = forcedLogin.data.token;
    const blockedResource = await request('/payments/overview', { headers: { Authorization: `Bearer ${forcedToken}` } });
    assert(blockedResource.status === 403 && blockedResource.data.code === 'PASSWORD_CHANGE_REQUIRED', 'Temporary password blocks protected API access');
    const weakPassword = await request('/auth/change-password', { method: 'POST', headers: { Authorization: `Bearer ${forcedToken}` }, body: JSON.stringify({ currentPassword: forcedPassword, newPassword: 'weak' }) });
    assert(weakPassword.status === 400, 'Password reset rejects weak new passwords');
    const changedPassword = await request('/auth/change-password', { method: 'POST', headers: { Authorization: `Bearer ${forcedToken}` }, body: JSON.stringify({ currentPassword: forcedPassword, newPassword: 'PermanentPass123' }) });
    const allowedAfterReset = await request('/auth/me', { headers: { Authorization: `Bearer ${forcedToken}` } });
    assert(changedPassword.status === 200 && allowedAfterReset.data.user.mustChangePassword === false, 'Password reset clears the forced-change gate');
    await User.findByIdAndDelete(forcedUser._id);

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

    // 6. The app has no integrated payment gateway; never mark a synthetic payment paid.
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
    assert(payRes.status === 501 && payRes.data.success === false, 'Unconfigured online payment is rejected');

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
    const invalidUploadForm = new FormData();
    invalidUploadForm.append('file', new Blob(['not a png'], { type: 'image/png' }), 'invalid.png');
    const invalidUpload = await fetch(`${baseUrl}/complaints/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: invalidUploadForm,
    });
    assert(invalidUpload.status === 400, 'Reject file whose content does not match its MIME type');

    const uploadForm = new FormData();
    uploadForm.append('file', new Blob(['fixture attachment'], { type: 'text/plain' }), 'fixture.txt');
    const uploadResponse = await fetch(`${baseUrl}/complaints/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: uploadForm,
    });
    const uploadData: any = await uploadResponse.json();
    assert(uploadResponse.status === 200 && uploadData.success, 'Upload complaint file to persistent storage');

    const ticketRes = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({
        category: 'Electrical',
        title: 'Bedside reading lamp flickering',
        description: 'The LED tube near Bed B fluctuates slightly in the evening.',
        priority: 'MEDIUM',
        attachments: uploadData.data ? [uploadData.data] : [],
      }),
    });
    assert(ticketRes.status === 201 && ticketRes.data.success, 'Create Maintenance Ticket');
    testComplaintId = ticketRes.data.data._id;
    const otherResidentComplaint = await request(`/complaints/${testComplaintId}`, {
      headers: { Authorization: `Bearer ${otherResidentToken}` },
    });
    assert(otherResidentComplaint.status === 403, 'Resident cannot read another resident complaint');
    const fileUrl = uploadData.data?.url;
    if (fileUrl) {
      const ownFile = await fetch(`${baseUrl.replace('/api', '')}${fileUrl}`, {
        headers: { Authorization: `Bearer ${residentToken}` },
      });
      const otherResidentFile = await fetch(`${baseUrl.replace('/api', '')}${fileUrl}`, {
        headers: { Authorization: `Bearer ${otherResidentToken}` },
      });
      assert(ownFile.status === 200, 'Complaint owner can download their attachment');
      assert(otherResidentFile.status === 404, 'Another resident cannot download the attachment');
    }

    const protectedStayUpdate = await request('/residents/me', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${residentToken}` },
      body: JSON.stringify({ roomNumber: '999', monthlyRent: 1, role: 'ADMIN' }),
    });
    assert(protectedStayUpdate.status === 403, 'Resident cannot change role, room, or fees');

    // 10. Notices
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

    // 17. Mess Weekly & Alias
    const messWeekly = await request('/mess/weekly', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(messWeekly.status === 200 && messWeekly.data.success, 'Fetch Mess Weekly Menu');

    const messMenuAlias = await request('/mess/menu', {
      headers: { Authorization: `Bearer ${residentToken}` },
    });
    assert(messMenuAlias.status === 200 && messMenuAlias.data.success, 'Mess Menu Alias Working');

    // 18. Admin Emergency Alerts
    const adminEmerg = await request('/admin/emergency', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminEmerg.status === 200 && Array.isArray(adminEmerg.data.data), 'Fetch Admin Emergency Alerts');

    if (adminEmerg.data.data.length > 0) {
      const alertId = adminEmerg.data.data[0]._id;
      const updateAlert = await request(`/admin/emergency/${alertId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          status: 'ACKNOWLEDGED',
          notes: 'Warden dispatched night supervisor to check on resident.',
        }),
      });
      assert(updateAlert.status === 200 && updateAlert.data.success, 'Admin Acknowledge Emergency Alert');
    }

    // 19. Admin Mess Endpoints (Feedback, Opt-Outs, Menu Upsert)
    const adminFeedback = await request('/admin/mess/feedback', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminFeedback.status === 200 && Array.isArray(adminFeedback.data.data), 'Fetch Admin Mess Feedback');

    const adminOptOuts = await request('/admin/mess/opt-outs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOptOuts.status === 200 && adminOptOuts.data.data.totalOptOuts !== undefined, 'Fetch Admin Mess Opt-Out Stats');

    const upsertMenu = await request('/admin/mess/menu', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        dayOfWeek: 'Monday',
        mealType: 'Breakfast',
        items: ['Masala Dosa', 'Coconut Chutney', 'Filter Coffee'],
        timing: '7:30 AM — 9:00 AM',
        isVeg: true,
      }),
    });
    assert(upsertMenu.status === 200 && upsertMenu.data.success, 'Admin Upsert Meal Menu');

    // 20. Admin Operations Endpoints
    const adminResidents = await request('/admin/residents', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminResidents.status === 200 && Array.isArray(adminResidents.data.data), 'Admin Residents List');

    const adminRooms = await request('/admin/rooms', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminRooms.status === 200 && Array.isArray(adminRooms.data.data), 'Admin Rooms & Beds Allocation');

    const adminStaff = await request('/admin/staff', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStaff.status === 200 && Array.isArray(adminStaff.data.data), 'Admin Staff Directory');

    const adminNotices = await request('/admin/notices', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminNotices.status === 200 && Array.isArray(adminNotices.data.data), 'Admin Notices List');
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
