-- Add make and module columns to inventory table and rename brand to make
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS make TEXT,
ADD COLUMN IF NOT EXISTS module TEXT;

-- Update existing brand data to make column if brand column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'brand') THEN
        UPDATE public.inventory SET make = brand WHERE brand IS NOT NULL;
        ALTER TABLE public.inventory DROP COLUMN brand;
    END IF;
END $$;

-- Set all low_stock_threshold to 3 for consistent low stock alert
UPDATE public.inventory SET low_stock_threshold = 3;