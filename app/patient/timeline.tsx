import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CheckCircle, ChevronRight, MessageCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { patientService, questionService, reportService } from '../../services';

interface TimelineDay {
  day: number;
  date: Date;
  status: 'pending' | 'completed' | 'missed' | 'future';
  reportId?: string;
  alertSeverity?: 'critical' | 'warning';
  hasMessage?: boolean;
}

export default function TimelineScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [surgeryDate, setSurgeryDate] = useState<Date | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [session?.user.id])
  );

  const loadData = async () => {
    if (!session?.user.id) return;

    try {
      setLoading(true);
      const dashboardData = await patientService.getPatientDashboardData(session.user.id);
      const reports = await reportService.getPatientReports(session.user.id);

      if (dashboardData?.currentSurgery) {
        // Load questions to detect text messages
        const surgeryTypeId = dashboardData.currentSurgery.surgery_type_id;
        const questions = await questionService.getQuestionsBySurgeryTypeId(surgeryTypeId, dashboardData.currentSurgery.id);
        const textQuestionIds = questions
          .filter(q => q.input_type === 'text')
          .map(q => q.id);

        // Compute has_message for each report
        for (const report of reports) {
          if (textQuestionIds.length > 0 && report.answers) {
            report.has_message = textQuestionIds.some(qId => {
              const val = report.answers[qId];
              return typeof val === 'string' && val.trim().length > 0;
            });
          }
        }
        // Parse surgery date safely as Local YYYY-MM-DD
        const [sYear, sMonth, sDay] = dashboardData.currentSurgery.surgery_date.split('-').map(Number);
        // Note: Month in Date constructor is 0-indexed
        const sDate = new Date(sYear, sMonth - 1, sDay);

        setSurgeryDate(sDate);
        const recoveryDays = (dashboardData.currentSurgery as any).follow_up_days ?? dashboardData.currentSurgery.surgery_type.expected_recovery_days ?? 14;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: TimelineDay[] = [];

        for (let i = 1; i <= recoveryDays; i++) {
          const currentDayDate = new Date(sDate);
          currentDayDate.setDate(sDate.getDate() + i);
          // Note: Logic used is Day 1 = Surgery Day + 1 based on previous loop (i=1..).
          // If User screenshot shows Day 5 = 14th.
          // If Surgery was 10th. 10+1=11 (Day 1). 10+5=15 (Day 5).
          // If User screenshot says Day 5 = 14 Feb.
          // Then Surgery must be 9th. 9+5 = 14.
          // So Day 1 = 10th (Surgery + 1).

          // Compare logic
          // Compare logic
          const reportForDay = reports.find(r => {
            // Safe local comparison
            if (!r.date) return false;
            // r.date is YYYY-MM-DD string from helper or DB.
            // Do NOT use new Date(r.date) as it assumes UTC for "YYYY-MM-DD".
            // Use split logic.
            const [rYear, rMonth, rDay] = String(r.date).split('-').map(Number);

            // Compare with currentDayDate (which is local midnight)
            return rDay === currentDayDate.getDate() &&
              (rMonth - 1) === currentDayDate.getMonth() &&
              rYear === currentDayDate.getFullYear();
          });

          let status: TimelineDay['status'] = 'future';

          if (reportForDay) {
            status = 'completed';
          } else {
            // Date comparisons
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

          // Check alerts
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
            alertSeverity: severity,
            hasMessage: reportForDay?.has_message,
          });
        }
        setTimeline(days);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível carregar a linha do tempo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: TimelineDay) => {
    if (day.status === 'pending') {
      router.push('/patient/daily-report');
    } else if (day.status === 'completed' && day.reportId) {
      router.push({ pathname: '/patient/report-details/[reportId]', params: { reportId: day.reportId } });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#00BFA5" />
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
            <Text className="text-lg font-semibold text-white">Linha do Tempo</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-gray-500 text-base">
            Acompanhe sua evolução diária.
          </Text>
        </View>

        {timeline.map((item) => (
          <TouchableOpacity
            key={item.day}
            disabled={item.status === 'future' || item.status === 'missed'}
            onPress={() => handleDayPress(item)}
            className={`mb-4 p-4 rounded-xl border flex-row items-center justify-between ${item.status === 'future' ? 'bg-gray-50 border-gray-100 opacity-60' :
              item.status === 'pending' ? 'bg-white border-primary-700 shadow-sm' :
                item.status === 'missed' ? 'bg-gray-100 border-gray-200' :
                  item.alertSeverity === 'critical' ? 'bg-red-50 border-red-200' :
                    item.alertSeverity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-green-50 border-green-200'
              }`}
          >
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${item.status === 'pending' ? 'bg-primary-100' :
                item.status === 'future' ? 'bg-gray-200' :
                  item.status === 'missed' ? 'bg-gray-300' :
                    item.alertSeverity === 'critical' ? 'bg-red-100' :
                      item.alertSeverity === 'warning' ? 'bg-yellow-100' :
                        'bg-green-100'
                }`}>
                <Text className={`font-bold ${item.status === 'pending' ? 'text-primary-700' :
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
                {item.hasMessage && (
                  <View
                    testID={`message-indicator-${item.day}`}
                    className="flex-row items-center mt-0.5"
                  >
                    <MessageCircle size={12} color={AppColors.info.DEFAULT} />
                    <Text
                      className="text-xs ml-1"
                      style={{ color: AppColors.info.DEFAULT }}
                    >
                      Enviou mensagem
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View>
              {item.status === 'pending' && (
                <View className="bg-primary-700 px-3 py-1.5 rounded-full">
                  <Text className="text-white font-medium text-xs">Responder</Text>
                </View>
              )}
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
              {item.status === 'future' && (
                <Text className="text-gray-300 text-xs">Pendente</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
