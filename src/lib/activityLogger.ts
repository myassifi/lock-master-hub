import { supabase } from '@/integrations/supabase/client';

export interface ActivityData {
  actionType: 'create' | 'update' | 'delete' | 'view';
  entityType: 'customer' | 'job' | 'inventory';
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export async function logActivity(activityData: ActivityData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.rpc('log_activity', {
      p_user_id: user?.id || null,
      p_action_type: activityData.actionType,
      p_entity_type: activityData.entityType,
      p_entity_id: activityData.entityId || null,
      p_entity_name: activityData.entityName || null,
      p_description: activityData.description,
      p_metadata: activityData.metadata || null
    });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Helper functions for common activities
export const ActivityLogger = {
  customerCreated: (customerName: string, customerId: string) =>
    logActivity({
      actionType: 'create',
      entityType: 'customer',
      entityId: customerId,
      entityName: customerName,
      description: `New customer "${customerName}" was added to the system`,
      metadata: { source: 'manual_entry' }
    }),

  customerUpdated: (customerName: string, customerId: string) =>
    logActivity({
      actionType: 'update',
      entityType: 'customer',
      entityId: customerId,
      entityName: customerName,
      description: `Customer "${customerName}" information was updated`,
      metadata: { source: 'manual_edit' }
    }),

  customerDeleted: (customerName: string) =>
    logActivity({
      actionType: 'delete',
      entityType: 'customer',
      entityName: customerName,
      description: `Customer "${customerName}" was removed from the system`,
      metadata: { source: 'manual_delete' }
    }),

  jobCreated: (jobType: string, customerName: string, jobId: string, price?: number) =>
    logActivity({
      actionType: 'create',
      entityType: 'job',
      entityId: jobId,
      entityName: `${jobType} for ${customerName}`,
      description: `New ${jobType.replace(/_/g, ' ')} job created for ${customerName}${price ? ` ($${price})` : ''}`,
      metadata: { job_type: jobType, customer: customerName, price }
    }),

  jobUpdated: (jobType: string, customerName: string, jobId: string) =>
    logActivity({
      actionType: 'update',
      entityType: 'job',
      entityId: jobId,
      entityName: `${jobType} for ${customerName}`,
      description: `Job "${jobType.replace(/_/g, ' ')}" for ${customerName} was updated`,
      metadata: { job_type: jobType, customer: customerName }
    }),

  jobDeleted: (jobType: string, customerName: string) =>
    logActivity({
      actionType: 'delete',
      entityType: 'job',
      entityName: `${jobType} for ${customerName}`,
      description: `Job "${jobType.replace(/_/g, ' ')}" for ${customerName} was deleted`,
      metadata: { job_type: jobType, customer: customerName }
    }),

  inventoryAdded: (itemName: string, quantity: number, itemId: string) =>
    logActivity({
      actionType: 'create',
      entityType: 'inventory',
      entityId: itemId,
      entityName: itemName,
      description: `New inventory item "${itemName}" added with ${quantity} units`,
      metadata: { quantity, action: 'initial_stock' }
    }),

  inventoryUpdated: (itemName: string, newQuantity: number, itemId: string, previousQuantity?: number) =>
    logActivity({
      actionType: 'update',
      entityType: 'inventory',
      entityId: itemId,
      entityName: itemName,
      description: `Inventory "${itemName}" updated to ${newQuantity} units${previousQuantity !== undefined ? ` (was ${previousQuantity})` : ''}`,
      metadata: { new_quantity: newQuantity, previous_quantity: previousQuantity }
    }),

  inventoryDeleted: (itemName: string) =>
    logActivity({
      actionType: 'delete',
      entityType: 'inventory',
      entityName: itemName,
      description: `Inventory item "${itemName}" was removed from stock`,
      metadata: { action: 'item_removal' }
    }),

  inventoryAdjusted: (itemName: string, change: number, newQuantity: number, itemId: string) =>
    logActivity({
      actionType: 'update',
      entityType: 'inventory',
      entityId: itemId,
      entityName: itemName,
      description: `Inventory "${itemName}" ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)} (now ${newQuantity} units)`,
      metadata: { quantity_change: change, new_quantity: newQuantity, action: 'quantity_adjustment' }
    })
};