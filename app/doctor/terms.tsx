import React from 'react';
import { Stack, useRouter, Href } from 'expo-router';
import { TermsScreen } from '../../components/terms/TermsScreen';
import { useAuth } from '../../context/AuthContext';
import { termsService } from '../../services';

export default function DoctorTermsScreen() {
    const router = useRouter();
    const { profile } = useAuth();

    const handleAccept = async () => {
        if (!profile?.id) return;
        await termsService.acceptTerms(profile.id);
        router.replace('/doctor/dashboard' as Href);
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TermsScreen role="doctor" onAccept={handleAccept} />
        </>
    );
}
