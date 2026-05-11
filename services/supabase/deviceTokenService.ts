import { supabase } from '../../lib/supabase';
import { DeviceToken, IDeviceTokenService } from '../types';

export class SupabaseDeviceTokenService implements IDeviceTokenService {
  async upsertToken(userId: string, pushToken: string, platform: string): Promise<DeviceToken> {
    const { data, error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          push_token: pushToken,
          platform,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,push_token' }
      )
      .select('id, user_id, push_token, platform, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error upserting device token:', error);
      throw error;
    }

    return data;
  }

  async deactivateToken(pushToken: string): Promise<void> {
    const { error } = await supabase
      .from('device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('push_token', pushToken);

    if (error) {
      console.error('Error deactivating device token:', error);
      throw error;
    }
  }

  async getActiveTokensByUserId(userId: string): Promise<DeviceToken[]> {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('id, user_id, push_token, platform, is_active, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching device tokens:', error);
      throw error;
    }

    return data || [];
  }
}

export const deviceTokenService = new SupabaseDeviceTokenService();
