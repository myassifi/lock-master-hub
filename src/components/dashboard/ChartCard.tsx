import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyState?: {
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  isEmpty,
  emptyState,
}: ChartCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <Button variant="ghost" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty && emptyState ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">{emptyState.message}</p>
            {emptyState.action && (
              <Button onClick={emptyState.action.onClick} size="sm">
                {emptyState.action.label}
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
