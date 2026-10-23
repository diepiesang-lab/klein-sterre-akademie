# Klein Sterre Akademie

Vercel-ready Next.js cricket academy booking app for parents and the academy administrator.

## Current features

- Parent account sign-in with a verified email magic link
- Parent registration with **name, surname and contact number**
- Parent chooses **1–6 children**
- Dynamic child fields for **name, surname and age**
- Session calendar with availability
- Maximum 3 active requests per session by default
- R150 per session
- Every parent booking starts as **Pending Confirmation**
- Admin **Pending Confirmations** tab
- Admin can **Confirm**, **Reject** or cancel bookings
- Booking confirmations are emailed to the parent, with an admin retry option
- Admin view of registered parents and their children
- Admin session creation/deletion
- Shared database architecture using Supabase
- Server-side secret key; database tables are protected by RLS
- Afrikaans interface and Klein Sterre Akademie branding
- Slogan: **Elke Ster Begin Iewers**

## Database setup

The database is designed for Supabase. Supabase's Data API is generated from Postgres tables, while the server uses a secret key so the key never reaches the browser. Run:

`supabase/schema.sql`

in the Supabase SQL Editor. The script adds the email and booking functions needed by the app; review it before running.

Then add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ADMIN_PIN=your-private-admin-pin
RESEND_API_KEY=re_...
BOOKING_FROM_EMAIL=Klein Sterre Akademie <bookings@your-verified-domain.co.za>
```

Do **not** commit the real secret key to GitHub. Supabase documents secret keys as server-only credentials that bypass RLS and should never be exposed in browser code.

`BOOKING_FROM_EMAIL` must use a sender address on a domain verified with Resend. The Resend API key and sender address are used only on the server. Confirmation emails are sent when an admin confirms a booking; the admin can retry a failed delivery from the confirmed bookings tab.

For parent sign-in, enable Supabase Email authentication and configure SMTP delivery. Set the Supabase Site URL to `https://klein-sterre-akademie.vercel.app` and allow `https://klein-sterre-akademie.vercel.app/auth/callback` as a redirect URL (also allow `http://localhost:3000/auth/callback` for local development). The app uses Supabase Auth magic links to verify email addresses.

## Run locally

```bash
npm install
npm run dev
```

## Vercel

Import `diepiesang-lab/klein-sterre-akademie` as a Next.js project and add all seven environment variables above before deploying.

## Booking workflow

1. Parent enters their email address and receives a secure sign-in link.
2. Parent opens the link to verify the address and sign in.
3. Parent enters their name, surname, contact number and children’s details once.
4. Parent selects a timeslot opened by the admin and submits a booking request.
5. The same parent account can return later to book another open session.
6. The request appears in **Admin → Pending Confirmations**.
7. Admin confirms or rejects it.
8. The parent receives an email when the booking is confirmed.
