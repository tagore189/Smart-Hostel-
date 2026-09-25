# SLG Luxury Ladies PG

Native Android resident and hostel operations application for SLG Luxury Ladies PG, KPHB / Kukatpally, Hyderabad, Telangana. One Expo APK authenticates against the API and routes residents to resident services and administrators/wardens to the operations console.

## Architecture

- `mobile/`: React Native, Expo Router, TypeScript, TanStack Query, SecureStore.
- `backend/`: Node.js, Express, TypeScript, Mongoose, MongoDB, JWT, Socket.IO.
- Complaint attachments use MongoDB GridFS so uploads persist with the configured MongoDB deployment.

The API is the source of truth. Do not put database credentials, JWT secrets, UPI credentials, or other private service keys in the mobile environment. `EXPO_PUBLIC_API_URL` is public app configuration and must contain only the API's HTTPS base URL.

## Roles and navigation

- `RESIDENT`: Home, My Stay, Services, Notices, Profile; services include fees, food, complaints, emergency and documents.
- `WARDEN`, `ADMIN`, `SUPER_ADMIN`: dashboard, residents, floors/rooms, payments, food, complaints, notices, emergency, reports and staff.
- Login is a single phone/email and password form. The API supplies the role. Server routes also enforce authorization.

## Local setup

Install Node.js and MongoDB, then:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Use a development-only `JWT_SECRET` in `backend/.env`; a development seed is created only when the development database is empty. Never copy seed credentials into production. The development API defaults to port 5000 and uses an in-memory MongoDB fallback only outside production.

In another terminal:

```powershell
cd mobile
npm install
```

Set `EXPO_PUBLIC_API_URL` to the reachable API base including `/api`. Android emulator default is `http://10.0.2.2:5000/api`; physical devices need the development machine's LAN address. Then run:

```powershell
npm run typecheck
npm start
```

For the backend, run `npm run build` and `npm test` from `backend/`.

## Production deployment

Deploy the backend to a persistent Node host, provision a cloud MongoDB deployment, and set these server environment values in the hosting provider:

- `NODE_ENV=production`
- `MONGODB_URI` to the cloud MongoDB connection string
- `JWT_SECRET` to a random secret of at least 32 characters
- `JWT_EXPIRES_IN` to the chosen token lifetime (for example `1d`)
- `CLIENT_URL` to the explicit allowed web origin; do not use `*`
- `PORT` if required by the host
- `HOSTEL_NAME`, `HOSTEL_LOCALITY`, `HOSTEL_CITY`, `HOSTEL_STATE`

Production refuses to start without a persistent non-local MongoDB URI and a non-wildcard client origin. Configure TLS/HTTPS at the hosting provider. Ensure MongoDB network access and backups are configured. Do not run seed commands against production.

## Android APK

Set `EXPO_PUBLIC_API_URL` to the deployed HTTPS `/api` endpoint in the EAS `production` environment. Then authenticate/link this checkout to the organization's real Expo account and project (the repository intentionally contains no invented EAS project ID):

```powershell
cd mobile
npx eas-cli login
npx eas-cli init
npx eas-cli env:create --name EXPO_PUBLIC_API_URL --value https://YOUR_HOST/api --environment production --visibility plaintext
npx eas-cli build --platform android --profile production
```

EAS will request or configure Android signing credentials. The production profile creates one installable APK for resident, warden, and admin use. Do not distribute a build until the backend URL, EAS project, and signing credentials are real and configured.

## Resident QR distribution

Host [distribution/index.html](distribution/index.html) over HTTPS and place the signed APK at `/downloads/slg-luxury-ladies-pg.apk` on the same host (or update the page's link). Generate the resident QR code from that HTTPS page URL only. The QR must not encode credentials, resident identifiers, or tokens. Staff can distribute the same APK directly.

## Verification

```powershell
cd mobile
npm run typecheck
npm run build
cd ..\backend
npm run build
npm test
```

These checks validate compilation and the backend integration suite; they do not install the APK on a device or prove the production deployment is configured. The backend suite requires its database test dependencies. Device login, attachment download, administrator workflows, and production signing still need verification against the deployed service.

`backend/npm test` clears and reseeds the MongoDB database configured by `backend/.env`; point it only at a disposable development database.
