import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal } from 'lucide-react';

interface FilterState {
  category: string;
  make: string;
  supplier: string;
  priceRange: string;
  stockStatus: string;
  fccId: string;
}

interface InventoryFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  suppliers: string[];
  makes: string[];
  categories: string[];
}

export function InventoryFilters({
  filters,
  onFilterChange,
  onReset,
  suppliers,
  makes,
  categories,
}: InventoryFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Inventory</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => onFilterChange({ category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Make</Label>
            <Select
              value={filters.make}
              onValueChange={(value) => onFilterChange({ make: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Makes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {makes.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={filters.supplier}
              onValueChange={(value) => onFilterChange({ supplier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={filters.stockStatus}
              onValueChange={(value) => onFilterChange({ stockStatus: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Price Range</Label>
            <Select
              value={filters.priceRange}
              onValueChange={(value) => onFilterChange({ priceRange: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="low">Under $10</SelectItem>
                <SelectItem value="medium">$10 - $50</SelectItem>
                <SelectItem value="high">Over $50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>FCC ID Contains</Label>
            <Input
              placeholder="Search FCC ID..."
              value={filters.fccId}
              onChange={(e) => onFilterChange({ fccId: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onReset} variant="outline" className="flex-1">
              Reset
            </Button>
            <SheetTrigger asChild>
              <Button className="flex-1">Apply</Button>
            </SheetTrigger>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
