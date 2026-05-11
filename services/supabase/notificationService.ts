import { supabase } from '../../lib/supabase';
import { AppNotification, INotificationService } from '../types';

export class SupabaseNotificationService implements INotificationService {
  async getUnreadNotifications(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, data, is_read, created_at')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }

    return data || [];
  }

  async getNotifications(userId: string, limit: number = 50): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, data, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }

    return count || 0;
  }

  async getUnreadCountByType(userId: string, type: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count by type:', error);
      throw error;
    }

    return count || 0;
  }

  async markAsReadByType(userId: string, type: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking notifications as read by type:', error);
      throw error;
    }
  }
}

export const notificationService = new SupabaseNotificationService();
