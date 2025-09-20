-- Clear existing inventory data
DELETE FROM public.inventory;

-- Create a function to import CSV inventory data
CREATE OR REPLACE FUNCTION import_inventory_from_csv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    temp_user_id UUID;
BEGIN
    -- Get the first authenticated user (you may need to adjust this)
    SELECT auth.uid() INTO temp_user_id;
    
    -- If no authenticated user, use a default UUID (this is for bulk import)
    IF temp_user_id IS NULL THEN
        -- You'll need to replace this with an actual user ID
        temp_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Insert the new inventory data with parsed year ranges
    INSERT INTO public.inventory (key_type, sku, quantity, cost, category, brand, supplier, year_from, year_to, user_id) VALUES
    ('flip key', 'XHS-XEDS01EN', 5, 11.99, 'Automotive Keys', 'Xhorse', 'Xhorse', NULL, NULL, temp_user_id),
    ('smart key', 'AUTEL-IKEYNS4TP', 3, 18.6, 'Automotive Keys', 'Nissan', 'Autel', NULL, NULL, temp_user_id),
    ('remote head key', 'XHS-XKBU01EN', 3, 9.02, 'Automotive Keys', 'GM', 'Xhorse', NULL, NULL, temp_user_id),
    ('smart key', 'RSK-FD-FML3', 1, 24.2, 'Automotive Keys', 'Ford/Lincoln', 'KeylessFactory', 2013, 2020, temp_user_id),
    ('smart key', 'XHS-XSKF01EN', 1, 21.34, 'Automotive Keys', 'Universal', 'Xhorse', NULL, NULL, temp_user_id),
    ('flip key', 'RFK-TOY-BDM-H4A', 1, 17.82, 'Automotive Keys', 'Toyota', 'KeylessFactory', 2014, 2017, temp_user_id),
    ('smart key', 'RSK-HY-SY5-4', 1, 16.1, 'Automotive Keys', 'Hyundai/Kia', 'KeylessFactory', 2009, 2015, temp_user_id),
    ('smart key', 'RSK-GM-4EA-5', 1, 15.5, 'Automotive Keys', 'Chevrolet', 'KeylessFactory', 2016, 2022, temp_user_id),
    ('remote head key', 'RK-HON-CIV-4', 2, 7.6, 'Automotive Keys', 'Acura/Honda', 'KeylessFactory', 2006, 2013, temp_user_id),
    ('remote head key', 'RK-CHY-OHT-3', 2, 6.9, 'Automotive Keys', 'Chrysler/Dodge/Jeep', 'KeylessFactory', 2004, 2017, temp_user_id),
    ('smart key', 'RSK-JP-1302-5', 1, 13.1, 'Automotive Keys', 'Jeep', 'KeylessFactory', 2014, 2023, temp_user_id),
    ('key head', 'KD-UNIVERSAL-HEAD', 10, 1.15, 'General', 'Universal', 'Keydiy', NULL, NULL, temp_user_id),
    ('remote head key', 'RHK-TOY-BDM-H-4', 1, 10.74, 'Automotive Keys', 'Toyota', 'KeylessFactory', 2014, 2018, temp_user_id),
    ('remote head key', 'RK-FD-302', 1, 10.45, 'Automotive Keys', 'Ford/Mercury', 'KeylessFactory', 2001, 2018, temp_user_id),
    ('remote head key', 'RK-HON-1TA-4', 1, 8.34, 'Automotive Keys', 'Honda', 'KeylessFactory', 2016, 2020, temp_user_id),
    ('fobik key', 'RK-CHY-FBK-7', 1, 8.2, 'Automotive Keys', 'Chrysler/Dodge/VW', 'KeylessFactory', 2008, 2018, temp_user_id),
    ('wired remote', 'XHS-XKHY01EN', 1, 7.46, 'Automotive Keys', 'Hyundai', 'Xhorse', NULL, NULL, temp_user_id),
    ('flip key', 'RK-GM-FP5', 1, 7.4, 'Automotive Keys', 'GM', 'KeylessFactory', 2010, 2020, temp_user_id),
    ('roll pins', 'GTL-XX-0331', 1, 6, 'Hardware', 'GTL', 'GTL', NULL, NULL, temp_user_id),
    ('remote head key', 'RHK-HON-ACC2', 1, 5.8, 'Automotive Keys', 'Honda', 'KeylessFactory', 2008, 2015, temp_user_id),
    ('remote head key', 'RK-HON-OUC-3', 1, 5.69, 'Automotive Keys', 'Honda', 'KeylessFactory', 2005, 2014, temp_user_id);
END;
$$;