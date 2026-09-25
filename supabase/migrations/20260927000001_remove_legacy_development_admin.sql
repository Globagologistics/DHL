-- The historical setup script created this known local-only account. Never
-- remove a real administrator or reassign customer data here. If a legacy
-- shipment still references it, leave the record intact for owner review.
DELETE FROM public.users AS legacy
WHERE legacy.id = '00000000-0000-0000-0000-000000000000'::uuid
  AND legacy.email = 'admin@buske.local'
  AND legacy.user_type = 'admin'
  AND NOT EXISTS (SELECT 1 FROM public.shipments WHERE admin_id = legacy.id);
