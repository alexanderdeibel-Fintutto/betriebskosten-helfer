-- 1. Add custom_label to operating_cost_items for user-defined categories
ALTER TABLE public.operating_cost_items 
ADD COLUMN IF NOT EXISTS custom_label TEXT,
ADD COLUMN IF NOT EXISTS is_custom_category BOOLEAN DEFAULT false;

-- 2. Create table for individual receipts/amounts within a cost item
CREATE TABLE IF NOT EXISTS public.cost_item_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operating_cost_item_id UUID NOT NULL REFERENCES public.operating_cost_items(id) ON DELETE CASCADE,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cost_item_receipts
ALTER TABLE public.cost_item_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for cost_item_receipts (via operating_cost_items -> operating_costs -> user_id)
CREATE POLICY "Users can view their own receipts" 
ON public.cost_item_receipts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.operating_cost_items oci
    JOIN public.operating_costs oc ON oci.operating_cost_id = oc.id
    WHERE oci.id = cost_item_receipts.operating_cost_item_id
    AND oc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own receipts" 
ON public.cost_item_receipts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operating_cost_items oci
    JOIN public.operating_costs oc ON oci.operating_cost_id = oc.id
    WHERE oci.id = cost_item_receipts.operating_cost_item_id
    AND oc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own receipts" 
ON public.cost_item_receipts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.operating_cost_items oci
    JOIN public.operating_costs oc ON oci.operating_cost_id = oc.id
    WHERE oci.id = cost_item_receipts.operating_cost_item_id
    AND oc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own receipts" 
ON public.cost_item_receipts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.operating_cost_items oci
    JOIN public.operating_costs oc ON oci.operating_cost_id = oc.id
    WHERE oci.id = cost_item_receipts.operating_cost_item_id
    AND oc.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_cost_item_receipts_updated_at
BEFORE UPDATE ON public.cost_item_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create version history table for operating costs
CREATE TABLE IF NOT EXISTS public.operating_cost_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operating_cost_id UUID NOT NULL REFERENCES public.operating_costs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  total_costs NUMERIC NOT NULL DEFAULT 0,
  total_prepayments NUMERIC NOT NULL DEFAULT 0,
  changed_by UUID REFERENCES auth.users(id),
  change_summary TEXT,
  snapshot_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on operating_cost_versions
ALTER TABLE public.operating_cost_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for operating_cost_versions
CREATE POLICY "Users can view their own versions" 
ON public.operating_cost_versions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.operating_costs oc
    WHERE oc.id = operating_cost_versions.operating_cost_id
    AND oc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create versions for their costs" 
ON public.operating_cost_versions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.operating_costs oc
    WHERE oc.id = operating_cost_versions.operating_cost_id
    AND oc.user_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_cost_item_receipts_item_id ON public.cost_item_receipts(operating_cost_item_id);
CREATE INDEX IF NOT EXISTS idx_operating_cost_versions_cost_id ON public.operating_cost_versions(operating_cost_id);