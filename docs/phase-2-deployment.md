# Phase 2: production deployment

Part One delivered the customer UI, the admin console and the settings architecture. This document lists everything that remains before a real production launch. None of these steps were performed in Part One. No production project, credential, token or remote was created or changed.

Work through the steps in order. Each one lists what to do and how to confirm it worked.

---

## 1. Create the production Supabase project

- Create a new project in the intended organization and region.
- Record the **Project URL** and the **anon/publishable key** (public), plus a **secret key** (`sb_secret_…`, server-only).
- Enable email auth. Disable public sign-ups if only the administrator should ever have an account (Authentication → Providers → Email → *Allow new users to sign up*: off). Customers who use private chat still need accounts, so leave sign-ups on if chat access by email is required.
- Set **Site URL** and **Redirect URLs** to the production domain. Include `https://<domain>/reset-password` so admin recovery links work.

**Check:** the project dashboard opens and Auth → URL Configuration lists the production domain.

## 2. Apply the database schema and migrations

Apply these on a **staging copy first**, then production. None of the Part One SQL has been executed against a live database.

1. `sql_schema.sql`: the base tables (users, shipments, checkpoints, chat) and legacy policies.
2. `migrate_add_pickup_location.sql`, then `add_missing_columns.sql`: legacy column additions.
3. `migrate_setup_storage_buckets.sql`: storage buckets (see step 4 before exposing it).
4. Everything in `supabase/migrations/`, in filename order:

| Migration | Purpose |
| --- | --- |
| `20260813000000_consignment_notifications.sql` | Notification outbox, deliveries, lifecycle triggers |
| `20260813000001_secure_chat_access.sql` | Chat RLS, `current_user_is_admin()`, profile trigger |
| `20260813000002_notification_reliability_and_lifecycle.sql` | Payment/lifecycle columns, retries |
| `20260813000003_allow_public_tracking_policy_helper.sql` | Lets anonymous tracking evaluate the admin helper |
| `20260813000004_immediate_notification_dispatch.sql` | Webhook call to `dispatch-notifications` |
| `20260813000005_fix_immediate_dispatch_trigger_return.sql` | Trigger fix |
| `20260815000000_fix_chat_thread_authorization.sql` | `ensure_chat_thread` RPC |
| `20260924000000_shipment_requests.sql` | Public request queue and approve/reject RPCs |
| `20260924000001_chat_replies_and_support_personas.sql` | Reply threading and support persona columns |
| `20260925000000_numeric_tracking_numbers.sql` | **New:** 12-digit `tracking_number` (random, unique, immutable once set). Assigned at publish; existing published rows are backfilled |
| `20260925000001_shipment_details.sql` | **New:** `shipment_details` JSON column (earlier wizard; kept for compatibility) |
| `20260925000002_app_settings.sql` | **New:** `app_settings` for non-secret settings (RLS: public keys readable, admin writes) |
| `20260926000000_shipment_lifecycle.sql` | **New:** `lifecycle_state` + events, package value, outstanding amount, carrier role, `started_at`, route coordinates and labels, `route_progress`, soft delete; RPCs `publish_shipment`, `transition_shipment`, `add_shipment_update`, `soft_delete_shipment`; public request and approval redefined (approval creates a SCHEDULED shipment) |
| `20260926000001_chat_message_deletion.sql` | **New:** admin-only `delete_support_message` RPC with an admin-only audit table; deleted rows lose their content |

With the Supabase CLI linked to the target project: review `supabase db push --dry-run`, then run `supabase db push`.

**Check:**
- Publishing a test shipment returns a 12-digit number (`select publish_shipment('<id>');` as the admin), and unpublished shipments have `tracking_number` NULL.
- `select transition_shipment('<id>', 'start');` moves it to `in_transit` and sets `started_at`; `pause` without a reason is rejected.
- `select key, is_public from app_settings;` returns four rows: `application` and `whatsapp` are public.
- The immediate-dispatch webhook in `20260813000004` points at the **production** Netlify URL with the production dispatch secret. Edit it before applying if it names another host.

## 3. Review Row Level Security

