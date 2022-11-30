# Healthcare Dashboard

A management dashboard for a small clinic: patients, doctors, appointments, medical records, users and an audit trail. Angular 12 frontend, Express + PostgreSQL API.

> **Demo project.** All patient and medical data is synthetic. The application has not been reviewed for HIPAA or any other regulatory compliance and is not intended for clinical use.

## Features

- JWT sign-in with role-based access for **Admin**, **Doctor** and **Staff**
- Dashboard with patient/doctor/appointment totals, today's and upcoming appointments, and recent activity
- Patient management with search, sorting, status filter and pagination, plus a detail page with appointments and medical records tabs
- Doctor directory with department and status filters
- Appointment scheduling with double-booking checks and enforced status transitions
- Medical records that only the treating doctor can create or edit
- Admin user management: create users, change roles, activate/deactivate, reset passwords, link doctor accounts to doctor profiles
- Audit log of logins and data changes, filterable by action, user and date
- Responsive layout (collapsible navigation on small screens), keyboard accessible, labelled forms

## Technology stack

| Area     | Tools                                                                    |
| -------- | ------------------------------------------------------------------------ |
| Frontend | Angular 12, TypeScript, RxJS, Angular Material, Reactive Forms, SCSS     |
| Backend  | Node.js 16, Express 4, TypeScript, Sequelize 6, PostgreSQL 13            |
| Security | bcrypt, jsonwebtoken, helmet, cors, express-rate-limit, express-validator |
| Testing  | Jasmine + Karma (frontend), Jest + Supertest (backend)                   |
| Tooling  | ESLint, Prettier, Docker, Docker Compose, GitHub Actions                 |

## Architecture

```
Browser ──> nginx (Angular build) ──/api──> Express API ──> PostgreSQL
```

- The Angular app is split into lazy-loaded feature modules. `CoreModule` holds singleton services, guards and HTTP interceptors; `SharedModule` holds Material imports and small reusable pieces.
- `AuthInterceptor` attaches the token, `ErrorInterceptor` turns HTTP errors into a single `ApiError` shape and handles expired sessions. `AuthGuard` and `RoleGuard` protect routes.
- The API is a single Express app organised by layer (routes → validators → controllers → services → models). Controllers handle HTTP; services hold the logic that is more than CRUD (access scoping, appointment rules, dashboard aggregation, audit writes).
- **Authorization is enforced on the API.** Hiding menu items and buttons in the UI is only a convenience.

## Project structure

```
.
├── client/                    Angular application
│   └── src/app/
│       ├── core/              models, services, guards, interceptors
│       ├── shared/            Material module, page-state, dialogs, pipes, form validators
│       ├── auth/              login and registration
│       ├── layout/            sidebar, header, shell
│       ├── dashboard/
│       ├── patients/
│       ├── doctors/
│       ├── appointments/
│       ├── medical-records/
│       ├── users/
│       └── audit-logs/
├── server/                    Express API
│   ├── src/
│   │   ├── config/            environment and database connection
│   │   ├── controllers/
│   │   ├── middleware/        authenticate, authorize, validate, error handling
│   │   ├── models/            Sequelize models and associations
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   ├── migrations/
│   ├── seeders/
│   └── tests/
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Environment setup

Requirements: Node.js 16 (see `.nvmrc`), npm 8, PostgreSQL 13+ (or Docker).

```bash
cp server/.env.example server/.env
```

| Variable         | Description                                 | Example                                                  |
| ---------------- | ------------------------------------------- | -------------------------------------------------------- |
| `PORT`           | API port                                    | `5000`                                                   |
| `DATABASE_URL`   | PostgreSQL connection string                | `postgres://healthcare:healthcare@localhost:5432/healthcare_dashboard` |
| `JWT_SECRET`     | Secret used to sign tokens (keep it long and private) |                                                |
| `JWT_EXPIRES_IN` | Token lifetime                              | `8h`                                                     |
| `CLIENT_URL`     | Allowed CORS origin                         | `http://localhost:4200`                                  |
| `LOG_LEVEL`      | winston log level                           | `info`                                                   |

`.env` files are git-ignored. Never commit real secrets.

## Database setup

Create a database (or start one with Docker):

```bash
docker run -d --name healthcare-db -p 5432:5432 \
  -e POSTGRES_USER=healthcare -e POSTGRES_PASSWORD=healthcare \
  -e POSTGRES_DB=healthcare_dashboard postgres:13-alpine
```

Run migrations and load demo data:

```bash
cd server
npm install
npm run db:migrate
npm run db:seed
```

`npm run db:seed:undo` removes the demo data and `npm run db:migrate:undo` rolls back the last migration.

## Running locally

```bash
# API on http://localhost:5000
cd server
npm run dev

# Frontend on http://localhost:4200 (proxies /api to the API)
cd client
npm install
npm start
```

## Running tests

Frontend (Karma, headless Chrome):

```bash
cd client
npm run test:ci      # single run
npm test             # watch mode
npm run lint
```

Backend (Jest + Supertest). The tests run migrations against a separate database and truncate it between tests:

```bash
docker exec -it healthcare-db psql -U healthcare -c "CREATE DATABASE healthcare_dashboard_test"
cd server
npm test
npm run lint
```

Set `TEST_DATABASE_URL` if your test database lives elsewhere.

## Docker setup

