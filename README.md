# Klein Sterre Akademie

Vercel-ready Next.js cricket academy booking app for parents and the academy administrator.

## Current features

- Parent registration with **name, surname and contact number**
- Parent chooses **1–6 children**
- Dynamic child fields for **name, surname and age**
- Session calendar with availability
- Maximum 3 active requests per session by default
- R150 per session
- Every parent booking starts as **Pending Confirmation**
- Admin **Pending Confirmations** tab
- Admin can **Confirm**, **Reject** or cancel bookings
- Admin view of registered parents and their children
- Admin session creation/deletion
- Shared database architecture using Supabase
- Server-side secret key; database tables are protected by RLS
- Afrikaans interface and Klein Sterre Akademie branding
- Slogan: **Elke Ster Begin Iewers**

## Database setup

The database is designed for Supabase. Supabase's Data API is generated from Postgres tables, while the server uses a secret key so the key never reaches the browser. Run:

`supabase/schema.sql`

in the Supabase SQL Editor.

Then add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
ADMIN_PIN=your-private-admin-pin
```

Do **not** commit the real secret key to GitHub. Supabase documents secret keys as server-only credentials that bypass RLS and should never be exposed in browser code.

## Run locally

```bash
npm install
npm run dev
```

## Vercel

Import `diepiesang-lab/klein-sterre-akademie` as a Next.js project and add the three environment variables above before deploying.

## Booking workflow

1. Parent chooses a session.
2. Parent enters name, surname and contact number.
3. Parent chooses how many children to register.
4. The app creates the required child fields for name, surname and age.
5. Parent submits the session request.
6. The request appears in **Admin → Pending Confirmations**.
7. Admin confirms or rejects it.
8. Confirmed bookings count toward the session capacity.
