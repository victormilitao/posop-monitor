import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientPhotoGalleryView } from '../../components/patient/PatientPhotoGalleryView';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { usePatientDashboard } from '../../hooks/usePatientDashboard';

export default function PhotoGalleryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const { data: dashboardData } = usePatientDashboard(profile?.id);

    const patientId = profile?.id;
    const surgeryId = dashboardData?.currentSurgery?.id;

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />

            <View style={{ backgroundColor: AppColors.primary[700], paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 py-3 relative">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 z-10"
                    >
                        <ArrowLeft size={24} color={AppColors.white} />
                    </TouchableOpacity>
                    <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
                        <Text className="text-lg font-semibold" style={{ color: AppColors.white }}>
                            Galeria de Fotos
                        </Text>
                    </View>
                </View>
            </View>

            <PatientPhotoGalleryView
                patientId={patientId}
                surgeryId={surgeryId}
            />
        </View>
    );
}
