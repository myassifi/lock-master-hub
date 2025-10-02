import { useRef, useState, TouchEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Copy, Trash2, Minus, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface SwipeableInventoryCardProps {
  item: InventoryItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function SwipeableInventoryCard({
  item,
  onQuantityChange,
  onEdit,
  onDelete,
}: SwipeableInventoryCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const threshold = item.low_stock_threshold || 3;
  const isLowStock = item.quantity <= threshold && item.quantity > 0;
  const isOutOfStock = item.quantity === 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    // Only allow left swipe (negative values)
    if (diff < 0) {
      setSwipeX(Math.max(diff, -180));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // Snap to revealed state if swiped more than 60px
    if (swipeX < -60) {
      setSwipeX(-180);
    } else {
      setSwipeX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Action Buttons (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-3 bg-muted">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSwipeX(0);
            onEdit(item);
          }}
          className="h-11 w-11 touch-target"
          aria-label="Edit"
        >
          <Edit className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSwipeX(0);
            onDelete(item.id);
          }}
          className="h-11 w-11 touch-target text-destructive hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Card (swipeable) */}
      <Card
        className={cn(
          "transition-transform touch-pan-y",
          !isSwiping && "duration-300"
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-base truncate">{item.sku}</h3>
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs gap-1 shrink-0">
                    <AlertTriangle className="h-3 w-3" />
                    Out
                  </Badge>
                )}
                {isLowStock && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                    Low
                  </Badge>
                )}
              </div>
              {item.fcc_id && (
                <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
                  FCC: {item.fcc_id}
                </div>
              )}
            </div>

            {/* Quantity Stepper - Large Touch Targets */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 0}
                className="h-11 w-11 rounded-full touch-target"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val >= 0) onQuantityChange(item.id, val);
                }}
                className={cn(
                  "h-11 w-14 text-center border-0 bg-transparent font-semibold text-base rounded-md focus:ring-2 focus:ring-primary touch-target",
                  isOutOfStock ? 'text-destructive' : isLowStock ? 'text-amber-600' : ''
                )}
                aria-label="Quantity"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                className="h-11 w-11 rounded-full touch-target"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Unit Cost</span>
              <p className="font-medium text-emerald-600">
                {item.cost ? `$${item.cost.toFixed(2)}` : '—'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Total Value</span>
              <p className="font-semibold text-emerald-700">
                {item.total_cost_value ? `$${item.total_cost_value.toFixed(2)}` : '—'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Threshold</span>
              <p className="font-medium">{threshold}</p>
            </div>
            {item.supplier && (
              <div>
                <span className="text-muted-foreground text-xs">Supplier</span>
                <p className="truncate">
                  <Badge variant="secondary" className="text-xs">{item.supplier}</Badge>
                </p>
              </div>
            )}
          </div>

          {/* Desktop Actions (hidden on mobile when swiping is available) */}
          <div className="hidden sm:flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="flex-1 gap-2 h-9 touch-target"
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
              className="h-9 w-9 p-0 touch-target"
              aria-label="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="h-9 w-9 p-0 text-destructive hover:text-destructive touch-target"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden mt-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              Swipe left for actions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
