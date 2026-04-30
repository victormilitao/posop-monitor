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
    status: 'active' | 'completed' | 'cancelled' | 'pending_return';
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
    hospital?: string;
}

export interface DoctorContactInfo {
    name: string;
    crm: string;
    email: string;
    phone: string;
    phonePersonal: string | null;
}

export interface IPatientService {
    getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]>;
    getPatientById(patientId: string): Promise<PatientWithProfile | null>;
    getPatientDashboardData(patientId: string): Promise<PatientDashboardData | null>;
    getDoctorByPatientId(patientId: string): Promise<DoctorContactInfo | null>;
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
        hospital?: string;
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
        hospital?: string;
    }): Promise<Surgery>;
    finalizeSurgeriesPastRecovery(doctorId: string): Promise<number>;
    dismissPendingReturn(surgeryId: string): Promise<void>;
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
    ): Promise<'critical' | 'warning' | 'stable'>;
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

export interface SurgeryTypeSign {
    id: string;
    surgery_type_id: string;
    category: 'alert' | 'attention' | 'normal';
    description: string;
    display_order: number;
}

export interface SurgeryTypePhaseGuideline {
    id: string;
    surgery_type_id: string;
    phase_start_day: number;
    phase_end_day: number | null;
    phase_title: string;
    phase_subtitle: string | null;
    items: string[];
    highlight_text: string | null;
    display_order: number;
}

export interface IGuidanceService {
    getSignsBySurgeryTypeId(surgeryTypeId: string): Promise<SurgeryTypeSign[]>;
    getPhaseGuidelinesBySurgeryTypeId(surgeryTypeId: string): Promise<SurgeryTypePhaseGuideline[]>;
}

export interface PatientPhoto {
    id: string;
    patient_id: string;
    surgery_id: string;
    photo_date: string;
    storage_path: string;
    created_at: string;
    signedUrl?: string;
}

export interface IPhotoService {
    getPhotosBySurgeryId(surgeryId: string): Promise<PatientPhoto[]>;
    uploadPhoto(
        patientId: string,
        surgeryId: string,
        imageUri: string,
        photoDate?: string
    ): Promise<PatientPhoto>;
    replacePhoto(
        photoId: string,
        patientId: string,
        oldStoragePath: string,
        imageUri: string
    ): Promise<PatientPhoto>;
    deletePhoto(photoId: string, storagePath: string): Promise<void>;
    getPhotosCountByDate(patientId: string, date: string): Promise<number>;
}

