import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { patientService, questionService, reportService } from '../../../services';
import { DailyReport, QuestionWithDetails } from '../../../services/types';

/**
 * Parse alert message into individual items.
 * Alert messages often come as: "3 sinais críticos detectados. Detalhes: Febre: Sim, Náuseas: Sim"
 * We split on "Detalhes:" and then split the details by comma.
 */
function parseAlertDetails(message: string): { summary: string; items: string[] } {
  const detailsIndex: number = message.indexOf('Detalhes:');
  if (detailsIndex === -1) {
    return { summary: message, items: [] };
  }
  const summary: string = message.substring(0, detailsIndex).trim();
  const detailsStr: string = message.substring(detailsIndex + 'Detalhes:'.length).trim();
  const items: string[] = detailsStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return { summary, items };
}

export default function ReportHistoryScreen() {
  const { reportId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);

  useEffect(() => {
    loadData();
  }, [reportId, session?.user.id]);

  const loadData = async () => {
    if (!session?.user.id || !reportId) return;

    try {
      setLoading(true);
      const reportData = await reportService.getReportById(reportId as string);

      if (!reportData) {
        showToast({ type: 'error', title: 'Erro', message: 'Relatório não encontrado.' });
        router.back();
        return;
      }
      setReport(reportData);

      // Get questions to render the form structure
      // We need surgery type ID. We can get it from patient profile again.
      const dashboardData = await patientService.getPatientDashboardData(session.user.id);
      if (dashboardData?.currentSurgery?.surgery_type_id) {
        const typeId = dashboardData.currentSurgery.surgery_type_id;
        const fetchedQuestions = await questionService.getQuestionsBySurgeryTypeId(typeId, dashboardData.currentSurgery.id);
        setQuestions(fetchedQuestions);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar o histórico.' });
    } finally {
      setLoading(false);
    }
  };

  const shouldRenderQuestion = (question: QuestionWithDetails) => {
    if (!question.metadata || !report) return true;
    const meta = question.metadata as any;

    if (meta.depends_on_question_text && meta.depends_on_value) {
      const parentQuestion = questions.find(q => q.text === meta.depends_on_question_text);
      if (parentQuestion) {
        const parentAnswer = report.answers[parentQuestion.id];

        if (parentAnswer === undefined || parentAnswer === null) return false;

        const condition = meta.depends_on_condition || 'eq';

        switch (condition) {
          case 'gt':
            return Number(parentAnswer) > Number(meta.depends_on_value);
          case 'gte':
            return Number(parentAnswer) >= Number(meta.depends_on_value);
          case 'lt':
            return Number(parentAnswer) < Number(meta.depends_on_value);
          case 'lte':
            return Number(parentAnswer) <= Number(meta.depends_on_value);
          case 'neq':
            return String(parentAnswer) !== String(meta.depends_on_value);
          default: // 'eq'
            return String(parentAnswer) === String(meta.depends_on_value);
        }
      }
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#00BFA5" />
      </View>
    );
  }

  if (!report) return null;

  const hasCriticalAlert = report.alerts?.some(a => a.severity === 'critical');
  const hasWarningAlert = report.alerts?.some(a => a.severity === 'warning');

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-2 bg-white relative mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 z-10"
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
          <Text className="text-lg font-semibold text-gray-800">Detalhes do Dia</Text>
          <Text className="text-xs text-gray-500">
            {report.date ? format(new Date(report.date), "d 'de' MMMM", { locale: ptBR }) : ''}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View className={`mb-6 p-4 rounded-xl border ${hasCriticalAlert ? 'bg-red-50 border-red-200' :
          hasWarningAlert ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
          {/* Icon + Title row */}
          <View className="flex-row items-center mb-2">
            <View className={`p-2 rounded-full mr-3 ${hasCriticalAlert ? 'bg-red-100' :
              hasWarningAlert ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
              {hasCriticalAlert ? <AlertCircle size={20} color="#DC2626" /> :
                hasWarningAlert ? <AlertTriangle size={20} color="#D97706" /> :
                  <CheckCircle size={20} color="#16A34A" />
              }
            </View>
            <Text className={`font-bold text-lg ${hasCriticalAlert ? 'text-red-800' :
              hasWarningAlert ? 'text-yellow-800' :
                'text-green-800'
              }`}>
              {hasCriticalAlert ? 'Alerta Crítico' :
                hasWarningAlert ? 'Atenção Necessária' :
                  'Recuperação dentro do esperado'}
            </Text>
          </View>

          {/* Alert details — full width below */}
          {report.alerts && report.alerts.length > 0 ? (
            <View className="mt-1">
              {report.alerts.map((alert, idx) => {
                const parsed = parseAlertDetails(alert.message);
                return (
                  <View key={idx} className="mb-3">
                    {parsed.summary ? (
                      <Text className="text-gray-700 font-medium text-sm mb-1">{parsed.summary}</Text>
                    ) : null}
                    {parsed.items.length > 0 ? (
                      parsed.items.map((item, i) => (
                        <View key={i} className="flex-row items-start mb-0.5">
                          <Text className={`mr-1.5 mt-0.5 ${hasCriticalAlert ? 'text-red-500' : hasWarningAlert ? 'text-yellow-500' : 'text-green-500'}`}>•</Text>
                          <Text className="text-gray-600 text-sm flex-1">{item}</Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-gray-600 text-sm">• {alert.message}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text className="text-gray-600 text-sm">
              Nenhum sinal de alerta reportado neste dia.
            </Text>
          )}
        </View>

        <Text className="text-gray-900 font-bold text-lg mb-4">Respostas enviadas</Text>

        {questions.filter(shouldRenderQuestion).map((question) => (
          <View key={question.id} className="mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100 opacity-90">
            <Text className="text-base font-semibold text-gray-800 mb-3">{question.text}</Text>

            {/* Input Types (Read Only) */}

            {/* SCALE (0-10) */}
            {question.input_type === 'scale' && (
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Nível relatado:</Text>
                  <Text className={`font-bold text-lg ${(report.answers[question.id] || 0) > 5 ? 'text-red-600' : 'text-gray-900'
                    }`}>{report.answers[question.id] || 0}</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={report.answers[question.id] ? parseInt(report.answers[question.id]) : 0}
                  disabled={true}
                  minimumTrackTintColor={(report.answers[question.id] || 0) > 5 ? "#EF4444" : "#00BFA5"}
                  thumbTintColor={(report.answers[question.id] || 0) > 5 ? "#EF4444" : "#00BFA5"}
                />
              </View>
            )}

            {/* BOOLEAN */}
            {question.input_type === 'boolean' && (
              <View className="flex-row gap-4">
                {question.options?.map((option) => {
                  const isSelected = report.answers[question.id] === option.value;
                  const isAbnormal = option.is_abnormal;
                  return (
                    <View
                      key={option.id}
                      className={`flex-1 py-3 px-4 rounded-lg flex-row justify-center items-center border ${isSelected
                        ? (isAbnormal ? 'bg-red-50 border-red-300' : 'bg-teal-50 border-teal-500')
                        : 'bg-gray-50 border-gray-100 opacity-50'
                        }`}
                    >
                      <Text className={`font-medium ${isSelected ? (isAbnormal ? 'text-red-700' : 'text-teal-700') : 'text-gray-400'}`}>
                        {option.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}

            {/* SELECT */}
            {question.input_type === 'select' && (
              <View className="gap-3">
                {question.options?.map((option) => {
                  const isSelected = report.answers[question.id] === option.value;
                  const isAbnormal = option.is_abnormal;
                  return (
                    <View
                      key={option.id}
                      className={`w-full py-3 px-4 rounded-lg flex-row items-center border ${isSelected
                        ? (isAbnormal ? 'bg-red-50 border-red-300' : 'bg-teal-50 border-teal-500')
                        : 'bg-white border-gray-100 hidden' // Hide unselected in history for cleaner view? Or show dimmed? Let's show selected only or all dimmed.
                        }`}
                      style={{ display: isSelected ? 'flex' : 'none' }} // Show only selected in history for cleaner view
                    >
                      <Text className={`font-medium ${isSelected ? (isAbnormal ? 'text-red-700' : 'text-teal-700') : 'text-gray-600'}`}>
                        {option.label}
                      </Text>
                    </View>
                  )
                })}
              </View>
            )}

            {/* TEXT */}
            {question.input_type === 'text' && (
              <Text className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 min-h-[60px]">
                {report.answers[question.id] || 'Sem resposta.'}
              </Text>
            )}

            {/* NUMERIC */}
            {question.input_type === 'numeric' && (() => {
              const meta = question.metadata as any;
              const unit = meta?.unit ?? '';
              const aboveMaxValue = meta?.above_max_value ?? `>${meta?.max ?? 999}`;
              const answerVal = report.answers[question.id];
              const isAboveMax = answerVal === aboveMaxValue;
              const displayValue = isAboveMax ? aboveMaxValue : (answerVal ?? 'Sem resposta');
              const abnormalMin = meta?.abnormal_min;
              const numVal = parseInt(answerVal, 10);
              const isAbnormal = isAboveMax || (!isNaN(numVal) && abnormalMin !== undefined && numVal >= abnormalMin);

              return (
                <View className={`py-3 px-4 rounded-lg border ${isAbnormal ? 'bg-red-50 border-red-300' : 'bg-teal-50 border-teal-500'}`}>
                  <Text className={`font-bold text-lg text-center ${isAbnormal ? 'text-red-700' : 'text-teal-700'}`}>
                    {displayValue}{unit ? ` ${unit}` : ''}
                  </Text>
                </View>
              );
            })()}

          </View>
        ))}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
