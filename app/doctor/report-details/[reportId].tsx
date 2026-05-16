import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { questionService, reportService, surgeryService } from '../../../services';
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

function getAnswerLabel(question: QuestionWithDetails, answerValue: string | undefined): { label: string; isAbnormal: boolean } {
  if (answerValue === undefined || answerValue === null) {
    return { label: 'Sem resposta', isAbnormal: false };
  }

  if (question.input_type === 'scale') {
    const numValue: number = parseInt(answerValue, 10);
    return { label: `${numValue}/10`, isAbnormal: numValue > 5 };
  }

  if (question.input_type === 'boolean' || question.input_type === 'select') {
    const matchingOption = question.options?.find(o => o.value === answerValue);
    if (matchingOption) {
      return { label: matchingOption.label, isAbnormal: matchingOption.is_abnormal || false };
    }
    return { label: answerValue, isAbnormal: false };
  }

  if (question.input_type === 'numeric') {
    const meta = question.metadata as any;
    const unit = meta?.unit ?? '';
    const aboveMaxValue = meta?.above_max_value ?? `>${meta?.max ?? 999}`;
    const isAboveMax = answerValue === aboveMaxValue;
    const abnormalMin = meta?.abnormal_min;
    const numVal = parseInt(answerValue, 10);
    const isAbnormal = isAboveMax || (!isNaN(numVal) && abnormalMin !== undefined && numVal >= abnormalMin);
    const displayLabel = isAboveMax ? `${aboveMaxValue} ${unit}` : `${answerValue} ${unit}`;
    return { label: displayLabel.trim(), isAbnormal };
  }

  return { label: answerValue, isAbnormal: false };
}

