import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoctorContactView } from '../../components/patient/DoctorContactView';
import { useAuth } from '../../context/AuthContext';

export default function DoctorContactScreen() {
    const router = useRouter();
    const { profile } = useAuth();
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <View className="bg-primary-700" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 py-3 relative">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 z-10"
                    >
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
                        <Text className="text-lg font-semibold text-white">Contato Médico</Text>
                    </View>
                </View>
            </View>

            <DoctorContactView patientId={profile?.id} />
        </View>
    );
}
