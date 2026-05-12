import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

type SurgeryType = Database['public']['Tables']['surgery_types']['Row'];

export interface ISurgeryTypeService {
  getActiveSurgeryTypes(patientSex?: string): Promise<SurgeryType[]>;
  getSurgeryTypeById(id: string): Promise<SurgeryType | null>;
}

export class SupabaseSurgeryTypeService implements ISurgeryTypeService {
  async getActiveSurgeryTypes(patientSex?: string): Promise<SurgeryType[]> {
    let query = supabase
      .from('surgery_types')
      .select('*')
      .eq('is_active', true);

    if (patientSex) {
      query = query.or(`applicable_sex.eq.both,applicable_sex.eq.${patientSex}`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching surgery types:', error);
      throw error;
    }

    return data || [];
  }

  async getSurgeryTypeById(id: string): Promise<SurgeryType | null> {
    const { data, error } = await supabase
      .from('surgery_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching surgery type:', error);
      return null;
    }

    return data;
  }
}

export const surgeryTypeService = new SupabaseSurgeryTypeService();
