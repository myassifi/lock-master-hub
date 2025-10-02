import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Package, Users, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  type: 'low-stock' | 'job' | 'customer';
  title: string;
  subtitle?: string;
  timestamp?: string;
  qty?: number;
  threshold?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ActivityPanelProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

export function ActivityPanel({ alerts, onViewAll }: ActivityPanelProps) {
  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'job':
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'customer':
        return <Users className="h-4 w-4 text-emerald-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Activity & Alerts</CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No alerts at this time</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      {alert.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.subtitle}
                        </p>
                      )}
                      {alert.type === 'low-stock' && alert.qty !== undefined && alert.threshold !== undefined && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive" className="text-xs">
                            {alert.qty} remaining
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Threshold: {alert.threshold}
                          </span>
                        </div>
                      )}
                      {alert.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    {alert.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={alert.action.onClick}
                        className="shrink-0"
                      >
                        {alert.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