- Confirm RLS is enabled on every public table (`select relname from pg_class where relrowsecurity = false and relnamespace = 'public'::regnamespace;` should list nothing sensitive).
- Replace the permissive development policies from `sql_schema.sql` (e.g. *Allow shipment updates/deletion*) with admin-only write policies that use `current_user_is_admin()`.
- Anonymous visitors should be able to read only published shipments and their checkpoints (tracking), and call only `submit_shipment_request`.
- `app_settings` must reject anonymous writes: try an anonymous `upsert` and expect a permission error.
- Add abuse protection to public endpoints (`submit_shipment_request`, tracking lookups): rate limiting at the edge or a CAPTCHA on the request form. Tracking numbers are random, but 12 digits can be guessed at scale without a rate limit.

## 4. Configure storage

Buckets: `shipment-images`, `driver-images`, `route-screenshots`, `chat-media`.

- Keep buckets public-read only if public image URLs are acceptable. Otherwise switch to signed URLs.
- **Restrict uploads**: the development policy *Public bucket insert* lets anyone upload. Limit inserts to authenticated admins (and chat participants for `chat-media`), and set size/MIME limits per bucket.
- **One exception, public request photos:** the public form (`/shipment-request/new`) uploads 1–3 photos as an anonymous visitor into `shipment-images/requests/<uuid>/`. Allow only that folder, and limit the bucket to JPEG/PNG/WebP up to 10 MB:

  ```sql
  create policy "Public request photos" on storage.objects for insert to anon, authenticated
    with check (bucket_id = 'shipment-images' and (storage.foldername(name))[1] = 'requests');
  update storage.buckets set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'shipment-images';
  ```

  The same rate limit or CAPTCHA that protects `submit_shipment_request` should cover these uploads.

**Check:** an anonymous upload outside `requests/` fails; the public form submits with photos; an admin upload from Create Shipment succeeds.

## 5. Create the initial administrator

The app has one administrator. No credentials exist in source code.

1. Authentication → Users → **Add user** with the client's email and a temporary strong password (or send an invite).
2. Promote the profile from the SQL editor:
   ```sql
   update public.users set user_type = 'admin' where email = '<client admin email>';
   ```
3. Hand over the temporary credentials through a secure channel. The client signs in and changes both email and password in **Admin → Settings → Admin Account** (current password is re-verified; minimum 8 characters).

**Check:** signing in at `/signin?next=/admin` opens the dashboard, and a non-admin account is redirected back to sign-in.

## 6. Configure Netlify

- Create or link the site to the new repository (step 12). Build command `npm run build`, publish directory `dist`, functions `netlify/functions` (already in `netlify.toml`).
- Use Node 20 (`.nvmrc`).
- Keep the SPA redirect in `netlify.toml`.
- Do not paste Netlify API or deploy tokens into the app. The dashboard never asks for them.

## 7. Add the Supabase public environment variables

Netlify → Site configuration → Environment variables (build scope):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon/publishable key |
| `VITE_APP_BASE_URL` | `https://<domain>` |
| `VITE_WHATSAPP_NUMBER` | Optional bootstrap number until Settings saves one |

Ensure `VITE_DEV_ADMIN_BYPASS`, `VITE_ENABLE_ADMIN_SHORTCUT`, `VITE_ENABLE_DEMO_SHIPMENT` and `VITE_SETTINGS_DEV_ADAPTER` are **unset**. They are ignored in production builds anyway. `VITE_ENABLE_DEMO_SHIPMENT=true` in a dev build turns on the development data store (`src/demo/`: demo shipment `010101010101`, shipments and requests created while signed out, and their chats), kept in the browser's localStorage. Once real shipments exist, `src/demo/` can be deleted together with its guarded calls in `trackingService`, `shipmentWorkflowService`, `shipmentRequestService`, `useSupabase`, `useChat` and `AdminContext`.

The route map needs no configuration: country outlines, US state borders and the location gazetteer ship with the build (see `ATTRIBUTIONS.md`). To refresh the gazetteer, download the GeoNames files listed in `scripts/build-gazetteer.mjs` and run it.

## 8. Configure secure SMTP storage and the server function

Part One ships `netlify/functions/admin-settings.ts`. It authenticates the administrator's Supabase token and currently:

- reports email status from server environment variables (never returns a secret),
- sends test emails and manual shipment notifications through the env SMTP account,
- **refuses** `save-email-credential` with HTTP 501. Nothing is stored.

To let the client replace the SMTP credential from the dashboard:

