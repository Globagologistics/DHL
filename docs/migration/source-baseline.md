# Source baseline before independent-repository migration

Captured on 2026-09-24 from the duplicated workspace at `C:\Users\USER\DHL`, before the legacy `.git` directory was removed.

## Legacy Git identity

- Branch: `main`
- HEAD: `c37c6263a57cc18bb418533695edbf21787b8354` (`Fix chat access and mobile composer`)
- Legacy remote: an `origin` remote was configured for the former Buske Logistics repository. Its URL is deliberately omitted from this document.
- Staged changes: none.

## Pre-existing working-tree changes

These were present before this migration and are preserved in the initial independent-project baseline:

- Modified `.env.example`: adjusted email-test documentation.
- Modified `NOTIFICATION_SETUP.md`: adjusted notification test instructions.
- Modified `src/app/pages/AdminForm.tsx`: removed the draft-versus-publish UI flow and changed post-creation messaging.
- Deleted `supabase/migrations/20260814000000_publish_on_insert.sql`: an additive notification trigger migration.

## Deliberately unmodified at capture time

- `.env.local` remains local-only and is not committed.
- No actual credential values were read into this document.
- No source file was reset, restored, or discarded.

## Migration safeguards

The original repository was not accessed or modified. The new repository history starts from the current duplicated workspace, including the pre-existing changes listed above. The deleted migration is recorded here so it can be reviewed before any later database work.
