import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ISurgeryService, SurgeryWithDetails } from '../types';

type Surgery = Database['public']['Tables']['surgeries']['Row'];

export class SupabaseSurgeryService implements ISurgeryService {
  async getSurgeriesByDoctorId(doctorId: string): Promise<SurgeryWithDetails[]> {
    const { data, error } = await supabase
      .from('surgeries')
      .select(`
                *,
                patient:profiles!surgeries_patient_id_fkey(full_name, email, phone, sex),
                doctor:profiles!surgeries_doctor_id_fkey(full_name),
                surgery_type:surgery_types(name, description, expected_recovery_days),
                daily_reports(date)
            `)
      .eq('doctor_id', doctorId)
      .order('surgery_date', { ascending: false });

    if (error) {
      console.error('Error fetching surgeries:', error);
      throw error;
    }

    return (data || []).map(s => {
      // Find the latest report date from the daily_reports join
      const reports = (s as any).daily_reports as { date: string }[] | undefined;
      let lastResponseDate: string | null = null;
      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));
        lastResponseDate = sorted[0].date;
      }

      return {
        ...s,
        patient: s.patient as any,
        doctor: s.doctor as any,
        lastResponseDate,
      };
    });
  }

  async getSurgeryById(surgeryId: string): Promise<SurgeryWithDetails | null> {
    const { data, error } = await supabase
      .from('surgeries')
      .select(`
                *,
                patient:profiles!surgeries_patient_id_fkey(full_name, email, phone, sex),
                doctor:profiles!surgeries_doctor_id_fkey(full_name),
                surgery_type:surgery_types(name, description, expected_recovery_days)
            `)
      .eq('id', surgeryId)
      .single();

    if (error) {
      console.error('Error fetching surgery:', error);
      return null;
    }

    return data ? {
      ...data,
      patient: data.patient as any,
      doctor: data.doctor as any
    } : null;
  }

  async createSurgery(data: {
    doctorId: string;
    patientId: string;
    surgeryTypeId: string;
    surgeryDate: string;
    notes?: string;
  }): Promise<Surgery> {
    const { data: surgery, error } = await supabase
      .from('surgeries')
      .insert({
        doctor_id: data.doctorId,
        patient_id: data.patientId,
        surgery_type_id: data.surgeryTypeId,
        surgery_date: data.surgeryDate,
        notes: data.notes,
        status: 'active',
        medical_status: 'stable' as const
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating surgery:', error);
      throw error;
    }

    // Link patient to this surgery
    await supabase
      .from('patients')
      .update({ surgery_id: surgery.id })
      .eq('id', data.patientId);

    return surgery;
  }

  async finalizeSurgeriesPastRecovery(doctorId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 15);
    // Use local date to avoid UTC shift (toISOString would shift +1 day at night in UTC-3)
    const year = cutoffDate.getFullYear();
    const month = String(cutoffDate.getMonth() + 1).padStart(2, '0');
    const day = String(cutoffDate.getDate()).padStart(2, '0');
    const cutoffISO = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('surgeries')
      .update({ status: 'completed' })
      .eq('doctor_id', doctorId)
      .eq('status', 'active')
      .lte('surgery_date', cutoffISO)
      .select('id');

    if (error) {
      console.error('Error finalizing surgeries:', error);
      throw error;
    }

    return data?.length || 0;
  }
}

export const surgeryService = new SupabaseSurgeryService();
