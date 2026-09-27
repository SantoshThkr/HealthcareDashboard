# Healthcare Dashboard

A management dashboard for a small clinic covering patients, doctors, appointments, medical records, users and audit logs.

> **Demo project:** All patient and medical data is synthetic. This project has not been reviewed for HIPAA or other regulatory compliance and is not intended for clinical use.

## Features

* JWT authentication with Admin, Doctor and Staff roles
* Dashboard with patient, doctor and appointment stats
* Patient management with search, sorting, filtering and pagination
* Doctor directory with department and status filters
* Appointment scheduling with double-booking checks and status rules
* Medical records with doctor-only create/edit access
* Admin user management
* Audit log for logins and data changes
* Responsive and keyboard-accessible UI

## Tech Stack

**Frontend:** Angular 12, TypeScript, RxJS, Angular Material, Reactive Forms, SCSS

**Backend:** Node.js 16, Express 4, TypeScript, Sequelize 6, PostgreSQL 13

**Security:** bcrypt, jsonwebtoken, Helmet, CORS, express-rate-limit, express-validator

**Testing:** Jasmine, Karma, Jest, Supertest

**Tools:** ESLint, Prettier, Docker, Docker Compose, GitHub Actions

## Architecture

```text id="m2oz4n"
Angular
   ↓
nginx
   ↓
Express API
   ↓
PostgreSQL
```

The Angular app uses lazy-loaded feature modules, shared services, route guards and HTTP interceptors.

The API follows:

```text id="e5k4fq"
routes
  ↓
validators
  ↓
controllers
  ↓
services
  ↓
models
  ↓
PostgreSQL
```

Authorization is enforced on the API, not only in the frontend.

## Project Structure

```text id="vnwq4h"
.
├── client/
│   └── src/app/
│       ├── core/
│       ├── shared/
│       ├── auth/
│       ├── layout/
│       ├── dashboard/
│       ├── patients/
│       ├── doctors/
│       ├── appointments/
│       ├── medical-records/
│       ├── users/
│       └── audit-logs/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   ├── migrations/
│   ├── seeders/
│   └── tests/
│
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Setup

Requirements:

* Node.js 16
* npm 8
* PostgreSQL 13+ or Docker

Create the server environment file:

```bash id="3d4p3f"
cp server/.env.example server/.env
```

Set:

```text id="0y4mlk"
PORT
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
LOG_LEVEL
```

Never commit real secrets.

## Database

Start PostgreSQL locally or with Docker.

Example:

```bash id="jmu77t"
docker run -d --name healthcare-db -p 5432:5432 \
  -e POSTGRES_USER=healthcare \
  -e POSTGRES_PASSWORD=healthcare \
  -e POSTGRES_DB=healthcare_dashboard \
  postgres:13-alpine
```

Run migrations and seed demo data:

```bash id="y5yhqk"
cd server
npm install
npm run db:migrate
npm run db:seed
```

## Run Locally

Start the API:

```bash id="p5r2m2"
cd server
npm run dev
```

Start the Angular app:

```bash id="9jkmp0"
cd client
npm install
npm start
```

Default URLs:

```text id="5zyi6m"
API      → http://localhost:5000
Frontend → http://localhost:4200
```

## Docker

```bash id="y3x88f"
cp .env.example .env
docker compose up --build
```

Open `http://localhost:8080`.

The containers run the database, API and Angular app, with nginx serving the frontend and proxying `/api` requests.

## API

Main endpoints:

```text id="8r1s10"
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/dashboard/summary
GET    /api/dashboard/recent-activity

GET    /api/patients
GET    /api/patients/:id
POST   /api/patients
PUT    /api/patients/:id
DELETE /api/patients/:id

GET    /api/doctors
GET    /api/doctors/:id
POST   /api/doctors
PUT    /api/doctors/:id
DELETE /api/doctors/:id

GET    /api/appointments
GET    /api/appointments/:id
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/medical-records
GET    /api/patients/:id/medical-records
POST   /api/patients/:id/medical-records
PUT    /api/medical-records/:id

GET    /api/users
POST   /api/users
PUT    /api/users/:id

GET    /api/audit-logs
GET    /api/health
```

All protected endpoints require a Bearer token.

Doctors only see patients assigned to them or patients they have appointments with. Medical records can only be created or edited by the treating doctor.

Appointment status follows:

```text id="s9y5r0"
SCHEDULED → CONFIRMED → COMPLETED
SCHEDULED → CANCELLED
CONFIRMED → CANCELLED
```

## User Roles

| Capability                  | Admin |     Doctor    | Staff |
| --------------------------- | :---: | :-----------: | :---: |
| Dashboard                   |   ✓   |    Own data   |   ✓   |
| View patients               |   ✓   | Assigned only |   ✓   |
| Create/edit patients        |   ✓   |               |   ✓   |
| Delete patients             |   ✓   |               |       |
| Manage doctors              |   ✓   |               |       |
| Manage appointments         |   ✓   |  Own updates  |   ✓   |
| View medical records        |   ✓   | Assigned only |       |
| Create/edit medical records |       |    Own only   |       |
| Manage users                |   ✓   |               |       |
| View audit logs             |   ✓   |               |       |

A doctor's account must be linked to a doctor profile before they can access patient data.

## Testing

Frontend:

```bash id="q2ti3f"
cd client
npm run test:ci
npm run lint
```

Backend:

```bash id="mqd1b6"
cd server
npm test
npm run lint
```

Backend tests use a separate database and cover authentication, authorization, CRUD operations, validation and ownership rules.

## Demo Data

After:

```bash id="l4fgn5"
npm run db:seed
```

the project creates demo users, doctors, patients, appointments, medical records and audit entries.

All names, emails and other patient information are synthetic.

Default demo password:

```text id="8mzw6c"
Password123!
```

## Security Notes

* Passwords are hashed with bcrypt.
* JWT authentication is enforced on the server.
* Role and ownership checks are handled by the API.
* Auth endpoints are rate limited.
* Input is validated before processing.
* Helmet and restricted CORS are configured.
* Secrets are kept in environment variables.
* Tokens are stored in `localStorage`.
* There is no refresh-token flow, MFA or account lockout.

This is a demo application and has not undergone a formal security review.
