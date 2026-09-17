# Klein Sterre Akademie

A Vercel-ready Next.js cricket academy booking app for parents and the academy administrator.

## Included

- Mobile-friendly parent booking calendar
- Create session slots from the admin view
- Maximum 3 children per slot
- R150 session price shown at booking
- Child name and grade capture
- Parent/guardian WhatsApp or phone contact capture
- Available / nearly full / full indicators
- Monthly calendar navigation
- Admin PIN demo (`0430`) for the current prototype
- Local browser persistence so bookings survive refreshes on the same device
- Afrikaans interface and Klein Sterre Akademie branding
- Slogan: **Elke Ster Begin Iewers**

## Run locally

```bash
npm install
npm run dev
```

## Vercel

Import `diepiesang-lab/klein-sterre-akademie` as a Next.js project in Vercel. No environment variables are required for this prototype.

## Production upgrade

The current version intentionally uses browser local storage. Before real parent use, connect a hosted database and authentication so bookings are shared between devices and the admin area is securely protected.
