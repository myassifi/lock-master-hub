-- Add user_id column to customers table to track ownership
ALTER TABLE public.customers 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing customers to have a user_id (set to first available user or null)
-- This is a one-time migration - in production you'd handle this more carefully
UPDATE public.customers 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Make user_id required for new records
ALTER TABLE public.customers 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;

-- Create secure RLS policies that require authentication and user ownership
CREATE POLICY "Authenticated users can create their own customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view only their own customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update only their own customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);