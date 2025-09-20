-- Insert sample customers
INSERT INTO public.customers (name, phone, email, address, notes) VALUES
('John Smith', '(555) 123-4567', 'john.smith@email.com', '123 Main St, Downtown', 'Regular customer, prefers morning appointments'),
('Sarah Johnson', '(555) 234-5678', 'sarah.j@gmail.com', '456 Oak Ave, Uptown', 'Emergency contact available'),
('Mike Rodriguez', '(555) 345-6789', 'mike.rodriguez@company.com', '789 Pine Rd, Business District', 'Commercial account - office building'),
('Emily Chen', '(555) 456-7890', 'emily.chen@email.com', '321 Elm St, Suburbs', 'Lost all keys, needed full rekey'),
('David Wilson', '(555) 567-8901', 'david.w@hotmail.com', '654 Maple Dr, Westside', NULL),
('Lisa Anderson', '(555) 678-9012', 'lisa.anderson@email.com', '987 Cedar Ln, Eastside', 'Apartment complex manager'),
('Robert Taylor', '(555) 789-0123', 'bob.taylor@email.com', '147 Birch St, Midtown', 'Prefers text communication'),
('Jennifer Brown', '(555) 890-1234', 'jen.brown@gmail.com', '258 Spruce Ave, Northside', 'High security requirements'),
('Michael Davis', '(555) 901-2345', 'mdavis@business.com', '369 Willow Rd, Industrial', 'Fleet vehicle keys'),
('Amanda Miller', '(555) 012-3456', 'amanda.m@email.com', '741 Poplar St, Riverside', 'Smart lock installation customer');

-- Insert sample inventory items
INSERT INTO public.inventory (sku, key_type, quantity, cost, supplier, low_stock_threshold) VALUES
('HY17-001', 'Hyundai 2017-2020 Smart Key 4-Button', 8, 45.99, 'KeylessFactory', 3),
('TOY-CAM14', 'Toyota Camry 2014-2017 4-Button Flip Key', 12, 38.50, 'KeylessFactory', 5),
('HON-ACC08', 'Honda Accord 2008-2015 Remote Head Key', 15, 28.75, 'KeylessFactory', 5),
('GM-FP5', 'GM 2010-2020 5-Button Flip Key', 6, 42.00, 'KeylessFactory', 3),
('CHY-OHT3', 'Chrysler/Dodge/Jeep 3-Button Remote Head', 20, 25.90, 'KeylessFactory', 8),
('UNIVERSAL-HEAD', 'Universal Straight Key Head', 50, 1.15, 'Keydiy', 10),
('FD-FML3', 'Ford/Lincoln 2013-2020 5-Button Smart Key', 4, 55.25, 'KeylessFactory', 2),
('VW-FBK7', 'Volkswagen 7-Button Fobik Key', 3, 48.60, 'KeylessFactory', 2),
('ROLLPINS-16x8', 'Roll Pins 1.6 × 8 mm (100-pack)', 25, 6.00, 'GTL', 5),
('NISSAN-IKEY', 'Nissan-Style Programmable IKEY Smart Key', 7, 62.80, 'Autel', 3),
('REMOTE-HYUNDAI', 'Universal Wired Remote (Hyundai-Style)', 10, 18.45, 'Xhorse', 4),
('FLIP-KNIFE3', 'Knife-Style 3-Button SUPER Remote Flip Key', 9, 35.75, 'Xhorse', 4);

-- Insert sample jobs with correct enum values
INSERT INTO public.jobs (customer_id, job_type, job_date, status, price, notes, vehicle_lock_details) VALUES
((SELECT id FROM customers WHERE name = 'John Smith'), 'car_unlock', '2024-01-20', 'paid', 85.00, 'Toyota Camry 2015, passenger door lock picked', 'Toyota Camry 2015 - front passenger door'),
((SELECT id FROM customers WHERE name = 'Sarah Johnson'), 'spare_key', '2024-01-21', 'completed', 25.00, 'Made 2 copies of house key', NULL),
((SELECT id FROM customers WHERE name = 'Mike Rodriguez'), 'lock_installation', '2024-01-22', 'in_progress', 450.00, 'Commercial grade deadbolts for office building', 'Office main entrance and 3 side doors'),
((SELECT id FROM customers WHERE name = 'Emily Chen'), 'house_rekey', '2024-01-23', 'paid', 120.00, 'Rekeyed all locks after lost keys', 'Front door, back door, garage side door'),
((SELECT id FROM customers WHERE name = 'David Wilson'), 'smart_key_programming', '2024-01-24', 'pending', 150.00, 'Program new Honda key fob', 'Honda Civic 2018 - remote start key'),
((SELECT id FROM customers WHERE name = 'Lisa Anderson'), 'lock_repair', '2024-01-25', 'completed', 75.00, 'Fixed sticky apartment mailbox locks', NULL),
((SELECT id FROM customers WHERE name = 'Robert Taylor'), 'car_unlock', '2024-01-26', 'paid', 90.00, 'BMW 3 Series emergency lockout', 'BMW 3 Series 2019 - driver door'),
((SELECT id FROM customers WHERE name = 'Jennifer Brown'), 'lock_installation', '2024-01-27', 'pending', 680.00, 'High security lock system installation', 'Smart locks with biometric access'),
((SELECT id FROM customers WHERE name = 'Michael Davis'), 'spare_key', '2024-01-28', 'completed', 180.00, 'Fleet vehicle keys - 12 copies made', 'Commercial van fleet keys'),
((SELECT id FROM customers WHERE name = 'Amanda Miller'), 'lock_installation', '2024-01-29', 'in_progress', 350.00, 'Smart lock installation and setup', 'August smart lock with app integration'),
-- Add some older jobs for history
((SELECT id FROM customers WHERE name = 'John Smith'), 'spare_key', '2023-12-15', 'paid', 30.00, 'House key backup copies', NULL),
((SELECT id FROM customers WHERE name = 'Sarah Johnson'), 'lock_repair', '2023-11-20', 'paid', 65.00, 'Front door lock mechanism repair', NULL),
((SELECT id FROM customers WHERE name = 'Emily Chen'), 'smart_key_programming', '2023-10-10', 'paid', 125.00, 'Programmed replacement car key', 'Honda Accord 2016'),
((SELECT id FROM customers WHERE name = 'Mike Rodriguez'), 'house_rekey', '2023-09-05', 'paid', 200.00, 'Office security upgrade', 'Main office and conference rooms'),
((SELECT id FROM customers WHERE name = 'Lisa Anderson'), 'car_unlock', '2024-01-30', 'pending', 95.00, 'Locked keys in trunk', 'Subaru Outback 2020'),
((SELECT id FROM customers WHERE name = 'Robert Taylor'), 'all_keys_lost', '2024-01-15', 'paid', 275.00, 'Complete key replacement after theft', 'Honda CR-V 2020 - all keys stolen'),
((SELECT id FROM customers WHERE name = 'Jennifer Brown'), 'other', '2024-01-10', 'completed', 150.00, 'Security consultation and assessment', 'Home security upgrade recommendations');

-- Update some jobs to create variety in status and recent activity
UPDATE public.jobs SET 
  job_date = CURRENT_DATE,
  status = 'pending'
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Amanda Miller') AND job_type = 'lock_installation';

UPDATE public.jobs SET 
  job_date = CURRENT_DATE - INTERVAL '1 day',
  status = 'in_progress'
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Mike Rodriguez') AND job_type = 'lock_installation';