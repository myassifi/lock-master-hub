-- Create job_inventory junction table to link jobs with inventory items used
CREATE TABLE public.job_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  inventory_id UUID NOT NULL,
  quantity_used INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own job inventory" 
ON public.job_inventory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job inventory" 
ON public.job_inventory 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job inventory" 
ON public.job_inventory 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job inventory" 
ON public.job_inventory 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add profit margin and cost tracking to jobs table
ALTER TABLE public.jobs 
ADD COLUMN material_cost NUMERIC DEFAULT 0,
ADD COLUMN profit_margin NUMERIC,
ADD COLUMN total_cost NUMERIC;

-- Create function to calculate job costs and update inventory
CREATE OR REPLACE FUNCTION public.update_job_costs_and_inventory()
RETURNS TRIGGER AS $$
DECLARE
  job_material_cost NUMERIC := 0;
  job_total_cost NUMERIC := 0;
  job_profit NUMERIC := 0;
BEGIN
  -- Calculate total material cost for the job
  SELECT COALESCE(SUM(total_cost), 0) 
  INTO job_material_cost
  FROM public.job_inventory 
  WHERE job_id = NEW.job_id;
  
  -- Update job with material cost
  UPDATE public.jobs 
  SET 
    material_cost = job_material_cost,
    total_cost = COALESCE(price, 0) + job_material_cost,
    profit_margin = CASE 
      WHEN price > 0 THEN ((price - job_material_cost) / price) * 100
      ELSE 0 
    END
  WHERE id = NEW.job_id;
  
  -- If this is a new inventory usage, deduct from inventory
  IF TG_OP = 'INSERT' THEN
    UPDATE public.inventory 
    SET 
      quantity = quantity - NEW.quantity_used,
      usage_count = usage_count + NEW.quantity_used,
      last_used_date = now()
    WHERE id = NEW.inventory_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for job inventory changes
CREATE TRIGGER update_job_costs_and_inventory_trigger
AFTER INSERT OR UPDATE ON public.job_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_job_costs_and_inventory();