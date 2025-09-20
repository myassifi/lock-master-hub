-- Add user_id column to inventory table if it doesn't exist
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing inventory items to have a user_id (set to first available user)
UPDATE public.inventory 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id required for new records
ALTER TABLE public.inventory 
ALTER COLUMN user_id SET NOT NULL;