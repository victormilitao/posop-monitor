import { supabase } from '../../lib/supabase';
import { IDoctorService } from '../types';

export class SupabaseDoctorService implements IDoctorService {
    async registerDoctor(data: {
        name: string;
        cpf: string;
        crm: string;
        phone_business: string;
        phone_personal?: string;
        email: string;
        password: string;
    }): Promise<{ doctorId: string }> {
        // 1. Sign up the user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (authError) {
            if (authError.message?.toLowerCase().includes('already registered')) {
                throw new Error('Já existe um cadastro com este e-mail.');
            }
            throw authError;
        }

        if (!authData.user) {
            throw new Error('Não foi possível criar o usuário.');
        }

        // 2. Sign in to get an active session (needed for RLS)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (signInError) {
            console.error('Auto sign-in error:', signInError.message);
            throw new Error('Conta criada, mas não foi possível completar o cadastro. Tente fazer login manualmente.');
        }

        // 3. Update profile with doctor data (session is active, RLS allows it)
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: data.name,
                cpf: data.cpf,
                crm: data.crm,
                phone: data.phone_business,
                phone_personal: data.phone_personal || null,
                role: 'doctor',
            })
            .eq('id', authData.user.id);

        if (profileError) {
            console.error('Profile update error:', JSON.stringify(profileError));
            await supabase.auth.signOut();
            if (profileError.code === '23505') {
                throw new Error('Já existe um médico cadastrado com este CRM ou CPF.');
            }
            throw new Error(profileError.message || 'Erro ao salvar dados do perfil.');
        }

        // 4. Sign out so user goes back to login screen
        await supabase.auth.signOut();

        return { doctorId: authData.user.id };
    }
}

// Singleton instance
export const doctorService = new SupabaseDoctorService();
