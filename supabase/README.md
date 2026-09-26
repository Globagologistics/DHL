# Supabase deployment notes

`supabase/migrations/` is the authoritative, ordered deployment history. Do
not run `setup/full_setup.sql` against an existing or production project: it
is retained only as a legacy local-schema reference and no longer creates a
default administrator.

Before the first remote deployment, an owner must authenticate the Supabase
CLI, link project `vqdkrkweyqpbbujsmooh`, review `supabase db push --dry-run`,
and apply the ordered migrations.

## Administrators

Administrator rights are never self-service. Migration
`20260929000001_prevent_self_service_admin_promotion.sql` restricts the
self-insert and self-update policies on `public.users` to non-admin roles, so
an account can no longer promote itself to `admin` from the browser.

A normal Auth signup creates its profile automatically with
`user_type = 'sender'` (trigger `create_profile_on_auth_user`). Promote an
operator deliberately, as the project owner, with the service role — the
Supabase SQL editor or a trusted server-side function:

```sql
UPDATE public.users SET user_type = 'admin' WHERE email = 'operator@example.com';
```

Provision the first administrator this way before applying the portfolio demo
migration; that migration deliberately refuses to create an administrator
itself.

The permanent synthetic shipment is `010101010101`. It is flagged with
`is_demo = true`, and the notification dispatcher records events while
suppressing external email delivery.
