import { Database } from '../types/supabase';

type Patient = Database['public']['Tables']['patients']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Surgery = Database['public']['Tables']['surgeries']['Row'];
type SurgeryType = Database['public']['Tables']['surgery_types']['Row'];

export interface PatientWithProfile extends Patient {
    profile: Pick<Profile, 'full_name' | 'email'>;
}

export interface SurgeryWithDetails extends Surgery {
    patient: Pick<Profile, 'full_name' | 'email' | 'phone' | 'sex'>;
    doctor: Pick<Profile, 'full_name'>;
    surgery_type: Pick<SurgeryType, 'name' | 'description' | 'expected_recovery_days'>;
    lastResponseDate?: string | null;
}

export interface PatientDashboardData {
    profile: Profile;
    currentSurgery: (Surgery & { surgery_type: Pick<SurgeryType, 'id' | 'name' | 'description' | 'expected_recovery_days'> }) | null;
    daysSinceSurgery: number;
    totalRecoveryDays: number;
}

export interface PatientListItem {
    id: string;
    name: string;
    surgeryDate: string;
    surgeryType: string;
    day: number;
    status: 'active' | 'completed' | 'cancelled';
    lastResponseDate: string | null;
    alerts?: string[];
}

export interface UpdatePatientData {
    patientId: string;
    surgeryId: string;
    name?: string;
    cpf?: string;
    phone?: string;
    sex?: string;
    surgeryDate?: string;
    followUpDays?: number;
    surgeryTypeId?: string;
}

export interface IPatientService {
    getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]>;
    getPatientById(patientId: string): Promise<PatientWithProfile | null>;
    getPatientDashboardData(patientId: string): Promise<PatientDashboardData | null>;
    createPatient(data: {
        name: string;
        cpf: string;
        sex: string;
        age: string;
        phone: string;
        surgeryTypeId: string;
        surgeryDate: string;
        doctorId: string;
        followUpDays?: number;
    }): Promise<{ patientId: string; surgeryId: string }>;
    updatePatient(data: UpdatePatientData): Promise<void>;
}

export interface ISurgeryService {
    getSurgeriesByDoctorId(doctorId: string): Promise<SurgeryWithDetails[]>;
    getSurgeryById(surgeryId: string): Promise<SurgeryWithDetails | null>;
    createSurgery(data: {
        doctorId: string;
        patientId: string;
        surgeryTypeId: string;
        surgeryDate: string;
        notes?: string;
        followUpDays?: number;
    }): Promise<Surgery>;
    finalizeSurgeriesPastRecovery(doctorId: string): Promise<number>;
}

export type Question = Database['public']['Tables']['questions']['Row'];
export type QuestionOption = Database['public']['Tables']['question_options']['Row'];

export interface QuestionWithDetails extends Question {
    options: QuestionOption[];
    display_order: number;
}

export interface IQuestionService {
    getQuestionsBySurgeryTypeId(surgeryTypeId: string): Promise<QuestionWithDetails[]>;
}

export interface IReportService {
    submitDailyReport(
        patientId: string,
        surgeryId: string,
        answers: Record<string, any>,
        questions: QuestionWithDetails[]
    ): Promise<void>;
    getPatientReports(patientId: string): Promise<DailyReport[]>;
    getReportsBySurgeryId(surgeryId: string): Promise<DailyReport[]>;
    getReportById(reportId: string): Promise<DailyReport | null>;
}

export interface DailyReport {
    id: string;
    date: string;
    pain_level: number;
    symptoms: string[] | null;
    answers: Record<string, any>;
    surgery_id?: string;
    created_at: string;
    alerts?: { severity: 'critical' | 'warning', message: string }[];
}

export interface IDoctorService {
    registerDoctor(data: {
        name: string;
        cpf: string;
        crm: string;
        phone_business: string;
        phone_personal?: string;
        email: string;
        password: string;
    }): Promise<{ doctorId: string }>;
}
