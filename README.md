# Marium Dashboard (Project Pillars)

A production-ready React + Vite dashboard designed to track milestones, deadlines, and delivery risk. This project serves as a centralized command center with powerful features like role-aware editing, database persistence, and automated SMS notifications.

## 🌟 Key Features

- **Role-Aware Access Control:** Users are assigned roles (`admin` or `contributor`). Admins have full CRUD access to all pillars and milestones, while contributors can only update milestone statuses and add notes.
- **Automated SMS Notifications:** A built-in Node.js cron job runs hourly to check for upcoming or at-risk milestones and dispatches SMS alerts via Twilio to the responsible users.
- **Supabase Integration:** Full database and authentication integration using Supabase Postgres and Auth (OTP Magic Links).
- **Offline / Demo Fallback Mode:** Developing without environment variables? The app seamlessly falls back to a locally seeded demo mode so frontend work is never blocked by database outages.
- **Automated Health Tracking:** Pillar progress and health metrics (On Track, At Risk, Critical) are computed dynamically based on the completion timeframe and remaining days until the deadline.
- **Railway Deployment Ready:** Comes with an Express server (`server.js`) that serves the built frontend securely and runs backend API endpoints concurrently.

## 🏗️ Architecture & Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend / Server:** Node.js, Express, node-cron
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Magic Link Auth)
- **Communications:** Twilio SMS API
- **Deployment:** Railway

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example environment file and fill in your details:
```bash
cp .env.example .env
```
Ensure you have the following variables populated in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Required for the SMS Cron job to bypass RLS)
- `TWILIO_ACCOUNT_SID`: Your Twilio SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER`: Your Twilio Sender Phone Number

*Note: If you do not provide Supabase variables, the app will safely launch in Demo Mode.*

### 3. Run Development Server
```bash
npm run dev
```

## 🗄️ Database Setup (Supabase)

1. Navigate to your Supabase Project.
2. Open the SQL Editor and copy the contents of `supabase/schema.sql`.
3. Run the SQL script. This will automatically setup:
   - Tables: `profiles`, `pillars`, `milestones`, `notifications`
   - Trigger capabilities to auto-create user profiles upon sign up.
   - Row Level Security (RLS) policies enforcing multi-tenancy and role access.

### User Roles
Users signing in with `shishiny@gmail.com` are automatically granted **Admin** rights. All other sign-ins generate **Contributor** profiles.

## 📞 SMS Notification Engine System

The app utilizes an Express.js server (`server.js`) that hosts the frontend while simultaneously running a Cron job:

- **Cron Schedule:** Runs at the top of every hour (`0 * * * *`).
- **Logic:** Identifies users whose preferred notification time matches the current server time (adjusted for their timezone configuration). If a user has milestones due within 48 hours that are not yet marked `done`, an SMS reminder is sent via Twilio.
- **Deduplication:** A `notifications` table prevents duplicate SMS dispatches.

### Available API Endpoints

- `GET /api/trigger-notifications`: Manually triggers the hourly cron job logic for testing.
- `POST /api/test-sms`: Tests the Twilio credentials. Expects `{ "phone_number": "+1234567890" }` in the request body.

## ☁️ Production Deployment (Railway)

This repository is pre-configured to easily deploy on [Railway.app](https://railway.app).

1. Create a new Railway project and link this GitHub repository.
2. Under your Railway **Environment Variables**, paste all the variables from your local `.env`.
3. Railway will automatically detect the `package.json` commands:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start` (This will invoke `node server.js` which serves the production `dist/` directory and starts the cron job).
4. *Recommendation:* Expose port `3000` or attach the default Railway domain to the environment.
