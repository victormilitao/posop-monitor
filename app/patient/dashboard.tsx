import { Redirect, Stack, useRouter } from 'expo-router';
import { Calendar, FileText, Image, Info, LogOut, Stethoscope } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMenuItem } from '../../components/patient/ActionMenuItem';

import { PhaseGuidelinesSheet } from '../../components/patient/PhaseGuidelinesSheet';
import { ProgressBar } from '../../components/patient/ProgressBar';
import { WelcomeHeader } from '../../components/patient/WelcomeHeader';
import { Button } from '../../components/ui/Button';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePatientDashboard } from '../../hooks/usePatientDashboard';
import { reportService } from '../../services';

export default function PatientDashboard() {
    const router = useRouter();
    const { session, isLoading: isAuthLoading, isPatient, signOut, profile } = useAuth();
    const [isGuidelinesVisible, setIsGuidelinesVisible] = useState(false);

    const { showToast } = useToast();
    const insets = useSafeAreaInsets();

    // Fetch patient dashboard data
    const { data: dashboardData, isLoading: isDashboardLoading } = usePatientDashboard(profile?.id);

    if (isAuthLoading || isDashboardLoading) {
        return <View className="flex-1 justify-center items-center"><Text>Carregando...</Text></View>;
    }

    if (!session || !isPatient) return <Redirect href="/" />;

    const handleLogout = async () => {
        await signOut();
    };

    const handleDailyReportPress = async () => {
        if (!session?.user.id) return;

        // Ensure patient waits until the next day
        const currentDayOfSurgery = Math.max(0, dashboardData?.daysSinceSurgery || 0);
        if (currentDayOfSurgery < 1) {
            showToast({ type: 'info', title: 'Aguarde', message: 'O questionário estará disponível a partir do dia seguinte ao cadastro da cirurgia.' });
            return;
        }

        try {
            // Check if report for today already exists
            const reports = await reportService.getPatientReports(session.user.id);
            const today = new Date();
            const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
                .toISOString()
                .split('T')[0];

            const hasReportToday = reports.some(r => {
                if (!r.date) return false;
                return String(r.date).split('T')[0] === localDate;
            });

            if (hasReportToday) {
                showToast({ type: 'info', title: 'Aviso', message: 'Você já respondeu o questionário de hoje.' });
                return;
            }

            router.push('/patient/daily-report');
        } catch (error) {
            console.error('Error checking reports:', error);
            // Allow navigation on error to avoid blocking user
            router.push('/patient/daily-report');
        }
    };

    // Use real data or defaults
    const patientName = dashboardData?.profile.full_name || 'Paciente';
    const surgeryType = (dashboardData?.currentSurgery as any)?.surgery_type?.name || 'Nenhuma cirurgia registrada';
    const surgeryDate = dashboardData?.currentSurgery?.surgery_date
        ? (() => {
            const dateParts = dashboardData.currentSurgery.surgery_date.split('T')[0].split('-');
            const d = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
            return d.toLocaleDateString('pt-BR');
        })()
        : 'N/A';
    const currentDay = Math.max(0, dashboardData?.daysSinceSurgery || 0);
    const totalDays = (dashboardData?.currentSurgery as any)?.follow_up_days ?? (dashboardData?.currentSurgery as any)?.surgery_type?.expected_recovery_days ?? dashboardData?.totalRecoveryDays ?? 14;

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Section */}
                <View
                    className="bg-primary-700 px-6 pb-4 rounded-b-3xl mb-4"
                    style={{ paddingTop: insets.top + 12 }}
                >
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-2xl font-bold text-white">{patientName}</Text>
                        <Button
                            title="Sair"
                            variant="ghost"
                            onPress={handleLogout}
                            icon={<LogOut size={16} color="#fff" />}
                            className="h-8 px-2 rounded-xl"
                            textClassName="text-white"
                        />
                    </View>
                    <WelcomeHeader
                        surgeryType={surgeryType}
                        surgeryDate={surgeryDate}
                    />
                </View>

                {/* Progress Section */}
                {dashboardData?.currentSurgery && (
                    <View className="px-6 mb-8">
                        <View className="bg-white p-4 rounded-xl border border-gray-100">
                            <ProgressBar currentDay={currentDay} totalDays={totalDays} />
                        </View>
                    </View>
                )}

                {/* No Surgery Message */}
                {!dashboardData?.currentSurgery && (
                    <View className="px-6 mb-8">
                        <View className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                            <Text className="text-yellow-800 text-center">
                                Você ainda não tem uma cirurgia registrada. Entre em contato com seu médico.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Menu Section */}
                <View className="px-6">
                    <ActionMenuItem
                        title="Consulta do Dia"
                        subtitle="Responda suas perguntas diárias"
                        // @ts-ignore
                        icon={FileText}
                        iconColor="#166534"
                        iconBgColor="bg-green-100"
                        actionLabel="Responder"
                        onPress={handleDailyReportPress}
                    />
                    <ActionMenuItem
                        title="Galeria de Fotos"
                        subtitle="Veja suas fotos de acompanhamento"
                        // @ts-ignore
                        icon={Image}
                        iconColor="#b45309"
                        iconBgColor="bg-amber-100"
                        onPress={() => router.push('/patient/photo-gallery')}
                    />
                    <ActionMenuItem
                        title="Linha do Tempo"
                        subtitle="Veja sua evolução diária"
                        // @ts-ignore
                        icon={Calendar}
                        onPress={() => router.push('/patient/timeline')}
                    />
                    <ActionMenuItem
                        title="Orientações por Fase"
                        subtitle="O que esperar em cada período"
                        // @ts-ignore
                        icon={Info}
                        iconColor="#9333ea"
                        iconBgColor="bg-purple-100"
                        onPress={() => setIsGuidelinesVisible(true)}
                    />
                    <ActionMenuItem
                        title="Contato Médico"
                        subtitle="Dados do seu médico responsável"
                        // @ts-ignore
                        icon={Stethoscope}
                        iconColor={AppColors.primary[700]}
                        iconBgColor="bg-primary-100"
                        onPress={() => router.push('/patient/doctor-contact')}
                    />
                </View>
            </ScrollView>

            <PhaseGuidelinesSheet
                visible={isGuidelinesVisible}
                onClose={() => setIsGuidelinesVisible(false)}
                currentDay={currentDay}
                surgeryTypeId={dashboardData?.currentSurgery?.surgery_type_id}
            />


        </View>
    );
}
