-- Add enhanced categorization and tracking to inventory
ALTER TABLE public.inventory 
ADD COLUMN category TEXT DEFAULT 'general',
ADD COLUMN brand TEXT,
ADD COLUMN usage_count INTEGER DEFAULT 0,
ADD COLUMN last_used_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN total_cost_value NUMERIC DEFAULT 0;

-- Update total cost value for existing items
UPDATE public.inventory 
SET total_cost_value = COALESCE(cost * quantity, 0)
WHERE cost IS NOT NULL;

-- Create inventory usage tracking table
CREATE TABLE public.inventory_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  quantity_used INTEGER NOT NULL,
  cost_per_unit NUMERIC,
  total_cost NUMERIC,
  used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on inventory_usage
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_usage
CREATE POLICY "Users can create their own usage records" 
ON public.inventory_usage 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage records" 
ON public.inventory_usage 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage records" 
ON public.inventory_usage 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own usage records" 
ON public.inventory_usage 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update inventory usage stats
CREATE OR REPLACE FUNCTION public.update_inventory_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage count and last used date
  UPDATE public.inventory 
  SET 
    usage_count = usage_count + NEW.quantity_used,
    last_used_date = NEW.used_date,
    total_cost_value = COALESCE(cost * quantity, 0)
  WHERE id = NEW.inventory_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for usage tracking
CREATE TRIGGER update_usage_stats_trigger
  AFTER INSERT ON public.inventory_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_usage_stats();

-- Create function to update total cost value when quantity or cost changes
CREATE OR REPLACE FUNCTION public.update_inventory_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost_value = COALESCE(NEW.cost * NEW.quantity, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for cost calculation
CREATE TRIGGER update_total_cost_trigger
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_total_cost();