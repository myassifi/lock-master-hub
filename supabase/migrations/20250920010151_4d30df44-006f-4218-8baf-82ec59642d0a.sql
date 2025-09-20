-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;