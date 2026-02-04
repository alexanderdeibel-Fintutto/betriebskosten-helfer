-- Create products table for storing Fintutto app products and pricing
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ai_cross_sell_triggers table for cross-marketing banners
CREATE TABLE public.ai_cross_sell_triggers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_app_id text NOT NULL,
  target_app_id text NOT NULL,
  trigger_condition text,
  headline text NOT NULL,
  description text NOT NULL,
  cta_text text NOT NULL DEFAULT 'Jetzt entdecken',
  cta_url text,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(source_app_id, target_app_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cross_sell_triggers ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (pricing info)
CREATE POLICY "Products are publicly readable"
ON public.products FOR SELECT
USING (is_active = true);

-- Cross-sell triggers are publicly readable
CREATE POLICY "Cross-sell triggers are publicly readable"
ON public.ai_cross_sell_triggers FOR SELECT
USING (is_active = true);

-- Insert initial Fintutto products
INSERT INTO public.products (app_id, name, description, price_monthly, price_yearly, features) VALUES
('nebenkosten', 'Fintutto Nebenkosten', 'Professionelle Nebenkostenabrechnungen nach BetrKV', 9.99, 95.88, '["Unbegrenzte Abrechnungen", "PDF-Export", "E-Mail-Versand", "Mehrere Gebäude"]'),
('buchhaltung', 'Fintutto Buchhaltung', 'Einfache Buchhaltung für Vermieter', 14.99, 143.88, '["Einnahmen-Überschuss-Rechnung", "Belegerfassung", "DATEV-Export", "Steuerberater-Zugang"]'),
('mieterverwaltung', 'Fintutto Mieterverwaltung', 'Komplette Mieterverwaltung', 19.99, 191.88, '["Mietverträge", "Kündigungen", "Mietanpassungen", "Dokumentenarchiv"]'),
('immobilien', 'Fintutto Immobilien', 'Portfolio-Management für Immobilien', 24.99, 239.88, '["Wertentwicklung", "Renditeberechnung", "Instandhaltungsplanung", "Marktanalysen"]');

-- Insert cross-sell triggers for nebenkosten app
INSERT INTO public.ai_cross_sell_triggers (source_app_id, target_app_id, headline, description, cta_text, cta_url, priority) VALUES
('nebenkosten', 'buchhaltung', 'Buchhaltung leicht gemacht', 'Verbinden Sie Ihre Nebenkostenabrechnungen direkt mit Ihrer Buchhaltung. Automatische Buchungen sparen Zeit!', 'Buchhaltung entdecken', 'https://buchhaltung.fintutto.de', 10),
('nebenkosten', 'mieterverwaltung', 'Alle Mieter im Blick', 'Verwalten Sie Mietverträge, Kündigungen und Mietanpassungen an einem Ort.', 'Mieterverwaltung testen', 'https://mieterverwaltung.fintutto.de', 8),
('nebenkosten', 'immobilien', 'Ihr Immobilien-Portfolio', 'Behalten Sie den Überblick über Wertentwicklung und Rendite Ihrer Immobilien.', 'Portfolio-Manager öffnen', 'https://immobilien.fintutto.de', 5);