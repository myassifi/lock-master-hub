-- First, remove the unique constraint on the sku column
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_sku_key;

-- Update all existing inventory items to use the new naming format: make + year + category
UPDATE inventory
SET sku = CONCAT(
  COALESCE(make, 'Unknown'),
  ' ',
  COALESCE(year_from::text, year_to::text, 'N/A'),
  ' ',
  COALESCE(category, 'General')
)
WHERE make IS NOT NULL;