-- CRITICAL SECURITY FIXES FOR DATA ISOLATION
-- This migration addresses multiple security vulnerabilities by implementing proper user data isolation

-- 1. Add user_id column to jobs table for proper data isolation
ALTER TABLE public.jobs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update existing jobs to associate them with the current authenticated user
-- Since we can't determine the actual owner of existing jobs, we'll need to handle this carefully
-- For now, we'll set a NOT NULL constraint after updating
UPDATE public.jobs SET user_id = auth.uid() WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL to prevent future data without ownership
ALTER TABLE public.jobs ALTER COLUMN user_id SET NOT NULL;

-- 4. Drop the existing insecure RLS policies for jobs table
DROP POLICY IF EXISTS "Users can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete jobs" ON public.jobs; 
DROP POLICY IF EXISTS "Users can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view jobs" ON public.jobs;

-- 5. Create secure RLS policies for jobs table with proper user isolation
CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Fix inventory table RLS policies (table already has user_id)
DROP POLICY IF EXISTS "Users can create inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can delete inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can view inventory" ON public.inventory;

CREATE POLICY "Users can create their own inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own inventory" 
ON public.inventory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory" 
ON public.inventory 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory" 
ON public.inventory 
FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Fix activities table RLS policies and ensure user_id is not nullable
-- First make user_id NOT NULL for data integrity
UPDATE public.activities SET user_id = auth.uid() WHERE user_id IS NULL;
ALTER TABLE public.activities ALTER COLUMN user_id SET NOT NULL;

-- Drop existing insecure policies
DROP POLICY IF EXISTS "System can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;

-- Create secure policies for activities
CREATE POLICY "Users can create their own activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities" 
ON public.activities 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Activities are typically append-only, so we don't allow updates/deletes by design

-- 8. Add indexes for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);