# SLG Luxury Ladies PG — Project Status

## Product

One native Expo / React Native Android app serves residents, wardens, and administrators. A single phone/email and password login uses backend role data to route to resident or administration navigation. The backend is Node.js, Express, TypeScript, MongoDB/Mongoose, JWT, and Socket.IO.

The location and identity are SLG Luxury Ladies PG, KPHB / Kukatpally, Hyderabad, Telangana. The Stitch-inspired visual system uses Royal Violet, Soft Lavender, Rose, charcoal, and light surfaces.

## Existing application areas

Resident routes cover Home, My Stay, Services, Notices, Profile, Fees, Food, Complaints, Emergency, and Documents. Administrator routes cover Dashboard, Residents, Floors & Rooms, Payments, Food, Complaints, Notices, Emergency, Reports, and Staff. These use the shared authenticated API and role-protected backend routes.

Development seed data is for local development and automated integration tests only. Production startup requires a configured JWT secret and persistent MongoDB; automatic and manual development seeding are disabled in production. Complaint uploads are stored in MongoDB GridFS and protected by complaint ownership checks.

## Build and deployment gates

Before distribution, the operator must link a real EAS project, configure EAS production environment `EXPO_PUBLIC_API_URL` to the deployed HTTPS API, configure signing credentials, deploy the API and cloud MongoDB, and verify sign-in and resident/admin journeys on physical Android devices. The repository deliberately has no fabricated EAS project ID or production credentials. Metro export validates the Android JavaScript/Hermes bundle; it does not create or sign an installable APK.

## Remaining implementation work

- Add complete resident profile edit, resident edit/deactivation controls, pagination for admin lists, and hostel settings administration.
- Finish staff account/roster mutations and detailed payment-reference rejection workflows.
- Add mobile authenticated attachment viewing/downloading for GridFS files; upload, association, persistence, and server-side access checks are implemented.
- Configure and verify production cloud services, push delivery, backups, APK signing, QR page hosting, and device installation. No live production services or signing credentials were supplied in this workspace.

Development test command `backend/npm test` clears and reseeds the MongoDB database configured by `backend/.env`; use a disposable development database only.
