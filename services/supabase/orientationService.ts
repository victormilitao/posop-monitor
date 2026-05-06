import { supabase } from '../../lib/supabase';
import { DoctorOrientation, IOrientationService } from '../types';

export class SupabaseOrientationService implements IOrientationService {
  async getOrientationsBySurgeryId(surgeryId: string): Promise<DoctorOrientation[]> {
    const { data, error } = await supabase
      .from('doctor_orientations')
      .select('id, surgery_id, doctor_id, content, created_at, updated_at')
      .eq('surgery_id', surgeryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doctor orientations:', error);
      throw error;
    }

    return data || [];
  }

  async addOrientation(surgeryId: string, doctorId: string, content: string): Promise<DoctorOrientation> {
    const { data, error } = await supabase
      .from('doctor_orientations')
      .insert({
        surgery_id: surgeryId,
        doctor_id: doctorId,
        content,
      })
      .select('id, surgery_id, doctor_id, content, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error adding doctor orientation:', error);
      throw error;
    }

    return data;
  }

  async updateOrientation(orientationId: string, content: string): Promise<DoctorOrientation> {
    const { data, error } = await supabase
      .from('doctor_orientations')
      .update({ content })
      .eq('id', orientationId)
      .select('id, surgery_id, doctor_id, content, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error updating doctor orientation:', error);
      throw error;
    }

    return data;
  }

  async deleteOrientation(orientationId: string): Promise<void> {
    const { error } = await supabase
      .from('doctor_orientations')
      .delete()
      .eq('id', orientationId);

    if (error) {
      console.error('Error deleting doctor orientation:', error);
      throw error;
    }
  }
}

export const orientationService = new SupabaseOrientationService();
