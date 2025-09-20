-- Create enum types for job status and job types
CREATE TYPE public.job_status AS ENUM ('pending', 'in_progress', 'completed', 'paid');
CREATE TYPE public.job_type AS ENUM ('spare_key', 'all_keys_lost', 'car_unlock', 'smart_key_programming', 'house_rekey', 'lock_repair', 'lock_installation', 'other');

-- Create customers table
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    job_type job_type NOT NULL,
    vehicle_lock_details TEXT,
    price DECIMAL(10,2),
    job_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status job_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table
CREATE TABLE public.inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    key_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,2),
    supplier TEXT,
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user authentication
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT DEFAULT 'Heat Wave Locksmith',
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (true); -- For now, allow all authenticated users

CREATE POLICY "Users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update customers" 
ON public.customers 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete customers" 
ON public.customers 
FOR DELETE 
USING (true);

-- Create RLS policies for jobs
CREATE POLICY "Users can view jobs" 
ON public.jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update jobs" 
ON public.jobs 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete jobs" 
ON public.jobs 
FOR DELETE 
USING (true);

-- Create RLS policies for inventory
CREATE POLICY "Users can view inventory" 
ON public.inventory 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update inventory" 
ON public.inventory 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete inventory" 
ON public.inventory 
FOR DELETE 
USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_date ON public.jobs(job_date);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_phone ON public.customers(phone);