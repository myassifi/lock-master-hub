import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: number;
  icon: LucideIcon;
  onClick?: () => void;
  badge?: { text: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' };
  sparklineData?: number[];
}

export function KpiCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
  onClick,
  badge,
  sparklineData,
}: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const hasData = sparklineData && sparklineData.some(v => v > 0);

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {badge && (
                <Badge variant={badge.variant || 'secondary'} className="mt-1 text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>
          </div>
          {delta !== undefined && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isPositive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
            )}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(delta).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Mini Sparkline */}
        {hasData && sparklineData && (
          <div className="mt-4 h-8 flex items-end gap-0.5">
            {sparklineData.slice(-10).map((val, i) => {
              const max = Math.max(...sparklineData);
              const height = max > 0 ? (val / max) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{ height: `${height}%`, minHeight: '2px' }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
