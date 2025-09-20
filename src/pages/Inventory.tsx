import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SearchBar } from '@/components/SearchBar';
import { SkeletonCard } from '@/components/LoadingSpinner';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { ActivityLogger } from '@/lib/activityLogger';

interface InventoryItem {
  id: string;
  sku: string;
  key_type: string;
  quantity: number;
  cost?: number;
  supplier?: string;
  low_stock_threshold: number;
  created_at: string;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { isLoading, executeAsync } = useErrorHandler();
  const [formData, setFormData] = useState({
    sku: '',
    key_type: '',
    quantity: '',
    cost: '',
    supplier: '',
    low_stock_threshold: '5'
  });

  // Real-time updates
  useRealtimeUpdates({
    table: 'inventory',
    onInsert: () => loadInventory(),
    onUpdate: () => loadInventory(),
    onDelete: () => loadInventory(),
    showNotifications: true
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    await executeAsync(async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('key_type');

      if (error) throw error;
      setInventory(data || []);
      setFilteredInventory(data || []);
      return true;
    }, {
      errorMessage: "Failed to load inventory"
    });
  };

  // Enhanced search functionality
  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item =>
        item.key_type.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredInventory(filtered);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        low_stock_threshold: parseInt(formData.low_stock_threshold)
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        // Log activity
        ActivityLogger.inventoryUpdated(
          formData.key_type,
          itemData.quantity,
          editingItem.id,
          editingItem.quantity
        );
        
        toast({ title: "Success", description: "Item updated successfully" });
      } else {
        const { data, error } = await supabase
          .from('inventory')
          .insert([itemData])
          .select();

        if (error) throw error;
        
        // Log activity
        if (data && data[0]) {
          ActivityLogger.inventoryAdded(
            formData.key_type,
            itemData.quantity,
            data[0].id
          );
        }
        
        toast({ title: "Success", description: "Item added successfully" });
      }
      
      loadInventory();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate key') 
          ? "SKU already exists" 
          : "Failed to save item",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      key_type: item.key_type,
      quantity: item.quantity.toString(),
      cost: item.cost ? item.cost.toString() : '',
      supplier: item.supplier || '',
      low_stock_threshold: item.low_stock_threshold.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Find the item to get its name before deletion
    const item = inventory.find(item => item.id === id);
    if (!item) return;
    
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log activity
      ActivityLogger.inventoryDeleted(item.key_type);
      
      toast({ title: "Success", description: "Item deleted successfully" });
      loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const adjustQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    // Find the item to get current quantity and name
    const item = inventory.find(item => item.id === id);
    if (!item) return;
    
    const quantityChange = newQuantity - item.quantity;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
      
      // Log activity
      ActivityLogger.inventoryAdjusted(
        item.key_type,
        quantityChange,
        newQuantity,
        id
      );
      
      loadInventory();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      key_type: '',
      quantity: '',
      cost: '',
      supplier: '',
      low_stock_threshold: '5'
    });
    setEditingItem(null);
  };

  const isLowStock = (item: InventoryItem) => {
    return item.quantity <= item.low_stock_threshold;
  };

  const lowStockItems = inventory.filter(isLowStock);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 fade-in">
        <h1 className="mobile-heading font-bold">Inventory</h1>
        <div className="mobile-grid">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 fade-in">
      {/* Mobile-optimized header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 gap-4">
        <div className="min-w-0">
          <h1 className="mobile-heading font-bold text-primary">Inventory</h1>
          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              <span className="text-sm text-destructive">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} low in stock
              </span>
            </div>
          )}
        </div>
        
        {/* Mobile-friendly search */}
        <div className="w-full sm:max-w-md">
          <SearchBar
            placeholder="Search inventory..."
            onSearch={handleSearch}
            onClear={() => handleSearch('')}
          />
        </div>
        
        {/* Mobile-optimized dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto responsive-btn touch-target">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Add Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="sku" className="mobile-text">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                  placeholder="e.g., HY17, HON66"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="key_type" className="mobile-text">Key Type *</Label>
                <Input
                  id="key_type"
                  value={formData.key_type}
                  onChange={(e) => setFormData({ ...formData, key_type: e.target.value })}
                  required
                  placeholder="e.g., Toyota G Chip, Remote Fob"
                  className="touch-target"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity" className="mobile-text">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="touch-target"
                  />
                </div>
                <div>
                  <Label htmlFor="low_stock_threshold" className="mobile-text">Low Stock Alert</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    className="touch-target"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cost" className="mobile-text">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="touch-target"
                />
              </div>
              <div>
                <Label htmlFor="supplier" className="mobile-text">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  className="touch-target"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="flex-1 touch-target responsive-btn">
                  {editingItem ? 'Update' : 'Add'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  className="touch-target responsive-btn"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile-optimized inventory grid */}
      <div className="mobile-grid">
        {filteredInventory.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="responsive-card text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mobile-text">
                {searchTerm ? 'No items found matching your search.' : 'No inventory items added yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInventory.map((item, index) => (
            <Card 
              key={item.id} 
              className={`hover-lift glass-card fade-in ${isLowStock(item) ? 'border-destructive' : ''}`}
              style={{animationDelay: `${index * 100}ms`}}
            >
              <CardHeader className="pb-3 responsive-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <span className="truncate">{item.key_type}</span>
                      {isLowStock(item) && (
                        <AlertTriangle className="h-4 w-4 text-destructive animate-pulse flex-shrink-0" />
                      )}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      SKU: {item.sku}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="touch-target h-8 w-8 p-0"
                      title="Edit Item"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive touch-target h-8 w-8 p-0"
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 responsive-card">
                <div className="space-y-3">
                  {/* Mobile-optimized quantity controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 0}
                        className="touch-target h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Badge 
                        variant={isLowStock(item) ? "destructive" : "secondary"}
                        className="min-w-[3rem] text-center"
                      >
                        {item.quantity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => adjustQuantity(item.id, item.quantity + 1)}
                        className="touch-target h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mobile-optimized item details */}
                  {item.cost && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium text-green-600">${Number(item.cost).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {item.supplier && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span className="truncate max-w-[60%]" title={item.supplier}>{item.supplier}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Low stock alert:</span>
                    <span>{item.low_stock_threshold}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}