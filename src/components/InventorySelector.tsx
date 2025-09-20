import { useState, useEffect } from 'react';
import { Plus, Minus, X, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  sku: string;
  key_type: string;
  quantity: number;
  cost?: number;
  category?: string;
  brand?: string;
  fcc_id?: string;
}

interface JobInventoryItem {
  inventory_id: string;
  quantity_used: number;
  unit_cost?: number;
  total_cost?: number;
  inventory?: {
    id: string;
    sku: string;
    key_type: string;
    quantity: number;
    cost?: number;
    category?: string;
    brand?: string;
  };
}

interface InventorySelectorProps {
  jobId?: string;
  selectedItems: JobInventoryItem[];
  onItemsChange: (items: JobInventoryItem[]) => void;
}

export function InventorySelector({ jobId, selectedItems, onItemsChange }: InventorySelectorProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .gt('quantity', 0)
        .order('key_type');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = (item: InventoryItem) => {
    const existingItem = selectedItems.find(si => si.inventory_id === item.id);
    
    if (existingItem) {
      // Increase quantity if already selected
      updateQuantity(item.id, existingItem.quantity_used + 1);
    } else {
      // Add new item
      const newItem: JobInventoryItem = {
        inventory_id: item.id,
        quantity_used: 1,
        unit_cost: item.cost || 0,
        total_cost: item.cost || 0,
        inventory: item
      };
      onItemsChange([...selectedItems, newItem]);
    }
  };

  const updateQuantity = (inventoryId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(inventoryId);
      return;
    }

    const updatedItems = selectedItems.map(item => {
      if (item.inventory_id === inventoryId) {
        const unitCost = item.unit_cost || 0;
        return {
          ...item,
          quantity_used: newQuantity,
          total_cost: unitCost * newQuantity
        };
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const removeItem = (inventoryId: string) => {
    onItemsChange(selectedItems.filter(item => item.inventory_id !== inventoryId));
  };

  const filteredInventory = inventory.filter(item =>
    item.key_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMaterialCost = selectedItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Materials Used
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Inventory Items</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="text-center py-8">Loading inventory...</div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No items found matching search.' : 'No inventory items available.'}
                  </div>
                ) : (
                  filteredInventory.map((item) => {
                    const selectedItem = selectedItems.find(si => si.inventory_id === item.id);
                    const isSelected = !!selectedItem;
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`cursor-pointer transition-colors hover:bg-accent/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => addInventoryItem(item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.key_type}</h4>
                                {item.brand && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.brand}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                SKU: {item.sku} • Available: {item.quantity}
                              </p>
                              {item.cost && (
                                <p className="text-sm font-medium text-primary">
                                  ${item.cost.toFixed(2)} each
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="ml-2">
                                Selected: {selectedItem.quantity_used}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Items */}
      <div className="space-y-2">
        {selectedItems.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No materials selected. Click "Add Material" to get started.
            </CardContent>
          </Card>
        ) : (
          selectedItems.map((item) => (
            <Card key={item.inventory_id} className="bg-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.inventory?.key_type}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.inventory?.sku}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.inventory_id, item.quantity_used - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity_used}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.inventory_id, item.quantity_used + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-medium">${(item.total_cost || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(item.unit_cost || 0).toFixed(2)} each
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.inventory_id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Cost Summary */}
      {selectedItems.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-medium">Total Material Cost</span>
              </div>
              <span className="text-lg font-bold text-primary">
                ${totalMaterialCost.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}