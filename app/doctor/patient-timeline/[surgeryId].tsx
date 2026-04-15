import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle, ChevronRight, Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { reportService, surgeryService } from '../../../services';
import { SurgeryWithDetails } from '../../../services/types';
import { AppColors } from '../../../constants/colors';

interface TimelineDay {
  day: number;
  date: Date;
  status: 'pending' | 'completed' | 'missed' | 'future';
  reportId?: string;
  alertSeverity?: 'critical' | 'warning';
}

export default function DoctorPatientTimelineScreen() {
  const router = useRouter();
  const { surgeryId } = useLocalSearchParams();
  const { session, isDoctor } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [surgery, setSurgery] = useState<SurgeryWithDetails | null>(null);

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

      const reports = await reportService.getReportsBySurgeryId(surgeryId as string);

      // Parse surgery date safely as Local YYYY-MM-DD
      const [sYear, sMonth, sDay] = surgeryData.surgery_date.split('-').map(Number);
      const sDate = new Date(sYear, sMonth - 1, sDay);

      const recoveryDays = (surgeryData as any).follow_up_days ?? surgeryData.surgery_type.expected_recovery_days ?? 14;

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
      console.error('Error loading timeline:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível carregar a linha do tempo do paciente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: TimelineDay) => {
    if (day.status === 'completed' && day.reportId) {
      router.push({ pathname: '/doctor/report-details/[reportId]', params: { reportId: day.reportId } });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

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
            <Text className="text-lg font-semibold text-white">
              {surgery?.patient.full_name || 'Linha do Tempo'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-center self-start bg-primary-50 px-3 py-2 rounded-lg border border-primary-200 mb-3"
            onPress={() => router.push({ pathname: '/doctor/edit-patient/[surgeryId]', params: { surgeryId: surgeryId as string } })}
          >
            <Pencil size={14} color={AppColors.primary[700]} />
            <Text className="text-primary-700 font-medium text-sm ml-1.5">Editar paciente</Text>
          </TouchableOpacity>
          <Text className="text-gray-500 text-base">
            Acompanhando evolução de {surgery?.surgery_type.name || 'cirurgia'}
          </Text>
        </View>

        {timeline.map((item) => (
          <TouchableOpacity
            key={item.day}
            disabled={item.status !== 'completed'} // Only clickable if completed
            onPress={() => handleDayPress(item)}
            className={`mb-4 p-4 rounded-xl border flex-row items-center justify-between ${item.status === 'future' ? 'bg-gray-50 border-gray-100 opacity-60' :
              item.status === 'pending' ? 'bg-white border-blue-200' :
                item.status === 'missed' ? 'bg-gray-100 border-gray-200' :
                  item.alertSeverity === 'critical' ? 'bg-red-50 border-red-200' :
                    item.alertSeverity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
              }`}
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${item.status === 'pending' ? 'bg-blue-50' :
                item.status === 'future' ? 'bg-gray-200' :
                  item.status === 'missed' ? 'bg-gray-300' :
                    item.alertSeverity === 'critical' ? 'bg-red-100' :
                      item.alertSeverity === 'warning' ? 'bg-yellow-100' :
                        'bg-green-100'
                }`}>
                <Text className={`font-bold ${item.status === 'pending' ? 'text-blue-500' :
                  item.status === 'future' ? 'text-gray-500' :
                    item.status === 'missed' ? 'text-gray-500' :
                      item.alertSeverity === 'critical' ? 'text-red-700' :
                        item.alertSeverity === 'warning' ? 'text-yellow-700' :
                          'text-green-700'
                  }`}>{item.day}</Text>
              </View>

              <View>
                <Text className="font-semibold text-gray-800 text-lg">
                  Dia {item.day}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {format(item.date, "d 'de' MMMM", { locale: ptBR })}
                </Text>
              </View>
            </View>

            <View>
              {item.status === 'completed' && (
                <View className="flex-row items-center">
                  {item.alertSeverity === 'critical' ? (
                    <Text className="text-red-600 font-medium mr-2">Crítico</Text>
                  ) : item.alertSeverity === 'warning' ? (
                    <Text className="text-yellow-600 font-medium mr-2">Atenção</Text>
                  ) : (
                    <>
                      <Text className="text-green-600 font-medium mr-1">Respondido</Text>
                      <CheckCircle size={16} color="#16A34A" />
                    </>
                  )}
                  <ChevronRight size={20} color={
                    item.alertSeverity === 'critical' ? '#DC2626' :
                      item.alertSeverity === 'warning' ? '#D97706' :
                        '#16A34A'
                  } />
                </View>
              )}
              {item.status === 'missed' && (
                <Text className="text-gray-400 text-xs">Não respondido</Text>
              )}
              {item.status === 'pending' && (
                <Text className="text-blue-500 font-medium text-xs">Aguardando resposta</Text>
              )}
              {item.status === 'future' && (
                <Text className="text-gray-300 text-xs">Futuro</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
