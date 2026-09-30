# Wheelio — photo AI, live support, Google login

This bundle extends the previous paid-publication / phone-verification build.

## 1. Automatic photo-angle detection

Sell -> Photos now classifies each uploaded photo as:

- FRONT
- REAR
- LEFT_SIDE
- RIGHT_SIDE
- INTERIOR
- DASHBOARD
- VIN_PLATE
- OTHER

The checklist dot turns green when at least one uploaded photo matches that angle. Every photo also has a manual selector, so a wrong AI result can be corrected.

### Enable AI image classification

Backend `.env`:

```env
PHOTO_CLASSIFIER_PROVIDER=auto
OPENAI_API_KEY=your_key_here
OPENAI_VISION_MODEL=gpt-6-astra
```

If `OPENAI_API_KEY` is empty, the app still works: it falls back to filename hints and manual angle selection. The classifier endpoint has a simple per-IP rate limit and an 8 MB upload limit.

The detected angle is saved with the image in MySQL (`images.view_type`).

## 2. Real-time support

`/help` now contains two modes:

- Live chat (SSE, real-time incoming messages + normal POST outgoing messages)
- Offline support ticket

Conversations/messages are persisted in:

- `support_conversations`
- `support_messages`

Support-agent dashboard:

```text
http://localhost:3000/admin/support
```

An agent is allowed if the account either:

- has `MANAGE_SUPPORT`, or
- has `ROLE_ADMIN`, or
- its email is listed in `SUPPORT_AGENT_EMAILS`.

Easy local setup:

```env
SUPPORT_AGENT_EMAILS=your@email.com
```

Restart backend after changing the env value.

## 3. Google sign-in

Google buttons are added to both Login and Register.

Google OAuth cannot work without your own Google client credentials.

Create a Google OAuth Web client and add this local redirect URI:

```text
http://localhost:8085/login/oauth2/code/google
```

Set backend environment variables:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SPRING_PROFILES_ACTIVE=dev,google
```

Then restart the backend.

New Google accounts are created automatically from the Google email/name. They are redirected to phone verification before paid listing publication, so the existing SMS/call verification requirement is kept.

For production, add your production callback URL to the Google console too, for example:

```text
https://api.your-domain.lt/login/oauth2/code/google
```

## Existing phone verification

The previous SMS / phone-call code verification remains unchanged.

Local test mode:

```env
PHONE_VERIFICATION_PROVIDER=log
PHONE_VERIFICATION_DEV_EXPOSE_CODE=true
```

Real Twilio mode:

```env
PHONE_VERIFICATION_PROVIDER=twilio
PHONE_VERIFICATION_DEV_EXPOSE_CODE=false
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
```

## Start

Backend:

```powershell
cd wheelio-backend
.\mvnw.cmd clean spring-boot:run
```

Frontend:

```powershell
cd wheelio-frontend
npm install
npm run dev
```

## Important replacement rule

Do not copy the new backend over an old backend directory. Rename/delete the old backend first and extract this one as a clean folder, so removed legacy Java files cannot survive.
