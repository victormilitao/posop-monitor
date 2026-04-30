import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, ChevronRight, Clock, Image as ImageIcon, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientDetailHeader } from '../../../components/doctor/PatientDetailHeader';
import { PatientDetailMenuItem } from '../../../components/doctor/PatientDetailMenu';
import { PatientGalleryView } from '../../../components/doctor/PatientGalleryView';
import { PatientProfileView, PatientProfileData } from '../../../components/doctor/PatientProfileView';
import { PendingReturnModal } from '../../../components/doctor/PendingReturnModal';
import { PatientTimelineView, TimelineDay } from '../../../components/doctor/PatientTimelineView';
import { AppColors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useDismissPendingReturn } from '../../../hooks/useSurgeries';
import { patientService, reportService, surgeryService } from '../../../services';
import { SurgeryWithDetails } from '../../../services/types';

type TabType = 'menu' | 'profile' | 'timeline' | 'gallery';

export default function DoctorPatientDetailScreen() {
  const router = useRouter();
  const { surgeryId } = useLocalSearchParams();
  const { session, isDoctor } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [surgery, setSurgery] = useState<SurgeryWithDetails | null>(null);
  const [profileData, setProfileData] = useState<PatientProfileData | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const dismissPendingReturn = useDismissPendingReturn();

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [session?.user.id, surgeryId])
  );

  const loadData = async () => {
    if (!session?.user.id || !isDoctor || !surgeryId) return;

    try {
      setLoading(true);
      const surgeryData = await surgeryService.getSurgeryById(surgeryId as string);

      if (!surgeryData) {
        showToast({ type: 'error', title: 'Erro', message: 'Cirurgia não encontrada.' });
        router.back();
        return;
      }

      setSurgery(surgeryData);

      // Check if surgery is finalized
      const surgeryStatus = (surgeryData as any).status as string;
      setIsFinalized(surgeryStatus !== 'active');

      // Build profile data
      const dateParts = surgeryData.surgery_date.split('T')[0].split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const followUpDays = (surgeryData as any).follow_up_days ?? surgeryData.surgery_type.expected_recovery_days ?? 14;

      // Load CPF
      let cpfValue = '';
      try {
        const dashData = await patientService.getPatientDashboardData(surgeryData.patient_id);
        if (dashData?.profile?.cpf) {
          const digits = (dashData.profile.cpf as string).replace(/\D/g, '');
          if (digits.length === 11) {
            cpfValue = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
          } else {
            cpfValue = dashData.profile.cpf as string;
          }
        }
      } catch {
        // CPF is optional for display
      }

      // Format phone
      let phoneValue = (surgeryData.patient as any)?.phone || '';
      const phoneDigits = phoneValue.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        phoneValue = `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7)}`;
      }

      setProfileData({
        name: surgeryData.patient.full_name || '',
        cpf: cpfValue,
        sex: (surgeryData.patient as any)?.sex || '',
        phone: phoneValue,
        surgeryType: surgeryData.surgery_type.name || '',
        surgeryDate: formattedDate,
        followUpDays: String(followUpDays),
        status: surgeryStatus,
        hospital: (surgeryData as any).hospital || '',
      });

      // Build timeline
      const reports = await reportService.getReportsBySurgeryId(surgeryId as string);

      const [sYear, sMonth, sDay] = surgeryData.surgery_date.split('-').map(Number);
      const sDate = new Date(sYear, sMonth - 1, sDay);

      const recoveryDays = followUpDays;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days: TimelineDay[] = [];

      for (let i = 1; i <= recoveryDays; i++) {
        const currentDayDate = new Date(sDate);
        currentDayDate.setDate(sDate.getDate() + i);

        const reportForDay = reports.find(r => {
          if (!r.date) return false;
          const [rYear, rMonth, rDay] = String(r.date).split('-').map(Number);
          return rDay === currentDayDate.getDate() &&
            (rMonth - 1) === currentDayDate.getMonth() &&
            rYear === currentDayDate.getFullYear();
        });

        let status: TimelineDay['status'] = 'future';

        if (reportForDay) {
          status = 'completed';
        } else {
          const tTime = today.getTime();
          const cTime = currentDayDate.getTime();

          if (cTime < tTime) {
            status = 'missed';
          } else if (cTime === tTime) {
            status = 'pending';
          } else {
            status = 'future';
          }
        }

        let severity: 'critical' | 'warning' | undefined = undefined;
        if (reportForDay?.alerts && reportForDay.alerts.length > 0) {
          if (reportForDay.alerts.some(a => a.severity === 'critical')) severity = 'critical';
          else if (reportForDay.alerts.some(a => a.severity === 'warning')) severity = 'warning';
        }

        days.push({
          day: i,
          date: currentDayDate,
          status,
          reportId: reportForDay?.id,
          alertSeverity: severity
        });
      }
      setTimeline(days);

    } catch (error) {
      console.error('Error loading patient data:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível carregar os dados do paciente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!surgery) return;
    try {
      await dismissPendingReturn.mutateAsync(surgery.id);
      setShowReturnModal(false);
      showToast({ type: 'success', title: 'Sucesso', message: 'Retorno confirmado com sucesso.' });
      loadData();
    } catch {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível confirmar o retorno.' });
    }
  };

  const handleBackPress = () => {
    if (activeTab !== 'menu') {
      setActiveTab('menu');
    } else {
      router.back();
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'profile':
        return 'Perfil do Paciente';
      case 'timeline':
        return 'Linha do Tempo';
      case 'gallery':
        return 'Galeria de Fotos';
      default:
        return surgery?.patient.full_name || 'Detalhes do Paciente';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={AppColors.primary[700]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header */}
      {activeTab === 'menu' ? (
        <PatientDetailHeader
          patientName={surgery?.patient.full_name || ''}
          surgeryType={surgery?.surgery_type.name || ''}
          surgeryDate={profileData?.surgeryDate || ''}
          onBackPress={handleBackPress}
        />
      ) : (
        <View style={{ backgroundColor: AppColors.primary[700], paddingTop: insets.top }}>
          <View className="flex-row items-center px-4 py-3 relative">
            <TouchableOpacity
              testID="back-button"
              onPress={handleBackPress}
              className="p-2 z-10"
            >
              <ArrowLeft size={24} color={AppColors.white} />
            </TouchableOpacity>
            <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
              <Text className="text-lg font-semibold" style={{ color: AppColors.white }}>
                {getHeaderTitle()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {activeTab === 'menu' && (
        <View className="flex-1 px-6 pt-6">
          {/* Pending Return Banner */}
          {(surgery as any)?.status === 'pending_return' && (
            <TouchableOpacity
              testID="pending-return-banner"
              className="flex-row items-center justify-between p-4 rounded-xl border mb-4"
              style={{
                backgroundColor: AppColors.warning.light,
                borderColor: '#fed7aa',
              }}
              onPress={() => setShowReturnModal(true)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <Clock size={20} color={AppColors.warning.DEFAULT} style={{ marginRight: 8 }} />
                <View className="flex-1">
                  <Text className="font-semibold text-base" style={{ color: AppColors.warning.dark }}>
                    Pendente Retorno
                  </Text>
                  <Text className="text-sm" style={{ color: '#ea580c' }}>
                    Toque para confirmar o retorno do paciente
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={AppColors.warning.DEFAULT} />
            </TouchableOpacity>
          )}

          {/* Menu Items */}
          <PatientDetailMenuItem
            testID="menu-profile"
            title="Perfil do Paciente"
            subtitle="Visualize e edite os dados cadastrais"
            icon={User}
            iconColor={AppColors.primary[700]}
            iconBgColor={AppColors.primary[50]}
            onPress={() => setActiveTab('profile')}
          />
          <PatientDetailMenuItem
            testID="menu-timeline"
            title="Linha do Tempo"
            subtitle="Acompanhe a evolução diária"
            icon={Calendar}
            iconColor={AppColors.success.DEFAULT}
            iconBgColor={AppColors.success.light}
            onPress={() => setActiveTab('timeline')}
          />
          <PatientDetailMenuItem
            testID="menu-gallery"
            title="Galeria de Fotos"
            subtitle="Fotos do acompanhamento"
            icon={ImageIcon}
            iconColor={AppColors.info.DEFAULT}
            iconBgColor={AppColors.info.light}
            onPress={() => setActiveTab('gallery')}
          />
        </View>
      )}

      {activeTab === 'profile' && (
        <PatientProfileView
          data={profileData}
          isLoading={false}
          isFinalized={isFinalized}
          onEditPress={() =>
            router.push({
              pathname: '/doctor/edit-patient/[surgeryId]',
              params: { surgeryId: surgeryId as string },
            })
          }
        />
      )}

      {activeTab === 'timeline' && (
        <PatientTimelineView
          timeline={timeline}
          surgeryTypeName={surgery?.surgery_type.name}
          isLoading={false}
        />
      )}

      {activeTab === 'gallery' && (
        <PatientGalleryView surgeryId={surgeryId as string} surgeryDate={surgery?.surgery_date} />
      )}

      {/* Pending Return Modal - accessible from menu screen */}
      <PendingReturnModal
        visible={showReturnModal}
        patientName={surgery?.patient.full_name || ''}
        onConfirm={handleConfirmReturn}
        onClose={() => setShowReturnModal(false)}
        isLoading={dismissPendingReturn.isPending}
      />
    </View>
  );
}
