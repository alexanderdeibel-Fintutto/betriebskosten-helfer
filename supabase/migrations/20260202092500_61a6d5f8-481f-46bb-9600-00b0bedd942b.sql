-- Fix tenants_public view to properly inherit RLS from base table
-- Drop and recreate with security_invoker=on

DROP VIEW IF EXISTS public.tenants_public;

CREATE VIEW public.tenants_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  phone,
  created_at,
  updated_at
FROM public.tenants;

-- Add comment explaining the security pattern
COMMENT ON VIEW public.tenants_public IS 'Public view of tenants excluding sensitive banking information (IBAN/BIC). Uses security_invoker=on to inherit RLS from base tenants table.';