import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Copy, Trash2, Minus, Plus, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  key_type: string;
  quantity: number;
  cost?: number;
  supplier?: string;
  category?: string;
  make?: string;
  total_cost_value?: number;
  fcc_id?: string;
  low_stock_threshold?: number;
}

interface InventoryCardProps {
  item: InventoryItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryCard({ item, onQuantityChange, onEdit, onDelete }: InventoryCardProps) {
  const threshold = item.low_stock_threshold || 3;
  const isLowStock = item.quantity <= threshold && item.quantity > 0;
  const isOutOfStock = item.quantity === 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-base truncate">{item.sku}</h3>
              {isOutOfStock && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Out
                </Badge>
              )}
              {isLowStock && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                  Low
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quantity Stepper */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              disabled={item.quantity <= 0}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className={`min-w-[2.5rem] text-center font-semibold ${
              isOutOfStock ? 'text-destructive' : 
              isLowStock ? 'text-amber-600' : 
              'text-foreground'
            }`}>
              {item.quantity}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Body - Key Information */}
        <div className="space-y-2 mb-4">
          {item.fcc_id && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">FCC ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {item.fcc_id}
              </code>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unit Cost</span>
            <span className="font-medium text-emerald-600">
              {item.cost ? `$${item.cost.toFixed(2)}` : '—'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-semibold text-emerald-700">
              {item.total_cost_value ? `$${item.total_cost_value.toFixed(2)}` : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Threshold</span>
            <span className="font-medium">{threshold}</span>
          </div>
          
          {item.supplier && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Supplier</span>
              <Badge variant="secondary" className="text-xs">{item.supplier}</Badge>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="flex-1 gap-2 h-9"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(item));
            }}
            className="h-9 w-9 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
