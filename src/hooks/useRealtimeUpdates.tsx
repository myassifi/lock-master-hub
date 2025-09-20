import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeUpdatesProps {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  showNotifications?: boolean;
}

export function useRealtimeUpdates({
  table,
  onInsert,
  onUpdate,
  onDelete,
  showNotifications = false
}: UseRealtimeUpdatesProps) {
  const { toast } = useToast();

  const handleChange = useCallback((eventType: string, payload: any) => {
    switch (eventType) {
      case 'INSERT':
        onInsert?.(payload);
        if (showNotifications) {
          toast({
            title: "New Record",
            description: `A new ${table.slice(0, -1)} was added`,
            duration: 3000,
          });
        }
        break;
      case 'UPDATE':
        onUpdate?.(payload);
        if (showNotifications) {
          toast({
            title: "Updated",
            description: `A ${table.slice(0, -1)} was updated`,
            duration: 3000,
          });
        }
        break;
      case 'DELETE':
        onDelete?.(payload);
        if (showNotifications) {
          toast({
            title: "Deleted",
            description: `A ${table.slice(0, -1)} was deleted`,
            duration: 3000,
          });
        }
        break;
    }
  }, [table, onInsert, onUpdate, onDelete, showNotifications, toast]);

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          handleChange(payload.eventType, payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, handleChange]);
}