```bash
cp .env.example .env          # then set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
docker compose exec api npm run db:seed    # optional demo data
```

The app is served on http://localhost:8080. nginx serves the Angular build and proxies `/api` to the API container; the API runs migrations on start-up.

## API overview

All responses use the same envelope:

```json
{ "success": true, "data": {} }
{ "success": false, "message": "Patient not found" }
{ "success": false, "message": "Validation failed", "errors": { "email": "Invalid email" } }
```

List endpoints accept `page`, `pageSize` (max 100), `sortBy`, `sortDir` and `search`, and return `{ items, total, page, pageSize }`.

| Method | Endpoint                             | Roles               | Notes                                       |
| ------ | ------------------------------------ | ------------------- | ------------------------------------------- |
| POST   | `/api/auth/register`                 | public              | Creates an inactive Staff account           |
| POST   | `/api/auth/login`                    | public              | Rate limited                                |
| GET    | `/api/auth/me`                       | any                 |                                             |
| POST   | `/api/auth/logout`                   | any                 | Records the logout                          |
| GET    | `/api/dashboard/summary`             | any                 | Doctors see their own numbers               |
| GET    | `/api/dashboard/recent-activity`     | any                 |                                             |
| GET    | `/api/patients`                      | any                 | `status`, `doctorId` filters; doctors see their patients only |
| GET    | `/api/patients/:id`                  | any                 |                                             |
| POST   | `/api/patients`                      | Admin, Staff        |                                             |
| PUT    | `/api/patients/:id`                  | Admin, Staff        |                                             |
| DELETE | `/api/patients/:id`                  | Admin               | Blocked if the patient has history          |
| GET    | `/api/doctors`                       | any                 | `status`, `department` filters              |
| GET    | `/api/doctors/:id`                   | any                 |                                             |
| POST   | `/api/doctors`                       | Admin               |                                             |
| PUT    | `/api/doctors/:id`                   | Admin               |                                             |
| DELETE | `/api/doctors/:id`                   | Admin               |                                             |
| GET    | `/api/appointments`                  | any                 | `date`, `dateFrom`, `dateTo`, `doctorId`, `patientId`, `status` |
| GET    | `/api/appointments/:id`              | any                 |                                             |
| POST   | `/api/appointments`                  | Admin, Staff        |                                             |
| PUT    | `/api/appointments/:id`              | Admin, Staff, Doctor | Doctors may only change status/notes on their own appointments |
| DELETE | `/api/appointments/:id`              | Admin               |                                             |
| GET    | `/api/medical-records`               | Admin, Doctor       |                                             |
| GET    | `/api/medical-records/:id`           | Admin, Doctor       |                                             |
| GET    | `/api/patients/:id/medical-records`  | Admin, Doctor       |                                             |
| POST   | `/api/patients/:id/medical-records`  | Doctor              | Patient must be assigned to the doctor      |
| PUT    | `/api/medical-records/:id`           | Doctor              | Author only                                 |
| GET    | `/api/users`                         | Admin               | `role`, `isActive` filters                  |
| POST   | `/api/users`                         | Admin               |                                             |
| PUT    | `/api/users/:id`                     | Admin               | Admins cannot change their own role or deactivate themselves |
| GET    | `/api/audit-logs`                    | Admin               | `action`, `userId`, `dateFrom`, `dateTo`    |

Appointment status can only move `SCHEDULED → CONFIRMED → COMPLETED`, or to `CANCELLED` from `SCHEDULED` or `CONFIRMED`. Anything else returns `409`.

## User roles

| Capability                          | Admin | Doctor         | Staff |
| ----------------------------------- | :---: | :------------: | :---: |
| Dashboard                           | ✓     | own data       | ✓     |
| View patients                       | ✓     | assigned only  | ✓     |
| Create / edit patients              | ✓     |                | ✓     |
| Delete patients                     | ✓     |                |       |
| View doctors                        | ✓     |                | ✓     |
| Manage doctors                      | ✓     |                |       |
| Manage appointments                 | ✓     |                | ✓     |
| Update appointment status           | ✓     | own only       | ✓     |
| View medical records                | ✓     | assigned only  |       |
| Create / edit medical records       |       | own only       |       |
| Manage users                        | ✓     |                |       |
| View audit logs                     | ✓     |                |       |

A doctor's "assigned" patients are those assigned to them plus anyone they have an appointment with. Doctor accounts must be linked to a doctor profile (Users → Edit) before they can see patient data.

## Demo credentials

After `npm run db:seed` every account uses the password `Password123!`.

| Email                 | Role   | Notes                        |
| --------------------- | ------ | ---------------------------- |
| `admin@example.com`   | Admin  |                              |
| `doctor@example.com`  | Doctor | Dr. Sarah Smith, Cardiology  |
| `doctor2@example.com` | Doctor | Dr. James Patel, General Medicine |
| `staff@example.com`   | Staff  |                              |
| `staff2@example.com`  | Staff  |                              |

The seed also creates 3 doctor profiles, 10 patients, 12 appointments around today's date, a few medical records and audit entries. All names, phone numbers and emails are made up.

## Security notes

The project follows common practice (hashed passwords, short-lived JWTs, server-side role checks, input validation, rate-limited auth endpoints, helmet headers, restricted CORS, no secrets in the repo), but it is a demo and has not had a security review. In particular, tokens are kept in `localStorage` and there is no refresh-token flow, account lockout or MFA.
