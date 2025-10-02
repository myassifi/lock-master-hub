import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings2, ChevronDown, ChevronUp, ArrowUpDown, Minus, Plus, Edit, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface InventoryDataTableProps {
  data: InventoryItem[];
  onQuantityChange: (id: string, quantity: number) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

export function InventoryDataTable({ 
  data, 
  onQuantityChange, 
  onEdit, 
  onDelete,
  onBulkAction 
}: InventoryDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const getStockStatus = (item: InventoryItem) => {
    const threshold = item.low_stock_threshold || 3;
    if (item.quantity === 0) return 'out';
    if (item.quantity <= threshold) return 'low';
    return 'in-stock';
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'sku',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Item Name
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = getStockStatus(row.original);
        return (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{row.getValue('sku')}</div>
              <div className="flex items-center gap-2 mt-1">
                {status === 'out' && (
                  <Badge variant="destructive" className="text-xs">Out</Badge>
                )}
                {status === 'low' && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">Low</Badge>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'fcc_id',
      header: 'FCC ID',
      cell: ({ row }) => {
        const fccId = row.getValue('fcc_id') as string;
        return fccId ? (
          <code className="text-xs bg-muted px-2 py-1 rounded">{fccId}</code>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Quantity
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        const status = getStockStatus(row.original);
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(row.original.id, quantity - 1)}
              disabled={quantity <= 0}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <div className={`min-w-[3rem] text-center font-medium ${
              status === 'out' ? 'text-destructive' : 
              status === 'low' ? 'text-amber-600' : ''
            }`}>
              {quantity}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuantityChange(row.original.id, quantity + 1)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'cost',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Unit Cost
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const cost = row.getValue('cost') as number;
        return cost ? (
          <span className="font-medium text-emerald-600">${cost.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'total_cost_value',
      header: 'Total Value',
      cell: ({ row }) => {
        const total = row.getValue('total_cost_value') as number;
        return total ? (
          <span className="font-semibold text-emerald-700">${total.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => {
        const supplier = row.getValue('supplier') as string;
        return supplier ? (
          <Badge variant="secondary" className="text-xs">{supplier}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(row.original));
              }}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(row.original.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedRows.length} item{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (onBulkAction) {
                onBulkAction('adjust-qty', selectedRows.map(r => r.original.id));
              }
            }}>
              Adjust Quantity
            </Button>
            <Button variant="outline" size="sm">
              Set Threshold
            </Button>
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Column Visibility */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
