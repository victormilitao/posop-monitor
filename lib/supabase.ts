import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { Database } from '../types/supabase';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve(null);
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        SecureStore.deleteItemAsync(key);
    },
};

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
// Android's emulator reaches the host computer through 10.0.2.2.
const supabaseUrl = process.env.EXPO_PUBLIC_BACKEND_TARGET === 'local' && Platform.OS === 'android'
    ? configuredUrl.replace('://127.0.0.1:', '://10.0.2.2:').replace('://localhost:', '://10.0.2.2:')
    : configuredUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
