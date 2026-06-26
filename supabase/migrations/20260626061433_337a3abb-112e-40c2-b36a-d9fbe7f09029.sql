-- Security fix: remove overly permissive write RLS policies on public.reports.
-- Reports is a public no-auth tool, so public READ stays open intentionally.
-- All writes go through trusted server functions using the service-role client,
-- which bypasses RLS, so direct anon INSERT/DELETE policies are unnecessary.
DROP POLICY IF EXISTS "Anyone can create reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can delete reports" ON public.reports;