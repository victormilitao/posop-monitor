import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../lib/supabase';
import { ITermsService } from '../types';

export class SupabaseTermsService implements ITermsService {
    async hasAcceptedTerms(userId: string): Promise<boolean> {
        try {
            // Check SecureStore first (faster, local)
            const storedValue = await SecureStore.getItemAsync(`terms_accepted_${userId}`);
            if (storedValue === 'true') {
                return true;
            }

            // Fallback: check Supabase user metadata
            const { data: { session } } = await supabase.auth.getSession();
            const hasAcceptedMeta = session?.user?.user_metadata?.terms_accepted === true;

            // If found in metadata but not in SecureStore, sync locally
            if (hasAcceptedMeta) {
                await SecureStore.setItemAsync(`terms_accepted_${userId}`, 'true');
            }

            return hasAcceptedMeta;
        } catch (error) {
            console.error('Error checking terms acceptance:', error);
            return false;
        }
    }

    async acceptTerms(userId: string): Promise<void> {
        // Save to SecureStore (local persistence)
        await SecureStore.setItemAsync(`terms_accepted_${userId}`, 'true');

        // Save to Supabase user metadata (cloud persistence)
        const { error } = await supabase.auth.updateUser({
            data: { terms_accepted: true },
        });

        if (error) {
            console.error('Error saving terms acceptance to metadata:', error);
            // Don't throw — local persistence is enough for UX
        }
    }
}

// Singleton instance
export const termsService = new SupabaseTermsService();
