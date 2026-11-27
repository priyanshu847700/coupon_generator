# MessMate — Lunch Coupon Generator Frontend

A responsive React frontend for the Lunch Coupon Generator for Mess, based on the uploaded System Design Document.

## Included
- Demo sign-in and role switching for Student, Mess Staff, Mess Manager and Admin
- Student dashboard: today's menu, generate coupon, QR display, coupon history and wallet summary
- Staff counter: manual coupon-code validation and redemption, plus camera QR scanner
- Manager: menu publishing, meal cut-off settings, headcount and reports
- Admin: user/role overview
- CSV report export
- Browser localStorage persistence for demo data

## Run on Windows (PowerShell)
1. Extract this ZIP.
2. Open the extracted `lunch-coupon-generator-frontend` folder in VS Code.
3. Open Terminal in VS Code.
4. Run:

```powershell
npm install
npm run dev
```

5. Open the URL printed by Vite, usually `http://localhost:5173`.

## Demo accounts
Use the sign-in screen and choose a role. Any name and email can be entered. This is a frontend demonstration; no real password or backend authentication is used.

## Important integration note
This frontend currently uses browser `localStorage` so it works immediately without a backend. It does **not** provide production security. Coupon signatures, one-time redemption under concurrent requests, JWT authentication, payment processing, database persistence, email/SMS and audit integrity must be implemented and enforced by the Node/Express API and PostgreSQL backend described in the design document.

Set `VITE_API_URL` in a `.env` file when connecting the API. The UI is structured so API integration can be added in `src/services/api.js`.

## QR scanning
Camera scanning requires browser permission and generally a secure context (HTTPS or localhost). Manual code entry is always available as a fallback.
