-- Create activities table to track all actions in the app
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities
CREATE POLICY "Users can view activities" 
ON public.activities 
FOR SELECT 
USING (true);

CREATE POLICY "System can create activities" 
ON public.activities 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX idx_activities_user ON public.activities(user_id);

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    user_id, action_type, entity_type, entity_id, entity_name, description, metadata
  ) VALUES (
    p_user_id, p_action_type, p_entity_type, p_entity_id, p_entity_name, p_description, p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;