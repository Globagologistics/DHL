# Onboarding, Home, Support, and Chat visual QA

**final result: blocked**

The requested presentation changes are implemented, but browser-rendered visual QA could not be completed. The in-app browser reported no available browser surface. The brief also refers to current-screen screenshots, but only the two cinematic image files were available in this turn.

## Evidence and comparison target

- Source visual truth: `C:/Users/USER/Downloads/ChatGPT Image Sep 24, 2026, 11_36_07 AM.png` (portrait, 941 × 1672 pixels) and `C:/Users/USER/Downloads/ChatGPT Image Sep 24, 2026, 11_36_25 AM.png` (landscape, 1672 × 941 pixels), plus the user's written layout brief.
- Implementation: `/`, `/home`, and `/chat` at `http://localhost:5194`.
- Intended comparison viewports: 390 × 844, 430px wide mobile, 768px, 1024px, and 1440px.
- Implementation screenshot path, pixels, CSS size, and device scale: unavailable because browser capture is unavailable.
- State: default welcome and guest Home screens, Support gate, and local-only `TEST123` demo chat. The real chat still depends on the existing backend authorization policy.

## Visual assessment still required

No full-view or focused-region side-by-side comparison was possible. In particular, typography and wrapping, spacing rhythm, color/overlay contrast, image crop and sharpness, and copy placement remain visually unverified. The portrait and landscape source images were inspected before implementation; the optimized portrait WebP was also inspected. No responsive screenshot or console capture was available.

## Checks completed

- `npm run typecheck`: passed using Node 20.20.2.
- `npm run build`: passed using Node 20.20.2 (Browserslist age warning only).
- `/chat`: HTTP 200 from the local development server on port 5194; the server process uses Node 20.20.2.
- Local `.env.development.local` contains only `VITE_DEMO_SUPPORT_ACCESS=true`; the file is git-ignored. Production bundles use `import.meta.env.DEV &&` and cannot enable the demo bypass.
- Existing tracking form submit handler, application routes, Supabase chat services, database policy, and admin logic were not changed.

## Next visual pass

Capture onboarding, Home, Support gate, and both demo/real chat at 390 × 844, 430px, 768px, 1024px, and 1440px. Compare each capture with the supplied image composition and written brief; inspect focus, Get Started, tracking submit, navigation drawer, floating support, debounce states, composer, and browser console. Resolve any P0/P1/P2 findings before marking this QA passed.
