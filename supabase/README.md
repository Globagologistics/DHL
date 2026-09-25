# Supabase deployment notes

`supabase/migrations/` is the authoritative, ordered deployment history. Do
not run `setup/full_setup.sql` against an existing or production project: it
is retained only as a legacy local-schema reference and no longer creates a
default administrator.

Before the first remote deployment, an owner must authenticate the Supabase
CLI, link project `vqdkrkweyqpbbujsmooh`, review `supabase db push --dry-run`,
and apply the ordered migrations. Provision the first administrator through
Supabase Auth and the `public.users` profile workflow before applying the
portfolio demo migration; that migration deliberately refuses to create an
administrator itself.

The permanent synthetic shipment is `010101010101`. It is flagged with
`is_demo = true`, and the notification dispatcher records events while
suppressing external email delivery.
