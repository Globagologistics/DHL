# Shipment Tracking

This private, unofficial logistics interface concept adapts an existing application to the visual reference in `design-reference/dhl-redesign/`. The existing Supabase shipment, chat, storage, admin, and notification code remains the functional source of truth. The design reference contains visual prototype state and is not used as a data source.

## Development

Use Node 20 (`.nvmrc` / `.node-version`) and npm. Install from the existing lockfile:

```sh
npm ci
npm run dev
```

The development server uses `http://localhost:5194` with a strict port. A port conflict is an error. Run `npm run typecheck` and `npm run build` to validate. `npm run lint` currently changes files automatically, so do not use it as a read-only check.

Copy `.env.example` to a local ignored environment file and provide browser-safe Supabase URL and public key values. The existing `.env.local` currently connects to the duplicated application's development backend. `VITE_` values are exposed to the browser; SMTP, Supabase secret/service-role keys, and notification secrets belong only in Netlify server configuration.

The deployed site is protected before the SPA document is served by `netlify/edge-functions/human-gate.ts`. Set a 32+-character `DEMO_GATE_SECRET` in Netlify only. For local visual inspection, set `VITE_HUMAN_GATE_LOCAL_PREVIEW=true`; this is a development-only preview and is not an access credential.

## Customer routes

- `/` welcome; `/home` dashboard; `/track` search
- `/track/:id` live result; `/track/:id/timeline` recorded checkpoint timeline
- `/chat` authenticated shipment support; `/settings`; `/send-shipment`; `/locations`
- `/signin` existing Supabase password authentication

Admin routes remain under `/admin` with their existing role checks and workflows.

## Current limitations

- The waybill preview is generated from shipment fields because the current schema contains no carrier-issued waybill file or document metadata. It is clearly labelled as a record preview.
- Checkpoint timestamps reflect when records were created, not independently verified physical scan times.
- Route visualization uses the existing screenshot when present; otherwise it is illustrative and does not claim live coordinates.
- Service point data is not connected. The Send Shipment route intentionally shows a temporary loading and service error flow.
- Backend separation, new Supabase credentials, SMTP configuration, and final notification deployment are a later phase. No customer records were migrated.
- This is a private logistics interface concept. It is an unofficial demonstration and not affiliated with any carrier.
