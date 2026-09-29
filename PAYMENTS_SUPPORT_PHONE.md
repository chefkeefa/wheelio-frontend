# PirkAuto frontend: payments, support and phone verification

This build is wired to the matching backend package.

## Local startup
1. Backend: `http://localhost:8085`
2. Frontend: `npm run dev` -> `http://localhost:3000`
3. Default API base is `http://localhost:8085/api`.

## Local test mode
- Payment checkout opens `/payment/dev` and can be completed without Paysera while backend `PAYMENTS_DEV_ENABLED=true`.
- Phone verification shows a `DEV code` while backend uses `PHONE_VERIFICATION_PROVIDER=log` and `PHONE_VERIFICATION_DEV_EXPOSE_CODE=true`.

## Production
- Configure Paysera and Twilio values in the backend environment.
- Set `PAYMENTS_DEV_ENABLED=false` and `PHONE_VERIFICATION_DEV_EXPOSE_CODE=false`.
- Keep your existing `public/images/hero-car.jpg` if you already added the hero photo locally.