export default function DoctorReportDetailsScreen() {
  const { reportId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, isDoctor } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    loadData();
  }, [reportId, session?.user.id]);

  const loadData = async () => {
    if (!session?.user.id || !isDoctor || !reportId) return;

    try {
      setLoading(true);
      const reportData = await reportService.getReportById(reportId as string);

      if (!reportData) {
        showToast({ type: 'error', title: 'Erro', message: 'Relatório não encontrado.' });
        router.back();
        return;
      }
      setReport(reportData);

      if (reportData.surgery_id) {
        const surgery = await surgeryService.getSurgeryById(reportData.surgery_id);
        if (surgery) {
          const typeId: string = surgery.surgery_type_id;
          const fetchedQuestions = await questionService.getQuestionsBySurgeryTypeId(typeId, surgery.id);
          setQuestions(fetchedQuestions);
        }
      }
    } catch (error) {
      console.error('Error loading report details:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar os detalhes do relatório.' });
    } finally {
      setLoading(false);
    }
  };

  const shouldRenderQuestion = (question: QuestionWithDetails): boolean => {
    if (!question.metadata || !report) return true;
    const meta = question.metadata as any;

    if (meta.depends_on_question_text && meta.depends_on_value) {
      const parentQuestion = questions.find(q => q.text === meta.depends_on_question_text);
      if (parentQuestion) {
        const parentAnswer = report.answers[parentQuestion.id];
        if (parentAnswer === undefined || parentAnswer === null) return false;

        const condition: string = meta.depends_on_condition || 'eq';
        switch (condition) {
          case 'gt': return Number(parentAnswer) > Number(meta.depends_on_value);
          case 'gte': return Number(parentAnswer) >= Number(meta.depends_on_value);
          case 'lt': return Number(parentAnswer) < Number(meta.depends_on_value);
          case 'lte': return Number(parentAnswer) <= Number(meta.depends_on_value);
          case 'neq': return String(parentAnswer) !== String(meta.depends_on_value);
          default: return String(parentAnswer) === String(meta.depends_on_value);
        }
      }
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#1B3A5C" />
      </View>
    );
  }

  if (!report) return null;

  const hasCriticalAlert: boolean = report.alerts?.some(a => a.severity === 'critical') || false;
  const hasWarningAlert: boolean = report.alerts?.some(a => a.severity === 'warning') || false;
  const visibleQuestions: QuestionWithDetails[] = questions.filter(shouldRenderQuestion);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header */}
      <View className="bg-primary-700" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3 relative">
          <TouchableOpacity onPress={() => router.back()} className="p-2 z-10">
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
            <Text className="text-lg font-semibold text-white">Respostas do Paciente</Text>
            <Text className="text-xs text-primary-200">
              {report.date ? format(new Date(report.date), "d 'de' MMMM", { locale: ptBR }) : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Status Card — Always Visible */}
        <View
          className={`mb-4 p-4 rounded-xl border ${hasCriticalAlert
            ? 'bg-red-50 border-red-200'
            : hasWarningAlert
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
            }`}
        >
          <View className="flex-row items-start">
            <View
              className={`mt-0.5 p-2 rounded-full mr-3 ${hasCriticalAlert ? 'bg-red-100' : hasWarningAlert ? 'bg-yellow-100' : 'bg-green-100'
                }`}
            >
              {hasCriticalAlert ? (
                <AlertCircle size={20} color="#DC2626" />
              ) : hasWarningAlert ? (
                <AlertTriangle size={20} color="#D97706" />
              ) : (
                <CheckCircle size={20} color="#16A34A" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`font-bold text-lg mb-1 ${hasCriticalAlert ? 'text-red-800' : hasWarningAlert ? 'text-yellow-800' : 'text-green-800'
                  }`}
              >
                {hasCriticalAlert ? 'Alerta Crítico' : hasWarningAlert ? 'Atenção Necessária' : 'Recuperação dentro do esperado'}
              </Text>

              {report.alerts && report.alerts.length > 0 ? (
                <View className="mt-2">
                  {report.alerts.map((alert, idx) => {
                    const parsed = parseAlertDetails(alert.message);
                    return (
                      <View key={idx} className="mb-3">
                        {parsed.summary ? (
                          <Text className="text-gray-700 font-medium text-sm mb-1">{parsed.summary}</Text>
                        ) : null}
                        {parsed.items.length > 0 ? (
                          parsed.items.map((item, i) => (
                            <View key={i} className="flex-row items-start ml-2 mb-0.5">
                              <Text className="text-red-500 mr-2 mt-0.5">•</Text>
                              <Text className="text-gray-600 text-sm flex-1">{item}</Text>
                            </View>
                          ))
                        ) : (
                          <Text className="text-gray-600 text-sm ml-2">• {alert.message}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-gray-600 text-sm">Nenhum sinal de alerta reportado neste dia.</Text>
              )}
            </View>
          </View>
        </View>

        {/* Toggle Answers Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-3 px-4 mb-4"
          onPress={() => setShowAnswers(!showAnswers)}
        >
          <ClipboardList size={20} color="#1B3A5C" />
          <Text className="text-primary-700 font-semibold ml-2">
            {showAnswers ? 'Ocultar Respostas' : 'Ver Respostas'}
          </Text>
          {showAnswers ? (
            <ChevronUp size={20} color="#1B3A5C" style={{ marginLeft: 4 }} />
          ) : (
            <ChevronDown size={20} color="#1B3A5C" style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>

        {/* Compact Answers — Collapsible */}
        {showAnswers && (
          <View className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
            {visibleQuestions.map((question, index) => {
              const answer = getAnswerLabel(question, report.answers[question.id]);
              return (
                <View
                  key={question.id}
                  className={`flex-row items-center justify-between px-4 py-3 ${index < visibleQuestions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <Text className="text-gray-700 text-sm flex-1 mr-3" numberOfLines={2}>
                    {question.text}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${answer.isAbnormal ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Text className={`text-sm font-medium ${answer.isAbnormal ? 'text-red-700' : 'text-gray-700'}`}>
                      {answer.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
