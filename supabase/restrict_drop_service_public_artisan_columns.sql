-- Applied to the IN-SECT Supabase project used by Drop Service.
-- Public visitors only need these fields to render an artisan page.
revoke select on public.drop_service_artisans from anon;
grant select (id, company_name, slug, activity, service_area, logo_url, is_active)
on public.drop_service_artisans to anon;
