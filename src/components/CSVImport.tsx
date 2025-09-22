import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download } from 'lucide-react';

export function CSVImport() {
  const [importing, setImporting] = useState(false);

  const importInventoryData = async () => {
    setImporting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to import inventory",
          variant: "destructive"
        });
        return;
      }

      // First clear existing inventory for this user
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Import the new CSV data with parsed year ranges and proper user ID
      const inventoryData = [
        { key_type: 'flip key', sku: 'XHS-XEDS01EN', quantity: 5, cost: 11.99, category: 'Automotive Keys', make: 'Xhorse', supplier: 'Xhorse', year_from: null, year_to: null },
        { key_type: 'smart key', sku: 'AUTEL-IKEYNS4TP', quantity: 3, cost: 18.6, category: 'Automotive Keys', make: 'Nissan', supplier: 'Autel', year_from: null, year_to: null },
        { key_type: 'remote head key', sku: 'XHS-XKBU01EN', quantity: 3, cost: 9.02, category: 'Automotive Keys', make: 'GM', supplier: 'Xhorse', year_from: null, year_to: null },
        { key_type: 'smart key', sku: 'RSK-FD-FML3', quantity: 1, cost: 24.2, category: 'Automotive Keys', make: 'Ford/Lincoln', supplier: 'KeylessFactory', year_from: 2013, year_to: 2020 },
        { key_type: 'smart key', sku: 'XHS-XSKF01EN', quantity: 1, cost: 21.34, category: 'Automotive Keys', make: 'Universal', supplier: 'Xhorse', year_from: null, year_to: null },
        { key_type: 'flip key', sku: 'RFK-TOY-BDM-H4A', quantity: 1, cost: 17.82, category: 'Automotive Keys', make: 'Toyota', supplier: 'KeylessFactory', year_from: 2014, year_to: 2017 },
        { key_type: 'smart key', sku: 'RSK-HY-SY5-4', quantity: 1, cost: 16.1, category: 'Automotive Keys', make: 'Hyundai/Kia', supplier: 'KeylessFactory', year_from: 2009, year_to: 2015 },
        { key_type: 'smart key', sku: 'RSK-GM-4EA-5', quantity: 1, cost: 15.5, category: 'Automotive Keys', make: 'Chevrolet', supplier: 'KeylessFactory', year_from: 2016, year_to: 2022 },
        { key_type: 'remote head key', sku: 'RK-HON-CIV-4', quantity: 2, cost: 7.6, category: 'Automotive Keys', make: 'Acura/Honda', supplier: 'KeylessFactory', year_from: 2006, year_to: 2013 },
        { key_type: 'remote head key', sku: 'RK-CHY-OHT-3', quantity: 2, cost: 6.9, category: 'Automotive Keys', make: 'Chrysler/Dodge/Jeep', supplier: 'KeylessFactory', year_from: 2004, year_to: 2017 },
        { key_type: 'smart key', sku: 'RSK-JP-1302-5', quantity: 1, cost: 13.1, category: 'Automotive Keys', make: 'Jeep', supplier: 'KeylessFactory', year_from: 2014, year_to: 2023 },
        { key_type: 'key head', sku: 'KD-UNIVERSAL-HEAD', quantity: 10, cost: 1.15, category: 'General', make: 'Universal', supplier: 'Keydiy', year_from: null, year_to: null },
        { key_type: 'remote head key', sku: 'RHK-TOY-BDM-H-4', quantity: 1, cost: 10.74, category: 'Automotive Keys', make: 'Toyota', supplier: 'KeylessFactory', year_from: 2014, year_to: 2018 },
        { key_type: 'remote head key', sku: 'RK-FD-302', quantity: 1, cost: 10.45, category: 'Automotive Keys', make: 'Ford/Mercury', supplier: 'KeylessFactory', year_from: 2001, year_to: 2018 },
        { key_type: 'remote head key', sku: 'RK-HON-1TA-4', quantity: 1, cost: 8.34, category: 'Automotive Keys', make: 'Honda', supplier: 'KeylessFactory', year_from: 2016, year_to: 2020 },
        { key_type: 'fobik key', sku: 'RK-CHY-FBK-7', quantity: 1, cost: 8.2, category: 'Automotive Keys', make: 'Chrysler/Dodge/VW', supplier: 'KeylessFactory', year_from: 2008, year_to: 2018 },
        { key_type: 'wired remote', sku: 'XHS-XKHY01EN', quantity: 1, cost: 7.46, category: 'Automotive Keys', make: 'Hyundai', supplier: 'Xhorse', year_from: null, year_to: null },
        { key_type: 'flip key', sku: 'RK-GM-FP5', quantity: 1, cost: 7.4, category: 'Automotive Keys', make: 'GM', supplier: 'KeylessFactory', year_from: 2010, year_to: 2020 },
        { key_type: 'roll pins', sku: 'GTL-XX-0331', quantity: 1, cost: 6, category: 'Hardware', make: 'GTL', supplier: 'GTL', year_from: null, year_to: null },
        { key_type: 'remote head key', sku: 'RHK-HON-ACC2', quantity: 1, cost: 5.8, category: 'Automotive Keys', make: 'Honda', supplier: 'KeylessFactory', year_from: 2008, year_to: 2015 },
        { key_type: 'remote head key', sku: 'RK-HON-OUC-3', quantity: 1, cost: 5.69, category: 'Automotive Keys', make: 'Honda', supplier: 'KeylessFactory', year_from: 2005, year_to: 2014 }
      ];

      // Insert new inventory data with the current user's ID
      const dataWithUserId = inventoryData.map(item => ({
        ...item,
        user_id: user.id,
        total_cost_value: item.cost * item.quantity
      }));

      const { error: insertError } = await supabase
        .from('inventory')
        .insert(dataWithUserId);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Successfully imported ${inventoryData.length} inventory items from CSV`,
      });

      // Refresh the page to show new data
      window.location.reload();

    } catch (error) {
      console.error('Error importing CSV data:', error);
      toast({
        title: "Error",
        description: "Failed to import CSV data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={importInventoryData}
        disabled={importing}
        variant="outline"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        {importing ? 'Importing...' : 'Import CSV Data'}
      </Button>
    </div>
  );
}