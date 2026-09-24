# Admin rebuild: backend handoff

> **Superseded in part.** The wizard now collects company, structured addresses, shipment type, pieces, weight, dimensions and reference (stored in `shipment_details` after migration `20260925000001`). Customers track by a 12-digit `tracking_number` (migration `20260925000000`), and the Notification Center has a manual send composer backed by `netlify/functions/admin-settings.ts`. The deployment checklist lives in [`docs/phase-2-deployment.md`](../phase-2-deployment.md).

The rebuilt admin UI uses the existing authenticated shipment, checkpoint, chat, notification-delivery, and storage services. No remote database changes were applied during this UI pass.

## Required before enabling public shipment requests

Review and apply `supabase/migrations/20260924000000_shipment_requests.sql` to the intended Supabase project. It creates a separate pending-request table and three server-side RPCs. Public submission creates only a pending request; approval is restricted to the existing admin role check and inserts a shipment, checkpoints, and publication inside one database transaction. The public page and admin queue deliberately show an unavailable state until this migration is applied.

The migration also restores admin-only, read-only access to notification-delivery records and shipment status history. Existing RLS still enforces the admin role; the older delivery-monitoring migration defined a policy but omitted the table-level `SELECT` grant.

Before exposing the public endpoint broadly, add an abuse control (rate limiting and/or CAPTCHA), run a database migration dry run against a staging copy, and test the full submit → edit → approve/reject → track/notify flow with authenticated admin and anonymous customer sessions. The SQL has not been exercised against the connected backend here.

## Existing-model limits surfaced honestly

- The current shipment schema uses combined pickup and delivery address strings. Company, city, postal code, dimensions, weight, piece count, declared value, and service-tier flags are not persisted, so the wizard does not pretend they exist.
- Public package images accept links only. Anonymous storage upload has not been opened. Admin creation continues to use the existing authenticated storage uploader.
- The existing notification pipeline provides lifecycle delivery records and retry, but no manual-send endpoint. The composer explains this and cannot send until a server-side endpoint and authorization are designed.
- No verified service-point source or management API exists. The Service Points route presents the missing connection rather than invented locations.
- “Super Admin” is not a distinct role in the existing authorization model; the profile labels the authenticated admin role accurately.
- The waybill link opens the existing shipment-record preview, not a carrier-issued PDF.

## Local-only shortcut

`VITE_ENABLE_ADMIN_SHORTCUT=true` is set only in ignored `.env.development.local`; `.env.example` defaults to `false`. The flag is also gated by `import.meta.env.DEV`. Ten taps on the Guest avatar within five seconds navigate to `/admin`, where the existing admin guard still requires an authenticated admin account. The shortcut does not grant access.

## Verification boundary

TypeScript typecheck and Vite production build pass using Node 20. The local Vite server is available at `http://localhost:5194/`. Browser-based visual and authenticated Supabase end-to-end checks were not possible in this session; HTTP route responses alone do not establish those behaviors.
