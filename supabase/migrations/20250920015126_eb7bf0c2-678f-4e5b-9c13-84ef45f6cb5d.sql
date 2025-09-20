-- Add vehicle year range fields to inventory table
ALTER TABLE public.inventory 
ADD COLUMN year_from INTEGER,
ADD COLUMN year_to INTEGER;