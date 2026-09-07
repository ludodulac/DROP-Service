-- Preserve the original prospect submission.
-- Applied to Supabase project nczdadkyysrxxcsnsrrn on 2026-09-08.
-- Artisans may read their own requests through RLS, but may only mutate the workflow status.

revoke update on table public.drop_service_requests from authenticated;
grant update (status) on table public.drop_service_requests to authenticated;
