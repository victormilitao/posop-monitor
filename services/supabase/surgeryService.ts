import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { ISurgeryService, PaginatedResult, SurgeryWithDetails } from '../types';

type Surgery = Database['public']['Tables']['surgeries']['Row'];

export class SupabaseSurgeryService implements ISurgeryService {
  async getCompletedSurgeriesByDoctorId(
    doctorId: string,
    options?: { page?: number; pageSize?: number; searchName?: string }
  ): Promise<PaginatedResult<SurgeryWithDetails>> {
    const page = options?.page ?? 0;
    const pageSize = options?.pageSize ?? 20;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('surgeries')
      .select(`
        *,
        patient:profiles!surgeries_patient_id_fkey(full_name, email, phone, sex),
        doctor:profiles!surgeries_doctor_id_fkey(full_name),
        surgery_type:surgery_types(name, description, expected_recovery_days),
        daily_reports(date)
      `, { count: 'exact' })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false });

    if (options?.searchName?.trim()) {
      query = query.ilike(
        'patient.full_name',
        `%${options.searchName.trim()}%`
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching completed surgeries:', error);
      throw error;
    }

    const totalCount = count ?? 0;
    const mappedData = (data || []).map(s => {
      const reports = (s as any).daily_reports as { date: string }[] | undefined;
      let lastResponseDate: string | null = null;
      if (reports && reports.length > 0) {
        const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));
        lastResponseDate = sorted[0].date;
      }
      return { ...s, patient: s.patient as any, doctor: s.doctor as any, lastResponseDate };
    });

    return {
      data: mappedData,
      totalCount,
      hasMore: from + mappedData.length < totalCount,
    };
  }

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
    followUpDays?: number;
    hospital?: string;
    contactPhone?: string;
    contactPhoneBusiness?: string;
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
        medical_status: 'stable' as const,
        follow_up_days: data.followUpDays ?? null,
        hospital: data.hospital ?? null,
        contact_phone: data.contactPhone ?? null,
        contact_phone_business: data.contactPhoneBusiness ?? null
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
    // Fetch active surgeries with their follow_up_days and surgery type's expected_recovery_days
    const { data: activeSurgeries, error: fetchError } = await supabase
      .from('surgeries')
      .select(`
        id,
        surgery_date,
        follow_up_days,
        surgery_type:surgery_types(expected_recovery_days)
      `)
      .eq('doctor_id', doctorId)
      .eq('status', 'active');

    if (fetchError) {
      console.error('Error fetching active surgeries:', fetchError);
      throw fetchError;
    }

    if (!activeSurgeries || activeSurgeries.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter surgeries that have passed their follow-up period
    const surgeriesToFinalize = activeSurgeries.filter(s => {
      const recoveryDays = s.follow_up_days ?? (s.surgery_type as any)?.expected_recovery_days ?? 14;
      const dateParts = s.surgery_date.split('T')[0].split('-');
      const surgeryDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      surgeryDate.setDate(surgeryDate.getDate() + recoveryDays + 1); // +1 because day after last recovery day
      return surgeryDate.getTime() <= today.getTime();
    });

    if (surgeriesToFinalize.length === 0) return 0;

    const idsToFinalize = surgeriesToFinalize.map(s => s.id);

    const { data, error } = await supabase
      .from('surgeries')
      .update({ status: 'pending_return' })
      .in('id', idsToFinalize)
      .select('id');

    if (error) {
      console.error('Error finalizing surgeries:', error);
      throw error;
    }

    return data?.length || 0;
  }

  async dismissPendingReturn(surgeryId: string): Promise<void> {
    const { error } = await supabase
      .from('surgeries')
      .update({ status: 'completed' })
      .eq('id', surgeryId)
      .eq('status', 'pending_return');

    if (error) {
      console.error('Error dismissing pending return:', error);
      throw error;
    }
  }

  async getDistinctHospitals(doctorId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('surgeries')
      .select('hospital')
      .eq('doctor_id', doctorId)
      .not('hospital', 'is', null)
      .neq('hospital', '');

    if (error) {
      console.error('Error fetching distinct hospitals:', error);
      throw error;
    }

    // Extract unique hospital names
    const uniqueHospitals = [
      ...new Set(
        (data || [])
          .map((s) => s.hospital)
          .filter((h): h is string => !!h && h.trim().length > 0)
          .map((h) => h.trim())
      ),
    ];

    return uniqueHospitals.sort((a, b) => a.localeCompare(b));
  }
}

export const surgeryService = new SupabaseSurgeryService();
