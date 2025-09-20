-- Add FCC ID field to inventory table for regulatory compliance tracking
ALTER TABLE public.inventory 
ADD COLUMN fcc_id TEXT;