1. Enable **Supabase Vault**. Create a `SECURITY DEFINER` function callable only by the `service_role` that upserts the secret by name (e.g. `smtp_app_password`) and records `updated_at`.
2. In `admin-settings.ts`, implement `save-email-credential`: validate, call the Vault function with the service client, and return `EmailConfigurationStatus` with `source: 'secure-store'` and `credentialUpdatedAt`. Never echo the password.
3. In `dispatch-notifications.ts` and `admin-settings.ts`, read the SMTP password from Vault first and fall back to `SMTP_APP_PASSWORD`. Read the non-secret fields (sender name/email, username, host/port) from `app_settings.email`.
4. Only if Vault is unavailable, encrypt with AES-GCM using `SETTINGS_ENCRYPTION_KEY` in a server-only table. Never use a browser-readable row.

**Check:** after saving in Settings, the credential card shows *Configured* and *Last updated*, the password field is empty, and `select * from app_settings` contains no password.

## 9. Add the Gmail App Password

1. On the sending Google account, turn on 2-Step Verification.
2. Google Account → Security → App passwords → create one for "Mail".
3. Enter the 16-letter app password either in Netlify as `SMTP_APP_PASSWORD` (with `SMTP_USER`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`) or, after step 8, in **Admin → Settings → Email & SMTP**.

Never use the Gmail account password.

## 10. Configure notification sending

Server-only Netlify variables: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `NOTIFICATION_DISPATCH_SECRET`, `ADMIN_EMAIL`, `APP_NAME`, `APP_URL`, `SUPPORT_URL`, `LOGO_URL`. Leave `EMAIL_TEST_MODE`/`EMAIL_TEST_RECIPIENT` unset in production.

- Put the same `NOTIFICATION_DISPATCH_SECRET` in the database webhook (migration `20260813000004`).
- `notification-sweeper` runs every 5 minutes (`netlify.toml`) as the retry path.
- Notification preferences saved in **Settings → Notifications** are stored in `app_settings.notification_preferences`. **Wire the dispatcher to honour them:** skip categories that are off, and send nothing when `emailEnabled` is false. That is not done in Part One.
- Optionally record manual sends from `admin-settings` in `notification_deliveries` so they appear in Notification Center.

**Check:** publish a test shipment addressed to an internal inbox. The email subject shows the 12-digit tracking number and the delivery appears as *sent* in Notification Center.

## 11. Configure the WhatsApp number

Admin → Settings → WhatsApp: enable it, set the country code and number, and adjust the messages. Use **Test WhatsApp Link** on a phone and on desktop.

**Check:** Home → WhatsApp Support opens WhatsApp with the prefilled message. After tracking a shipment, the message includes its tracking number.

## 12. Create and push the new GitHub remote

```bash
git remote add origin git@github.com:<org>/<repo>.git
git push -u origin main
```

Confirm `.env*` files are not tracked (`git ls-files | grep .env` shows only `.env.example`).

## 13. Deploy production

Trigger a Netlify deploy from `main`. Confirm the functions `dispatch-notifications`, `notification-sweeper` and `admin-settings` are listed and the build log shows no missing variables.

## 14. Acceptance tests

Customer (phone at 390 px and desktop):
- [ ] `/track`: typing 12 digits searches automatically; fewer shows the 12-digit hint; letters are rejected.
- [ ] A real number goes Searching → Shipment found → result page with the 12-digit number.
- [ ] An unknown number shows the Shipment not found state with Try Again / Customer Support / WhatsApp.
- [ ] With the network offline, the error state appears (not "not found").
- [ ] Customer Support: a 12-digit number opens the conversation for a signed-in participant; customer bubbles are yellow/right, support white/left with avatar.
- [ ] Header shows only the menu and the logo; the WhatsApp quick action opens WhatsApp.

Admin:
- [ ] Sign in, create a shipment through the 5-step wizard, publish, and receive a 12-digit tracking number.
- [ ] The public `/shipment-request/new` submission appears under Shipment Requests; editing, approving (creates a tracked shipment) and rejecting all work.
- [ ] Chat replies reach the customer in realtime.
- [ ] Settings: change the password (then sign in with it), send a reset email, save WhatsApp, send a test email, and check Integration Status is all green.

Security:
- [ ] No secret appears in the built JS (`grep -r "sb_secret\|SMTP_APP_PASSWORD" dist/` finds nothing).
- [ ] `/admin` without an admin session redirects to sign-in, and the development bypass is absent.
- [ ] Anonymous writes to `shipments`, `app_settings` and storage are rejected.
