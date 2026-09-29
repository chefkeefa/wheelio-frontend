# Wheelio frontend

Next.js 15 frontend connected to the Wheelio NestJS API.

## Run locally

Requirements: Node.js 20 LTS (or newer compatible LTS), npm, the Wheelio NestJS backend running on port 8085, and access to the existing MySQL database through that backend.

1. Copy `.env.example` to `.env.local`.
2. Install packages with `npm ci`.
3. Run `npm run dev`.
4. Open http://localhost:3000.

Set `NEXT_PUBLIC_API_BASE` in `.env.local` to the backend API base, including `/api` (local default: `http://localhost:8085/api`). The value is embedded into the frontend at build time, so set the production API URL before `npm run build`.

Start the backend separately from the `wheelio-backend` project. Configure its `.env` with the existing MySQL credentials, `FRONTEND_BASE_URL`, allowed frontend origin, Google OAuth callback, phone provider and Paysera settings. Apply database migrations with `npm run migration:run` in the backend project before starting it (`npm run start:dev`).

## Production build

Run `npm ci`, `npm run typecheck`, `npm run build`, then `npm run start`. The frontend listens on port 3000 by default. For Hostinger Business, use a Node.js application with Node 20+, upload/deploy this project, set `NEXT_PUBLIC_API_BASE` to your public NestJS URL ending in `/api`, run `npm ci && npm run build`, and configure the startup command as `npm run start` (port from the hosting panel). The backend must be hosted as a separate Node.js service, and CORS must allow the frontend origin with credentials. Set the public API URL before building.

## Notes

- Login and Google sign-in use `/api/auth/login` and `/api/auth/google`; the NestJS backend manages the access and refresh cookies.
- Car photos are served from the backend; `NEXT_PUBLIC_API_BASE` must point at the correct public backend origin.
- Local phone verification can expose a development code only when the backend is in development mode. Production should use a configured SMS provider.
- Paysera checkout requires valid backend project credentials and a public callback URL.
