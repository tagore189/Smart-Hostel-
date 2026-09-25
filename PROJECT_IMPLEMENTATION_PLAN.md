# Project Implementation Plan: SLG Luxury Ladies PG Mobile Application

## 1. Executive Summary & Architecture Strategy
**SLG Luxury Ladies PG** is a complete, installable mobile application designed specifically for residents living at SLG Luxury Ladies PG in **KPHB / Kukatpally, Hyderabad, Telangana, India**, with an accompanying mobile-first administration interface for hostel owners, admins, wardens, and staff.

### Technology Stack
- **Mobile Client**: Genuine React Native with Expo SDK 52+, Expo Router (file-based routing), TypeScript, and React Native StyleSheet.
- **Visual Foundation**: 1:1 translation of Stitch "Sanctuary Haven" design system (`#7C3AED` Royal Violet, `#F43F5E` Rose Blush, `#EDE9FE` Soft Lavender, `#FBFBFE` canvas, Manrope typography, 16px gutters, rounded cards, subtle shadows).
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, MongoDB, Socket.IO for real-time alerts.
- **Native APIs**:
  - `expo-secure-store` for authenticated tokens and sessions
  - `expo-notifications` for push notifications (Rent due, Complaint status, Passes, SOS)
  - `expo-image-picker` for complaint photo attachment
  - `expo-location` for explicit emergency SOS location dispatch
  - `react-native-qrcode-svg` for gate passes and visitor passes
  - React Native `Linking` (`tel:`) for one-tap calling with safety confirmation modals
- **State Management**: TanStack Query (`@tanstack/react-query`) for server state caching and optimistic updates, lightweight React Context for session/auth state.

---

## 2. Directory Structure

```
SLG HOSTEL/
├── stitch-reference/
│   ├── DESIGN.md
│   └── code.html
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── src/
│   │   ├── config/ (db.ts, env.ts)
│   │   ├── controllers/ (auth, residents, rooms, payments, complaints, mess, outings, visitors, notices, emergency, admin)
│   │   ├── middleware/ (auth.ts, role.ts, validate.ts, errorHandler.ts)
│   │   ├── models/ (User, Resident, Staff, Building, Floor, Room, Bed, Payment, Invoice, Receipt, Complaint, ComplaintComment, MaintenanceAssignment, MealMenu, MealFeedback, MealOptOut, OutingRequest, GatePass, Visitor, VisitorPass, Notice, NoticeRead, Document, EmergencyContact, EmergencyAlert, Notification, HostelSettings, AuditLog)
│   │   ├── routes/ (auth, residents, rooms, payments, complaints, mess, outings, visitors, notices, emergency, admin)
│   │   ├── services/ (socket.ts, notification.ts)
│   │   ├── seed/ (seed.ts)
│   │   └── server.ts
├── mobile/
│   ├── package.json
│   ├── tsconfig.json
│   ├── app.json
│   ├── app/
│   │   ├── _layout.tsx (Root layout with QueryProvider, AuthProvider, ThemeProvider)
│   │   ├── index.tsx (Auth gate & redirect)
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── otp.tsx
│   │   ├── (resident)/
│   │   │   ├── _layout.tsx (5 bottom tabs: Home, My Stay, Services, Notices, Profile)
│   │   │   ├── home.tsx
│   │   │   ├── my-stay.tsx
│   │   │   ├── services.tsx
│   │   │   ├── notices.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── mess/ (index.tsx, menu.tsx, feedback.tsx)
│   │   │   ├── maintenance/ (index.tsx, new-ticket.tsx, [id].tsx)
│   │   │   ├── outing/ (index.tsx, request.tsx, pass.tsx)
│   │   │   ├── visitors/ (index.tsx, register.tsx, pass.tsx)
│   │   │   ├── payments/ (index.tsx, breakdown.tsx, receipt.tsx)
│   │   │   └── emergency/ (index.tsx)
│   │   └── (admin)/
│   │       ├── _layout.tsx
│   │       ├── dashboard.tsx
│   │       ├── residents/ (index.tsx, [id].tsx, new.tsx)
│   │       ├── rooms/ (index.tsx, [id].tsx)
│   │       ├── payments/ (index.tsx)
│   │       ├── complaints/ (index.tsx, [id].tsx)
│   │       ├── outings/ (index.tsx)
│   │       ├── visitors/ (index.tsx)
│   │       ├── mess/ (index.tsx, edit-menu.tsx)
│   │       ├── notices/ (index.tsx, compose.tsx)
│   │       ├── staff/ (index.tsx)
│   │       └── reports/ (index.tsx)
│   ├── components/ (AppHeader, PrimaryButton, SecondaryButton, Card, StatusBadge, BottomSheet, ConfirmDialog, LoadingState, EmptyState, ErrorState, Timeline, FormField, QRCodeCard, RoomCard, MealCard, NoticeCard, PaymentCard, ComplaintCard)
│   ├── constants/ (Colors, Typography, Layout, Config)
│   ├── context/ (AuthContext.tsx)
│   ├── hooks/ (useAuth, useNotifications, useLocation, useSocket)
│   └── services/ (api.ts, authService.ts, storage.ts)
├── docs/
│   ├── ARCHITECTURE.md
│   └── API.md
└── README.md
```

---

## 3. Implementation Phases

