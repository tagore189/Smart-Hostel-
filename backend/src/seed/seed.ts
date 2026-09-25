import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db';
import { env } from '../config/env';
import {
  User,
  Resident,
  Staff,
  Building,
  Floor,
  Room,
  Bed,
  Payment,
  Invoice,
  Receipt,
  Complaint,
  MealMenu,
  MealFeedback,
  Notice,
  ResidentDocument,
  EmergencyContact,
  HostelSettings,
} from '../models';

export const runSeed = async (shouldCloseDB: boolean = false) => {
  if (env.NODE_ENV === 'production') {
    throw new Error('Development seed data is disabled in production.');
  }
  console.log('--- [SEEDING] Starting SLG Luxury Ladies PG Database Seeding ---');

  // Connect
  await connectDB();

  // Clear existing collections safely
  await Promise.all([
    User.deleteMany({}),
    Resident.deleteMany({}),
    Staff.deleteMany({}),
    Building.deleteMany({}),
    Floor.deleteMany({}),
    Room.deleteMany({}),
    Bed.deleteMany({}),
    Payment.deleteMany({}),
    Invoice.deleteMany({}),
    Receipt.deleteMany({}),
    Complaint.deleteMany({}),
    MealMenu.deleteMany({}),
    MealFeedback.deleteMany({}),
    Notice.deleteMany({}),
    ResidentDocument.deleteMany({}),
    EmergencyContact.deleteMany({}),
    HostelSettings.deleteMany({}),
  ]);
  console.log('✓ Cleared previous database collections');

  // 1. Hostel Settings
  const settings = await HostelSettings.create({
    hostelName: 'SLG Luxury Ladies PG',
    tagline: 'Safe, Luxurious, High-Trust Living for Women',
    doorOrPlotNumber: 'Plot No. 142 & 143',
    streetName: 'Road No. 2, KPHB Phase 1',
    locality: 'KPHB / Kukatpally',
    landmark: 'Behind Forum Sujana Mall, near KPHB Colony Metro Station',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500072',
    country: 'India',
    phonePrimary: '+91 98765 43210',
    phoneWarden: '+91 98765 43210',
    phoneSecurity: '+91 98765 43211',
    emailContact: 'concierge@slgluxurypg.com',
    standardMonthlyRent: 8000,
    securityDepositAmount: 10000,
    breakfastTiming: '8:00 AM – 10:00 AM',
    lunchTiming: '12:30 PM – 2:30 PM',
    dinnerTiming: '7:30 PM – 9:30 PM',
    rules: [
      'Quiet hours observed between 11:00 PM and 6:00 AM.',
    ],
  });
  console.log('✓ Created Hostel Settings for KPHB / Kukatpally, Hyderabad');

  // 2. Building & Floors
  const building = await Building.create({
    name: 'SLG Luxury Tower',
    address: 'Plot 142 & 143, Road No. 2, KPHB Phase 1',
    locality: 'KPHB / Kukatpally',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500072',
    totalFloors: 4,
  });

  const floors = await Promise.all([
    Floor.create({ building: building._id, floorNumber: 1, name: '1st Floor - Wing A & B', totalRooms: 6 }),
    Floor.create({ building: building._id, floorNumber: 2, name: '2nd Floor - Wing A & B', totalRooms: 6 }),
    Floor.create({ building: building._id, floorNumber: 3, name: '3rd Floor - Wing A & B', totalRooms: 6 }),
    Floor.create({ building: building._id, floorNumber: 4, name: '4th Floor - Terrace & Dining', totalRooms: 4 }),
  ]);
  console.log('✓ Created Building & 4 Floors');

  // 3. Rooms & Beds (focus on Room 204)
  const floor2 = floors[1];
  const room204 = await Room.create({
    roomNumber: '204',
    floor: floor2._id,
    floorNumber: 2,
    wing: 'Wing A',
    type: 'Double',
    totalBeds: 2,
    rentAmount: 8000,
    securityDeposit: 10000,
    facilities: ['High-speed 5G Wi-Fi', 'Attached Bathroom', 'Split AC', 'Geyser', 'Study Desk', 'Individual Wardrobe'],
    isActive: true,
  });

  // Other rooms for realistic floor visualizer
  const otherRooms = await Promise.all([
    Room.create({ roomNumber: '201', floor: floor2._id, floorNumber: 2, wing: 'Wing A', type: 'Single', totalBeds: 1, rentAmount: 12000, securityDeposit: 15000, facilities: ['AC', 'Attached Bath'] }),
    Room.create({ roomNumber: '202', floor: floor2._id, floorNumber: 2, wing: 'Wing A', type: 'Double', totalBeds: 2, rentAmount: 8000, securityDeposit: 10000, facilities: ['AC', 'Attached Bath'] }),
    Room.create({ roomNumber: '203', floor: floor2._id, floorNumber: 2, wing: 'Wing A', type: 'Triple', totalBeds: 3, rentAmount: 6500, securityDeposit: 8000, facilities: ['AC', 'Attached Bath'] }),
    Room.create({ roomNumber: '205', floor: floor2._id, floorNumber: 2, wing: 'Wing B', type: 'Double', totalBeds: 2, rentAmount: 8000, securityDeposit: 10000, facilities: ['AC', 'Attached Bath'] }),
    Room.create({ roomNumber: '206', floor: floor2._id, floorNumber: 2, wing: 'Wing B', type: 'Double', totalBeds: 2, rentAmount: 8000, securityDeposit: 10000, facilities: ['AC', 'Attached Bath'] }),
  ]);

  const bed204A = await Bed.create({ room: room204._id, roomNumber: '204', bedCode: 'A', status: 'OCCUPIED', monthlyRent: 8000 });
  const bed204B = await Bed.create({ room: room204._id, roomNumber: '204', bedCode: 'B', status: 'OCCUPIED', monthlyRent: 8000 }); // Ananya's bed!

  // Create beds for other rooms
  for (const r of otherRooms) {
    for (let i = 0; i < r.totalBeds; i++) {
      const code = String.fromCharCode(65 + i);
      await Bed.create({
        room: r._id,
        roomNumber: r.roomNumber,
        bedCode: code,
        status: (i % 2 === 0 ? 'OCCUPIED' : 'AVAILABLE'),
        monthlyRent: r.rentAmount,
      });
    }
  }
  console.log('✓ Created Rooms & Beds including Room 204 (Bed A & Bed B)');

  // 4. Users:
  // - Resident: Ananya Sharma
  // - Roommate: Sneha Patel (Room 204 Bed A)
  // - Warden: Mrs. Shanti Reddy
  // - Owner / Super Admin: S. Laxmi Gangadhar (SLG Management)
  // - Staff: Ramesh (Maintenance Tech), Priya (Security Desk)
  const defaultPassword = await bcrypt.hash('Welcome@123', 10);

  const residentUser = await User.create({
    name: 'Ananya Sharma',
    email: 'ananya.sharma@slgluxury.com',
    phone: '+91 98765 00204',
    passwordHash: defaultPassword,
    role: 'RESIDENT',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7ODzjBVdQPfhEEBkXWii1E00hqLuvN0h7p64rwEWq0Mq0Ldyks1OJ_-vTwdW1gm9uUf5xplF0cmC_lIptsLhTbp6YoGsh6MC3v6bM7pEG4ZFr8mISBQXr6cL2wzBv8fkYXTJTP1ECUjzjz6BZKFyrn-iPBE5eb5bmAOMjGJhN1XPfkohXPBh2HHut5y8vqilr2YrFwld3URvqZS7yY5TEBaEU8PoCWFONXmS9TnNqnUFzlpxYf1VW',
    isActive: true,
  });

  const roommateUser = await User.create({
    name: 'Sneha Patel',
    email: 'sneha.patel@slgluxury.com',
    phone: '+91 98765 00201',
    passwordHash: defaultPassword,
    role: 'RESIDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isActive: true,
  });

  const wardenUser = await User.create({
    name: 'Mrs. Shanti Reddy',
    email: 'shanti.reddy@slgluxury.com',
    phone: '+91 98765 43210',
    passwordHash: defaultPassword,
    role: 'WARDEN',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    isActive: true,
  });

  const adminUser = await User.create({
    name: 'SLG Admin',
    email: 'admin@slgluxury.com',
    phone: '+91 98765 99999',
    passwordHash: defaultPassword,
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    isActive: true,
  });

  const securityUser = await User.create({
    name: 'Priya Narang',
    email: 'security.priya@slgluxury.com',
    phone: '+91 98765 43211',
    passwordHash: defaultPassword,
    role: 'STAFF',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    isActive: true,
  });

  console.log('✓ Created Core Users: Resident Ananya Sharma, Warden Mrs. Shanti Reddy, Admin, Staff');

  // 5. Resident Profile for Ananya Sharma
  const resident = await Resident.create({
    user: residentUser._id,
    name: 'Ananya Sharma',
    phone: '+91 98765 00204',
    email: 'ananya.sharma@slgluxury.com',
    room: room204._id,
    roomNumber: '204',
    bed: bed204B._id,
    bedCode: 'B',
    floorNumber: 2,
    wing: 'Wing A',
    kycVerified: true,
    checkedIn: true,
    joiningDate: new Date('2026-01-10'),
    agreementStartDate: new Date('2026-01-10'),
    agreementEndDate: new Date('2026-12-31'),
    monthlyRent: 8000,
    securityDeposit: 10000,
    agreementType: '11 Months Standard Residential (Single Occupancy Bed)',
    emergencyContact: {
      name: 'Rajesh Sharma',
      relation: 'Father',
      phone: '+91 98480 12345',
    },
    workOrCollege: 'Lead Product Designer @ Tech Mahindra Hitec City',
    homeAddress: 'Plot 42, Green Glen Layout, Hyderabad, Telangana',
    status: 'ACTIVE',
  });

  bed204B.currentResident = resident._id as any;
  await bed204B.save();

  // Resident Profile for Sneha Patel (Roommate)
  const roommate = await Resident.create({
    user: roommateUser._id,
    name: 'Sneha Patel',
    phone: '+91 98765 00201',
    email: 'sneha.patel@slgluxury.com',
    room: room204._id,
    roomNumber: '204',
    bed: bed204A._id,
    bedCode: 'A',
    floorNumber: 2,
    wing: 'Wing A',
    kycVerified: true,
    checkedIn: true,
    joiningDate: new Date('2026-02-01'),
    agreementStartDate: new Date('2026-02-01'),
    agreementEndDate: new Date('2026-12-31'),
    monthlyRent: 8000,
    securityDeposit: 10000,
    emergencyContact: {
      name: 'Kiran Patel',
      relation: 'Father',
      phone: '+91 98480 99887',
    },
    workOrCollege: 'Data Scientist @ Microsoft IDC, Gachibowli',
    homeAddress: 'D-304, Cyber Heights, Hyderabad',
    status: 'ACTIVE',
  });

  bed204A.currentResident = roommate._id as any;
  await bed204A.save();

  // 6. Staff Records
  await Staff.create([
    {
      user: wardenUser._id,
      name: 'Mrs. Shanti Reddy',
      phone: '+91 98765 43210',
      role: 'Chief Residential Warden',
      department: 'Administration',
      status: 'ACTIVE',
      shift: 'DAY',
      emergencyContact: '+91 98765 43200',
    },
    {
      user: securityUser._id,
      name: 'Priya Narang',
      phone: '+91 98765 43211',
      role: 'Head of Women Security Desk',
      department: 'Security',
      status: 'ACTIVE',
      shift: 'ROTATIONAL',
      emergencyContact: '+91 98765 43201',
    },
  ]);

  // 7. Payments for Ananya Sharma
  // September rent paid (Matches Stitch code.html: ₹8,000 Paid, Next Due 05 Oct 2026, Receipt SLG-REC-202609-0204)
  const sepPayment = await Payment.create({
    resident: resident._id,
    residentName: resident.name,
    roomNumber: resident.roomNumber,
    amount: 8000,
    type: 'RENT',
    status: 'PAID',
    method: 'UPI',
    transactionId: 'TXN-SLG-20260901-8931',
    receiptNumber: 'SLG-REC-202609-0204',
    dueDate: new Date('2026-09-05'),
    paidAt: new Date('2026-09-01'),
    month: 'September 2026',
    notes: 'Paid via PhonePe UPI',
  });

  await Receipt.create({
    payment: sepPayment._id,
    resident: resident._id,
    receiptNumber: 'SLG-REC-202609-0204',
    amount: 8000,
    date: new Date('2026-09-01'),
    method: 'UPI (PhonePe)',
  });

  // August rent paid
  const augPayment = await Payment.create({
    resident: resident._id,
    residentName: resident.name,
    roomNumber: resident.roomNumber,
    amount: 8000,
    type: 'RENT',
    status: 'PAID',
    method: 'UPI',
    transactionId: 'TXN-SLG-20260802-7721',
    receiptNumber: 'SLG-REC-202608-0204',
    dueDate: new Date('2026-08-05'),
    paidAt: new Date('2026-08-02'),
    month: 'August 2026',
  });

  await Receipt.create({
    payment: augPayment._id,
    resident: resident._id,
    receiptNumber: 'SLG-REC-202608-0204',
    amount: 8000,
    date: new Date('2026-08-02'),
    method: 'UPI (Google Pay)',
  });

  // Initial Security deposit paid
  await Payment.create({
    resident: resident._id,
    residentName: resident.name,
    roomNumber: resident.roomNumber,
    amount: 10000,
    type: 'SECURITY_DEPOSIT',
    status: 'PAID',
    method: 'NETBANKING',
    transactionId: 'TXN-SLG-20260110-1002',
    receiptNumber: 'SLG-DEP-202601-0204',
    dueDate: new Date('2026-01-10'),
    paidAt: new Date('2026-01-10'),
    month: 'January 2026',
    notes: 'Refundable Security Deposit upon checkout',
  });

  // Upcoming October invoice
  await Invoice.create({
    resident: resident._id,
    invoiceNumber: 'INV-202610-0204',
    month: 'October',
    year: 2026,
    totalAmount: 8000,
    items: [
      { description: 'Room 204 Monthly Accommodation Fee', amount: 7000 },
      { description: 'High-speed Wi-Fi & Housekeeping Services', amount: 1000 },
    ],
    dueDate: new Date('2026-10-05'),
    status: 'PENDING',
  });
  console.log('✓ Created Payments & Invoices (September Rent Paid ₹8,000, Security Deposit ₹10,000)');

  // 8. Meal Menus (Matching Stitch code.html items)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  for (const day of days) {
    await MealMenu.create([
      {
        dayOfWeek: day,
        mealType: 'Breakfast',
        timing: '8:00 AM – 10:00 AM',
        items: ['Idli with Sambar & Coconut Chutney', 'Medu Vada', 'Filter Coffee / Tea', 'Fresh Papaya slices'],
        isSpecial: day === 'Sunday',
        specialTitle: day === 'Sunday' ? 'Poori Masala & Kesari' : undefined,
        calories: 380,
      },
      {
        dayOfWeek: day,
        mealType: 'Lunch',
        timing: '12:30 PM – 2:30 PM',
        items: ['Hyderabadi Veg Biryani', 'Mirchi Ka Salan', 'Thick Onion Raita', 'Steamed Rice with Tomato Dal', 'Curd'],
        isSpecial: false,
        calories: 550,
      },
      {
        dayOfWeek: day,
        mealType: 'Snacks',
        timing: '5:00 PM – 6:00 PM',
        items: ['Masala Chai', 'Hot Onion Pakodas / Samosa', 'Green Mint Chutney'],
        isSpecial: false,
        calories: 220,
      },
      {
        dayOfWeek: day,
        mealType: 'Dinner',
        timing: '7:30 PM – 9:30 PM',
        items: ['Paneer Butter Masala', 'Fresh Phulkas', 'Jeera Rice', 'Yellow Dal Tadka', 'Gulab Jamun'],
        isSpecial: day === 'Sunday',
        specialTitle: day === 'Sunday' ? 'Dussehra Special Feast' : undefined,
        calories: 620,
      },
    ]);
  }
  console.log('✓ Created 7-Day Meal Menus with Breakfast, Lunch, Snacks, Dinner');

  // 9. Community Notices (From Stitch reference)
  await Notice.create([
    {
      title: 'Overhead Tank Cleaning',
      content: 'Water supply will be paused from 10:00 AM to 1:00 PM. Please store sufficient drinking water. Geysers should be turned off during cleaning.',
      category: 'Maintenance',
      priority: 'HIGH',
      audienceScope: 'ALL',
      iconName: 'water_damage',
      publishedBy: wardenUser._id,
      publishedByName: 'Mrs. Shanti Reddy (Warden)',
      effectiveDate: 'Tomorrow, 10:00 AM',
    },
    {
      title: 'Dussehra Feast & Sweets',
      content: 'Traditional multi-course grand dinner organized in the central dining hall starting 8:00 PM. All residents cordially invited!',
      category: 'Mess',
      priority: 'NORMAL',
      audienceScope: 'ALL',
      iconName: 'celebration',
      publishedBy: wardenUser._id,
      publishedByName: 'SLG Food & Beverage Team',
      effectiveDate: 'Sunday Evening',
    },
    {
      title: 'Wi-Fi Router Firmware Upgrade',
      content: 'Wing A and Wing B routers will restart briefly at 2:00 PM (10 mins expected downtime) to boost bandwidth to 300 Mbps.',
      category: 'Maintenance',
      priority: 'NORMAL',
      audienceScope: 'ALL',
      iconName: 'router',
      publishedBy: adminUser._id,
      publishedByName: 'IT Operations Desk',
      effectiveDate: 'Friday, 2:00 PM',
    },
    {
      title: 'Biometric Access Verification',
      content: 'All verified residents are requested to confirm their biometric fingerprint registration with the security desk if you notice any door delay.',
      category: 'Important',
      priority: 'HIGH',
      audienceScope: 'ALL',
      iconName: 'fingerprint',
      publishedBy: securityUser._id,
      publishedByName: 'Head of Security Desk',
    },
  ]);
  console.log('✓ Created Community Notices');

  // 10. Sample Complaint for Ananya
  await Complaint.create({
    resident: resident._id,
    residentName: resident.name,
    roomNumber: resident.roomNumber,
    category: 'AC/Fan',
    title: 'AC cooling temperature fluctuates',
    description: 'The split AC in Room 204 takes around 40 minutes to cool and sometimes makes a faint humming vibration at night.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedStaffName: 'Ramesh Kumar (HVAC Technician)',
    timeline: [
      {
        status: 'SUBMITTED',
        note: 'Ticket registered by resident.',
        updatedBy: resident.name,
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        status: 'ASSIGNED',
        note: 'Assigned to Ramesh Kumar for inspection.',
        updatedBy: 'Mrs. Shanti Reddy',
        timestamp: new Date(Date.now() - 43200000),
      },
      {
        status: 'IN_PROGRESS',
        note: 'Filter cleaned, refrigerant pressure checked. Scheduled for final seal check today at 4:30 PM.',
        updatedBy: 'Ramesh Kumar',
        timestamp: new Date(),
      },
    ],
  });

  // 11. Resident Documents
  await ResidentDocument.create([
    {
      resident: resident._id,
      title: 'Aadhaar Card (UIDAI Verified)',
      type: 'AADHAAR',
      fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      fileName: 'Aadhaar_Ananya_Sharma_XXXX.pdf',
      fileSize: '1.4 MB',
      verified: true,
    },
    {
      resident: resident._id,
      title: '11-Month Rental Agreement',
      type: 'RENTAL_AGREEMENT',
      fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      fileName: 'SLG_Rental_Agreement_2026_Room204.pdf',
      fileSize: '3.1 MB',
      verified: true,
    },
    {
      resident: resident._id,
      title: 'Corporate Employee ID Card',
      type: 'EMPLOYMENT_ID',
      fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      fileName: 'TechMahindra_CorpID_Ananya.pdf',
      fileSize: '850 KB',
      verified: true,
    },
  ]);

  // 14. Emergency Contacts (Hostel Responders & National Helplines)
  await EmergencyContact.create([
    {
      name: 'Mrs. Shanti Reddy',
      role: 'WARDEN',
      phone: '+91 98765 43210',
      designation: '24/7 Residential Warden (Ground Floor Suite 101)',
      isAvailable24x7: true,
      priorityOrder: 1,
    },
    {
      name: 'Main Security Gate & Guard Desk',
      role: 'SECURITY_DESK',
      phone: '+91 98765 43211',
      designation: '24/7 Security Operations Room & Guard Post',
      isAvailable24x7: true,
      priorityOrder: 2,
    },
    {
      name: 'National Women Helpline',
      role: 'WOMEN_HELPLINE',
      phone: '1091',
      alternatePhone: '181',
      designation: 'Ministry of Women and Child Development (Toll-Free 24x7)',
      isAvailable24x7: true,
      priorityOrder: 3,
    },
    {
      name: 'Telangana Emergency Response / Police',
      role: 'POLICE',
      phone: '112',
      alternatePhone: '100',
      designation: 'KPHB Police Station & Dial 112 Dispatch',
      isAvailable24x7: true,
      priorityOrder: 4,
    },
    {
      name: 'Emergency Medical & Ambulance',
      role: 'AMBULANCE',
      phone: '108',
      alternatePhone: '+91 40 2311 0000',
      designation: '108 Emergency Ambulance / OMNI Hospitals Kukatpally (1.2 km)',
      isAvailable24x7: true,
      priorityOrder: 5,
    },
  ]);
  console.log('✓ Created Emergency Contacts (Warden, Security Desk, Women Helpline 1091, Police 112, Medical 108)');

  console.log('\n============================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  console.log('Canonical Demo Resident:');
  console.log('  Name: Ananya Sharma');
  console.log('  Email: ananya.sharma@slgluxury.com / Password: Welcome@123');
  console.log('  Phone: +91 98765 00204');
  console.log('  Room: 204 · Bed: B (2nd Floor, Wing A)');
  console.log('  Rent: ₹8,000/mo (Paid) · Deposit: ₹10,000');
  console.log('  Location: KPHB / Kukatpally, Hyderabad, Telangana');
  console.log('\nCanonical Demo Warden:');
  console.log('  Name: Mrs. Shanti Reddy');
  console.log('  Email: shanti.reddy@slgluxury.com / Password: Welcome@123');
  console.log('  Phone: +91 98765 43210');
  console.log('============================================================\n');

  if (shouldCloseDB) {
    await closeDB();
  }
};

if (require.main === module) {
  runSeed(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
