import Slider from '@react-native-community/slider';
import { Stack, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { PostReportFeedbackSheet } from '../../components/patient/PostReportFeedbackSheet';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { patientService, questionService, reportService } from '../../services';
import { QuestionWithDetails } from '../../services/types';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DailyReportScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSurgeryTypeId, setCurrentSurgeryTypeId] = useState<string | null>(null);
  const [currentSurgeryId, setCurrentSurgeryId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [reportStatus, setReportStatus] = useState<'critical' | 'warning' | 'stable'>('stable');
  const [reportAlertMessages, setReportAlertMessages] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [session?.user.id]);

  const loadData = async () => {
    if (!session?.user.id) return;

    try {
      setLoading(true);
      // Get patient data to find surgery type
      const profile = await patientService.getPatientById(session.user.id);

      // We need to fetch the surgery details to get the surgery_type_id
      // Since getPatientById doesn't return surgery_type_id directly, we rely on the implementation detail 
      // where we should probably fetch the dashboard data or modify the service. 
      // For now, let's use getPatientDashboardData which gets the current surgery.
      const dashboardData = await patientService.getPatientDashboardData(session.user.id);

      if (dashboardData?.currentSurgery?.surgery_type_id) {
        const typeId = dashboardData.currentSurgery.surgery_type_id;
        setCurrentSurgeryTypeId(typeId);
        setCurrentSurgeryId(dashboardData.currentSurgery.id);

        const fetchedQuestions = await questionService.getQuestionsBySurgeryTypeId(typeId, dashboardData.currentSurgery.id);

        // Check for existing report for today
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
          setTimeout(() => router.back(), 1500);
          return;
        }

        setQuestions(fetchedQuestions);
      } else {
        showToast({ type: 'error', title: 'Erro', message: 'Cirurgia não encontrada.' });
        router.back();
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar as perguntas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const shouldRenderQuestion = (question: QuestionWithDetails) => {
    if (!question.metadata) return true;
    const meta = question.metadata as any;

    if (meta.depends_on_question_text && meta.depends_on_value) {
      const parentQuestion = questions.find(q => q.text === meta.depends_on_question_text);

      if (parentQuestion) {
        const parentAnswer = answers[parentQuestion.id];

        // If parent hasn't been answered yet, don't show child
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

  const handleSubmit = async () => {
    if (!session?.user.id || !currentSurgeryId) {
      showToast({ type: 'error', title: 'Erro', message: 'Informações da cirurgia não encontradas.' });
      return;
    }

    const missingAnswers = questions.filter(q => {
      if (!shouldRenderQuestion(q)) return false;

      const isOptionalText = q.text.toLowerCase().includes('algo mais que gostaria de relatar');
      const isExplicitlyOptional = (q.metadata as any)?.optional === true || (q.metadata as any)?.is_required === false;
      const isOptional = isOptionalText || isExplicitlyOptional;

      if (isOptional) return false;

      const answer = answers[q.id];
      return answer === undefined || answer === null || answer === '';
    });

    if (missingAnswers.length > 0) {
      showToast({ type: 'warning', title: 'Atenção', message: 'Por favor, responda todas as perguntas obrigatórias.' });
      return;
    }

    try {
      setSubmitting(true);
      const result = await reportService.submitDailyReport(session.user.id, currentSurgeryId, answers, questions);
      setReportStatus(result.status);
      setReportAlertMessages(result.alertMessages);
      showToast({ type: 'success', title: 'Sucesso', message: 'Relatório enviado com sucesso!' });
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao enviar o relatório. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1B3A5C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-primary-700" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3 relative">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 z-10"
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
            <Text className="text-lg font-semibold text-white">Relatório Diário</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-gray-500 mb-6 text-base">
          Responda as perguntas abaixo sobre como você está se sentindo hoje.
        </Text>

        {questions.filter(shouldRenderQuestion).sort((a, b) => {
          const aIsRelatar = a.text.toLowerCase().includes('algo mais que gostaria de relatar');
          const bIsRelatar = b.text.toLowerCase().includes('algo mais que gostaria de relatar');
          if (aIsRelatar && !bIsRelatar) return 1;
          if (!aIsRelatar && bIsRelatar) return -1;
          return 0;
        }).map((question) => (
          <View key={question.id} className="mb-6 p-5 rounded-xl border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">{question.text}</Text>

            {/* Input Types */}

            {/* SCALE (0-10) */}
            {question.input_type === 'scale' && (
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Sem dor (0)</Text>
                  <Text className="text-gray-900 font-bold text-lg">{answers[question.id] || 0}</Text>
                  <Text className="text-gray-500">Intensa (10)</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={answers[question.id] ? parseInt(answers[question.id]) : 0}
                  onValueChange={(val) => handleAnswerChange(question.id, val.toString())}
                  minimumTrackTintColor="#1B3A5C"
                  maximumTrackTintColor="#d1d5db"
                  thumbTintColor="#1B3A5C"
                />
              </View>
            )}

            {/* BOOLEAN */}
            {question.input_type === 'boolean' && (
              <View className="flex-row gap-4">
                {question.options?.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleAnswerChange(question.id, option.value)}
                    className={`flex-1 py-3 px-4 rounded-lg flex-row justify-center items-center border ${answers[question.id] === option.value
                      ? 'bg-primary-100 border-primary-700'
                      : 'bg-gray-50 border-gray-200'
                      }`}
                  >
                    <Text className={`font-medium ${answers[question.id] === option.value ? 'text-primary-700' : 'text-gray-600'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* SELECT */}
            {question.input_type === 'select' && (
              <View className="gap-3">
                {question.options?.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleAnswerChange(question.id, option.value)}
                    className={`w-full py-3 px-4 rounded-lg flex-row items-center ${answers[question.id] === option.value
                      ? 'bg-primary-100'
                      : 'bg-white'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border mr-3 justify-center items-center ${answers[question.id] === option.value ? 'border-primary-700' : 'border-gray-300'
                      }`}>
                      {answers[question.id] === option.value && <View className="w-2.5 h-2.5 rounded-full bg-primary-700" />}
                    </View>
                    <Text className={`font-medium ${answers[question.id] === option.value ? 'text-primary-700' : 'text-gray-600'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* TEXT */}
            {question.input_type === 'text' && (
              <View>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 min-h-[100px]"
                  multiline
                  textAlignVertical="top"
                  placeholder="Digite aqui..."
                  value={answers[question.id] || ''}
                  onChangeText={(text) => handleAnswerChange(question.id, text)}
                  maxLength={(question.metadata as any)?.max_length ? Number((question.metadata as any).max_length) : 200}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
                <Text className="text-right text-xs text-gray-400 mt-1">
                  {(answers[question.id] || '').length}/{(question.metadata as any)?.max_length || 200}
                </Text>
              </View>
            )}

            {/* NUMERIC (open number input) */}
            {question.input_type === 'numeric' && (() => {
              const meta = question.metadata as any;
              const min = meta?.min ?? 0;
              const max = meta?.max ?? 999;
              const unit = meta?.unit ?? '';
              const allowAboveMax = meta?.allow_above_max ?? false;
              const aboveMaxLabel = meta?.above_max_label ?? `Maior que ${max}${unit}`;
              const aboveMaxValue = meta?.above_max_value ?? `>${max}`;
              const currentValue = answers[question.id];
              const isAboveMax = currentValue === aboveMaxValue;

              const handleAboveMaxToggle = () => {
                if (isAboveMax) {
                  handleAnswerChange(question.id, max.toString());
                } else {
                  handleAnswerChange(question.id, aboveMaxValue);
                }
              };

              return (
                <View>
                  {/* Numeric input row */}
                  <View className="items-center mb-3">
                    {isAboveMax ? (
                      <View className="bg-red-50 border border-red-300 rounded-lg px-6 py-3">
                        <Text className="text-red-700 font-bold text-xl">{`>${max}`}</Text>
                      </View>
                    ) : (
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 text-gray-900 font-bold text-xl text-center min-w-[120px]"
                        keyboardType="number-pad"
                        maxLength={3}
                        value={currentValue || '0'}
                        onChangeText={(text) => {
                          // Strip any non-digit characters
                          const digitsOnly = text.replace(/[^0-9]/g, '');
                          if (digitsOnly === '') {
                            handleAnswerChange(question.id, '0');
                            return;
                          }
                          const parsed = parseInt(digitsOnly, 10);
                          if (parsed > max) {
                            handleAnswerChange(question.id, max.toString());
                          } else {
                            handleAnswerChange(question.id, parsed.toString());
                          }
                        }}
                        onFocus={() => {
                          // Select all text on focus for easy replacement
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 300);
                        }}
                      />
                    )}
                    {unit ? (
                      <Text className="text-gray-500 text-sm mt-1">{unit}</Text>
                    ) : null}
                  </View>

                  {/* Above max checkbox */}
                  {allowAboveMax && (
                    <TouchableOpacity
                      onPress={handleAboveMaxToggle}
                      className="flex-row items-center mt-2"
                    >
                      <View className={`w-5 h-5 rounded border mr-3 justify-center items-center ${
                        isAboveMax ? 'bg-primary-700 border-primary-700' : 'border-gray-300'
                      }`}>
                        {isAboveMax && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                      <Text className={`text-sm ${isAboveMax ? 'text-primary-700 font-medium' : 'text-gray-600'}`}>
                        {aboveMaxLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

          </View>
        ))
        }

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-xl items-center mb-12 ${submitting ? 'bg-gray-400' : 'bg-primary-700'
            }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Enviar Respostas</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      <PostReportFeedbackSheet
        visible={showFeedback}
        onClose={() => {
          setShowFeedback(false);
          router.back();
        }}
        surgeryTypeId={currentSurgeryTypeId}
        resultStatus={reportStatus}
        alertMessages={reportAlertMessages}
      />
    </View >
  );
}
