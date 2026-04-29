import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { DoctorContactInfo, IPatientService, PatientDashboardData, PatientWithProfile, UpdatePatientData } from '../types';

type Surgery = Database['public']['Tables']['surgeries']['Row'];
type SurgeryType = Database['public']['Tables']['surgery_types']['Row'];

export class SupabasePatientService implements IPatientService {
    async getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]> {
        const { data, error } = await supabase
            .from('patients')
            .select(`
                *,
                profile:profiles!patients_id_fkey(full_name, email)
            `)
            .eq('doctor_id', doctorId);

        if (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }

        return (data || []).map(p => ({
            ...p,
            profile: p.profile as any
        }));
    }

    async getPatientById(patientId: string): Promise<PatientWithProfile | null> {
        const { data, error } = await supabase
            .from('patients')
            .select(`
                *,
                profile:profiles!patients_id_fkey(full_name, email)
            `)
            .eq('id', patientId)
            .single();

        if (error) {
            console.error('Error fetching patient:', error);
            return null;
        }

        return data ? {
            ...data,
            profile: data.profile as any
        } : null;
    }

    async getPatientDashboardData(patientId: string): Promise<PatientDashboardData | null> {
        // Get patient profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', patientId)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching profile:', profileError);
            return null;
        }

        // Get patient's current surgery
        const { data: patient } = await supabase
            .from('patients')
            .select('surgery_id')
            .eq('id', patientId)
            .single();

        let currentSurgery: (Surgery & { surgery_type: Pick<SurgeryType, 'id' | 'name' | 'description' | 'expected_recovery_days'> }) | null = null;
        let daysSinceSurgery = 0;
        let totalRecoveryDays = 14;

        if (patient?.surgery_id) {
            const { data: surgery } = await supabase
                .from('surgeries')
                .select(`
                    *,
                    surgery_type:surgery_types(id, name, description, expected_recovery_days)
                `)
                .eq('id', patient.surgery_id)
                .single();

            if (surgery) {
                currentSurgery = surgery as any;
                totalRecoveryDays = (surgery as any).follow_up_days ?? surgery.surgery_type.expected_recovery_days ?? 14;
                // Create local date from YYYY-MM-DD to avoid UTC shift
                const dateParts = surgery.surgery_date.split('T')[0].split('-');
                const surgeryDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));

                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to midnight for accurate diff
                daysSinceSurgery = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }

        return {
            profile,
            currentSurgery,
            daysSinceSurgery,
            totalRecoveryDays
        };
    }

    async getDoctorByPatientId(patientId: string): Promise<DoctorContactInfo | null> {
        // Get surgery_id from the patients table
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('surgery_id')
            .eq('id', patientId)
            .single();

        if (patientError || !patient?.surgery_id) {
            console.error('Error fetching patient surgery_id:', patientError);
            return null;
        }

        // Get doctor_id from the surgeries table
        const { data: surgery, error: surgeryError } = await supabase
            .from('surgeries')
            .select('doctor_id')
            .eq('id', patient.surgery_id)
            .single();

        if (surgeryError || !surgery?.doctor_id) {
            console.error('Error fetching surgery doctor_id:', surgeryError);
            return null;
        }

        // Get doctor profile
        const { data: doctor, error: doctorError } = await supabase
            .from('profiles')
            .select('full_name, crm, email, phone, phone_personal')
            .eq('id', surgery.doctor_id)
            .single();

        if (doctorError || !doctor) {
            console.error('Error fetching doctor profile:', doctorError);
            return null;
        }

        return {
            name: doctor.full_name || '',
            crm: doctor.crm || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            phonePersonal: doctor.phone_personal || null,
        };
    }

    async createPatient(data: {
        name: string;
        cpf: string;
        sex: string;
        age: string;
        phone: string;
        surgeryTypeId: string;
        surgeryDate: string;
        doctorId: string;
        followUpDays?: number;
    }): Promise<{ patientId: string; surgeryId: string }> {
        // Generate fake email for Supabase Auth (patient logs in via CPF, not email)
        const fakeEmail = `${data.cpf}@paciente.app`;

        // 1. Create the patient using a database RPC to bypass GoTrue's email ratelimit
        // The RPC also sets cpf, sex, and phone on the profile (bypasses RLS via SECURITY DEFINER)
        const { data: newPatientId, error: authError } = await (supabase as any).rpc('create_patient_bypass', {
            patient_email: fakeEmail,
            patient_password: 'Password123!', // Paciente vai usar acesso via OTP depois
            patient_name: data.name,
            patient_cpf: data.cpf,
            patient_sex: data.sex,
            patient_phone: data.phone || null
        });

        if (authError) {
            if (authError.code === '23505' || authError.message?.includes('duplicate key')) {
                if (authError.message?.includes('profiles_phone_unique')) {
                    throw new Error('Já existe um paciente cadastrado com este número de telefone.');
                }
                throw new Error('Já existe um paciente cadastrado com este CPF.');
            }
            throw authError;
        }
        if (!newPatientId) throw new Error('Não foi possível criar o usuário do paciente');

        // 3. Create the surgery
        const { data: surgeryData, error: surgeryError } = await supabase
            .from('surgeries')
            .insert({
                patient_id: newPatientId,
                doctor_id: data.doctorId,
                surgery_type_id: data.surgeryTypeId,
                surgery_date: data.surgeryDate,
                status: 'active',
                medical_status: 'stable',
                follow_up_days: data.followUpDays ?? null
            })
            .select()
            .single();

        if (surgeryError || !surgeryData) throw surgeryError || new Error('Cirurgia n\u00e3o criada');

        // 4. Create the patient-doctor link
        const { error: patientLinkError } = await supabase
            .from('patients')
            .insert({
                id: newPatientId,
                surgery_id: surgeryData.id
            });

        if (patientLinkError) throw patientLinkError;

        return { patientId: newPatientId, surgeryId: surgeryData.id };
    }

    async updatePatient(data: UpdatePatientData): Promise<void> {
        // Update profile fields via RPC (SECURITY DEFINER bypasses RLS)
        const hasProfileUpdates = data.name !== undefined || data.cpf !== undefined ||
            data.phone !== undefined || data.sex !== undefined;

        if (hasProfileUpdates) {
            const { error: profileError } = await (supabase as any).rpc('update_patient_profile', {
                p_patient_id: data.patientId,
                p_full_name: data.name ?? null,
                p_cpf: data.cpf ?? null,
                p_phone: data.phone || null,
                p_sex: data.sex ?? null,
            });

            if (profileError) {
                if (profileError.code === '23505' && profileError.message?.includes('profiles_phone_unique')) {
                    throw new Error('Já existe um paciente cadastrado com este número de telefone.');
                }
                throw profileError;
            }
        }

        // Update surgery fields (surgery_date, follow_up_days, surgery_type_id)
        const surgeryUpdates: Record<string, string | number | null> = {};
        if (data.surgeryDate !== undefined) surgeryUpdates.surgery_date = data.surgeryDate;
        if (data.followUpDays !== undefined) surgeryUpdates.follow_up_days = data.followUpDays;
        if (data.surgeryTypeId !== undefined) surgeryUpdates.surgery_type_id = data.surgeryTypeId;

        if (Object.keys(surgeryUpdates).length > 0) {
            const { error: surgeryError } = await supabase
                .from('surgeries')
                .update(surgeryUpdates)
                .eq('id', data.surgeryId);

            if (surgeryError) throw surgeryError;
        }
    }
}

// Singleton instance
export const patientService = new SupabasePatientService();
