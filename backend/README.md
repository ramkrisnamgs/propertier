# Propertier Backend

Backend API for Propertier, built with Node.js, Express, and MongoDB.

## Project Progress (Step by Step)

This section explains how the backend has been processed so far.

### 1) Initial backend setup

- Created backend with Express server (`server.js`).
- Added core middleware:
  - `cors()` for cross-origin frontend requests.
  - `express.json()` for JSON body parsing.
- Loaded environment variables using `dotenv`.
- Connected MongoDB through `connectDB()`.
- Added health route:
  - `GET /` -> `API is working!`

### 2) Structured architecture

Adopted layered structure for maintainability:

- `models` -> database schema definitions
- `controllers` -> business logic
- `middlewares` -> auth/guard logic
- `routes` -> API endpoint mapping
- `utils` -> reusable helpers (email sending)

### 3) User model implementation

Created `User` schema with:

- identity: `name`, `email`, `password`
- roles: `buyer`, `seller`, `admin`
- account states: `isBlocked`, `isApproved`, `isVerified`
- tokens:
  - `verificationToken` for email OTP verification
  - `resetPasswordToken` and `resetPasswordExpire` for password reset
- timestamps enabled

### 4) Authentication APIs

Implemented core auth controllers:

- `register`
  - checks duplicate user
  - hashes password using `bcrypt`
  - generates 6-digit OTP (`verificationToken`)
  - creates user and sends verification email
- `verifyEmail`
  - validates OTP and marks user as verified
- `login`
  - checks credentials
  - enforces verified + unblocked user checks
  - returns JWT token
- `getMe`
  - returns authenticated user profile without password
- `forgotPassword`
  - generates reset token + expiry and sends reset email
- `resetPassword`
  - updates password using hashed value

### 5) Auth middleware and protection

Built middleware-based API protection:

- `protect`
  - reads Bearer token
  - verifies JWT
  - attaches user to `req.user`
  - blocks access if account is blocked
- `authorize(...roles)`
  - role-based route guard support

### 6) Route mapping

Configured auth routes under `/api/auth`:

- `POST /register`
- `POST /login`
- `GET /me` (protected)
- `POST /verify-email`
- `POST /forgot-password`
- `POST /reset-password/:token`

### 7) Email OTP flow evolution

Email service moved through two stages:

1. Brevo API integration was first implemented.
2. Due to SMTP activation restrictions in Brevo account, mailer was migrated to Nodemailer SMTP.

Current mail stack:

- `nodemailer` with SMTP (`utils/sendEmail.js`)
- OTP email sent during registration
- sender and SMTP credentials read from `.env`

### 8) End-to-end API testing

All currently exposed auth APIs were manually tested and validated in local development flow.

---

## Tech Stack

- Node.js (ES Modules)
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Bcrypt
- Nodemailer
- CORS

---

## Environment Variables

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_char_google_app_password
EMAIL_FROM=your_email@gmail.com
```

Notes:

- For Gmail SMTP, `SMTP_PASS` must be a Google App Password (not normal Gmail password).
- Keep `EMAIL_FROM` same as verified sender mail for better deliverability.

---

## Run Locally

From project root:

```bash
cd backend
npm install
npm start
```

Server default:

- `http://localhost:5000`

---

## API Quick Test Order

Recommended sequence when testing auth:

1. `POST /api/auth/register`
2. Check OTP email
3. `POST /api/auth/verify-email`
4. `POST /api/auth/login`
5. `GET /api/auth/me` with `Authorization: Bearer <token>`
6. `POST /api/auth/forgot-password`
7. `POST /api/auth/reset-password/:token`

---

## Author Notes

This backend is currently focused on stable authentication and email verification flow. Next expansions can include property modules, role-specific dashboards, and stronger input validation/testing automation.