### Phase 1: Foundation & Backend Setup
- Configure TypeScript Node.js Express backend.
- Define 20+ Mongoose models with proper indexes and schema validations.
- Implement JWT and OTP authentication with role-based middleware (`SUPER_ADMIN`, `ADMIN`, `WARDEN`, `STAFF`, `RESIDENT`).
- Implement comprehensive seed script with canonical development identities:
  - Resident: **Ananya Sharma**, Room **204**, Bed **B**, 2nd Floor, Wing A, Rent ₹8,000, Security Deposit ₹10,000.
  - Location: **KPHB / Kukatpally, Hyderabad, Telangana, India**.
  - Warden: **Mrs. Shanti Reddy** (+91 98765 43210).
  - Pre-seeded rooms, meal menus, community notices, maintenance tickets, outings, and visitors.
- Connect MongoDB with fallback support.

### Phase 2: React Native + Expo App Setup & Stitch Theme Engine
- Initialize clean Expo React Native TypeScript project with Expo Router.
- Setup Stitch Design System tokens:
  - Primary `#7C3AED`, Secondary `#F43F5E`, Soft Lavender `#EDE9FE`, Canvas `#FBFBFE`, Card `#FFFFFF`, Text `#1E1B2E`, Success `#10B981`, Warning `#F59E0B`, Emergency `#EF4444`.
  - Load Manrope font weights (400, 600, 700, 800) and MaterialIcons / Lucide native vector icons.
- Implement reusable UI primitives: `AppHeader`, `PrimaryButton`, `SecondaryButton`, `Card`, `StatusBadge`, `FormField`, `ConfirmDialog`, `BottomSheet`, `LoadingState`, `EmptyState`, `ErrorState`.
- Configure `AuthContext` with `expo-secure-store` and `TanStack Query` client with network resilience.

### Phase 3: Resident Core Application (5 Bottom Tabs)
- **Home Screen**:
  - Header greeting: "Good evening, Ananya" with "Verified Resident" badge.
  - Room 204 Context Card with Bed B, 2nd floor, checked-in badge, and Wi-Fi key copy button.
  - Rent Overview Card: ₹8,000 Paid status, next due date (05 Oct 2026), receipt ID.
  - Today's Meals Timeline: Breakfast, Lunch (completed), Dinner (upcoming highlight with menu details).
  - 2-Column Quick Actions: Mess & Menu, Raise Ticket, Outing Pass, Visitor Entry.
  - Community Notices feed preview.
  - Prominent Emergency Assistance Safety card.
- **My Stay**:
  - Room details, bed allocation, floor, roommates, agreement type, ₹8,000 rent, ₹10,000 deposit, payment history, KYC/ID documents.
- **Services Hub**:
  - 10 functional services: Mess Menu, Maintenance, Gate Pass, Visitors, Rent & UPI, Housekeeping, Wi-Fi Help, Notices, First Aid, 24/7 Security & SOS. Real navigation for each.
- **Notices**:
  - Filterable by categories (All, Important, Mess, Maintenance, Finance, Events), full read modal, mark as read.
- **Profile**:
  - Ananya Sharma avatar, Room 204 Bed B, verified contacts, emergency contact, stay timeline, app settings, logout.

### Phase 4: Resident Service Deep Dives
- **Mess**: Daily & weekly meals, calorie/item details, 5-star ratings, meal feedback submission, meal opt-out toggles.
- **Maintenance**: Category selector (Electrical, Plumbing, AC/Fan, Wi-Fi, Cleaning, Furniture, Bathroom, Other), photo picker with compression, priority rating, real-time ticket creation, timeline tracking.
- **Outing & Gate Pass**: Outing request form, warden approval workflow, high-res QR pass rendering.
- **Visitors**: Pre-registration, approved visitor pass generation with visitor details & QR.
- **Payments**: Rent invoices, security deposit, development payment mode simulation with server validation, receipt generation.
- **Emergency SOS & Silent Welfare Alert**:
  - Warden call (+91 98765 43210), Security desk call (+91 98765 43211), Women Helpline (1091), Police (112), Ambulance (108).
  - Explicit confirmation dialog for calls.
  - **Silent Welfare Alert**: Native confirmation modal -> dispatches alert to backend socket and DB with coordinates and resident details -> instant feedback.

### Phase 5: Mobile Admin / Warden Application
- Role-based switcher/login into `(admin)`.
- **Admin Dashboard**: Live metrics from database (Residents, Occupied Beds, Available Beds, Pending Rent, Overdue, Open Tickets, Today's Visitors, Today's Outings).
- **Resident Management**: Resident list, room/bed assignment, status toggles, payment & complaint tabs.
- **Room Management**: Wing A & Wing B room visualizer, bed statuses (Available, Occupied, Maintenance, Reserved).
- **Payments**: Search, filter by status (Paid, Pending, Overdue), record manual offline payments.
- **Complaints Desk**: Triage tickets, update status (Submitted -> Assigned -> In Progress -> Resolved -> Closed), assign staff.
- **Outing & Visitor Passes**: Pending queue with instant One-Tap Approve / Reject actions.
- **Mess Management**: Update today's and weekly meal menus, view resident opt-outs count.
- **Notices Publisher**: Broadcast announcements targeting All residents, specific floor, or specific room.
- **Staff Roster**: Active staff members across Security, Kitchen, Housekeeping, Maintenance.
- **Reports**: Occupancy breakdown, revenue summary, complaint resolution time metrics.

### Phase 6: Testing, Native Verification & Documentation
- Comprehensive backend automated integration tests for Auth, Roles, Complaints, Passes, Emergency.
- Verification of mobile bundle, navigation, offline resilience, and mock APK readiness.
- Complete documentation: `README.md`, `ARCHITECTURE.md`, `API.md`.
