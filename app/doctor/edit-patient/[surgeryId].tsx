import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { AppColors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { patientService, surgeryService, surgeryTypeService } from '../../../services';

interface SurgeryType {
  id: string;
  name: string;
  expected_recovery_days: number | null;
}

export default function EditPatientScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { surgeryId } = useLocalSearchParams();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [phone, setPhone] = useState('');
  const [surgeryTypeId, setSurgeryTypeId] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [followUpDays, setFollowUpDays] = useState('');
  const [surgeryTypes, setSurgeryTypes] = useState<SurgeryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [patientId, setPatientId] = useState('');

  useEffect(() => {
    loadSurgeryTypes();
    loadPatientData();
  }, []);

  const loadSurgeryTypes = async () => {
    try {
      const data = await surgeryTypeService.getActiveSurgeryTypes();
      const mapped: SurgeryType[] = (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        expected_recovery_days: t.expected_recovery_days,
      }));
      setSurgeryTypes(mapped);
    } catch (e) {
      console.error('Error loading surgery types:', e);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadPatientData = async () => {
    try {
      const surgery = await surgeryService.getSurgeryById(surgeryId as string);
      if (!surgery) {
        showToast({ type: 'error', title: 'Erro', message: 'Cirurgia não encontrada.' });
        router.back();
        return;
      }

      setPatientId(surgery.patient_id);
      setName(surgery.patient?.full_name || '');
      setSex((surgery.patient?.sex as 'M' | 'F') || 'M');
      setPhone(formatPhone((surgery.patient?.phone as string) || ''));
      setSurgeryTypeId(surgery.surgery_type_id);
      setFollowUpDays(String((surgery as any).follow_up_days ?? surgery.surgery_type?.expected_recovery_days ?? 14));

      // Format surgery_date from YYYY-MM-DD to DD/MM/YYYY
      const dateParts = surgery.surgery_date.split('T')[0].split('-');
      if (dateParts.length === 3) {
        setSurgeryDate(`${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
      }

      // Load CPF from profiles
      const patient = await patientService.getPatientById(surgery.patient_id);
      if (patient) {
        // CPF is on the profile, get it via getPatientDashboardData
        const dashData = await patientService.getPatientDashboardData(surgery.patient_id);
        if (dashData?.profile?.cpf) {
          setCpf(formatCPF(dashData.profile.cpf));
        }
      }
    } catch (e) {
      console.error('Error loading patient data:', e);
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível carregar dados do paciente.' });
    } finally {
      setLoadingData(false);
    }
  };

  const formatCPF = (value: string): string => {
    const digits: string = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string): string => {
    const digits: string = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatDate = (value: string): string => {
    const digits: string = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const handleSurgeryTypeChange = (typeId: string) => {
    setSurgeryTypeId(typeId);
    const selectedType = surgeryTypes.find((t) => t.id === typeId);
    if (selectedType) {
      setFollowUpDays(String(selectedType.expected_recovery_days ?? 14));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Erro', message: 'Nome é obrigatório.' });
      return;
    }

    const cleanCpf: string = cpf.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      showToast({ type: 'error', title: 'Erro', message: 'CPF inválido. Deve ter 11 dígitos.' });
      return;
    }

    const cleanPhone: string = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast({ type: 'error', title: 'Erro', message: 'Telefone é obrigatório e deve ter DDD + número.' });
      return;
    }

    if (!profile?.id) {
      showToast({ type: 'error', title: 'Erro', message: 'Sessão expirada.' });
      return;
    }

    setLoading(true);
    try {
      await patientService.updatePatient({
        patientId,
        surgeryId: surgeryId as string,
        name: name.trim(),
        cpf: cleanCpf,
        sex,
        phone: cleanPhone,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['surgeries', 'doctor', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['patients', 'doctor', profile.id] });

      showToast({ type: 'success', title: 'Sucesso', message: 'Paciente atualizado com sucesso!' });
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      showToast({ type: 'error', title: 'Erro', message: error?.message || 'Falha ao atualizar paciente.' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
      <View className="bg-primary-700" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3 relative">
          <TouchableOpacity onPress={() => router.back()} className="p-2 z-10">
            <ArrowLeft size={24} color={AppColors.white} />
          </TouchableOpacity>
          <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center pointer-events-none">
            <Text className="text-lg font-semibold text-white">Editar Paciente</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 p-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Nome completo *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="Nome do paciente"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* CPF */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">CPF *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={(v) => setCpf(formatCPF(v))}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>

          {/* Sex */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Sexo *</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border items-center ${sex === 'M' ? 'bg-primary-100 border-primary-700' : 'bg-white border-gray-300'
                  }`}
                onPress={() => setSex('M')}
              >
                <Text
                  className={`font-medium ${sex === 'M' ? 'text-primary-700' : 'text-gray-500'
                    }`}
                >
                  Masculino
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border items-center ${sex === 'F' ? 'bg-primary-100 border-primary-700' : 'bg-white border-gray-300'
                  }`}
                onPress={() => setSex('F')}
              >
                <Text
                  className={`font-medium ${sex === 'F' ? 'text-primary-700' : 'text-gray-500'
                    }`}
                >
                  Feminino
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Telefone *</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 text-gray-800"
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={(v) => setPhone(formatPhone(v))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Surgery Type (disabled) */}
          <View className="mb-4 opacity-80">
            <Text className="text-gray-400 font-medium mb-2">Procedimento</Text>
            {loadingTypes ? (
              <ActivityIndicator size="small" color={AppColors.gray[400]} />
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {surgeryTypes.map((type) => (
                  <View
                    key={type.id}
                    className={`py-2 px-4 rounded-xl border ${surgeryTypeId === type.id
                      ? 'bg-gray-400 border-gray-400'
                      : 'bg-gray-100 border-gray-200'
                      }`}
                  >
                    <Text
                      className={`font-medium ${surgeryTypeId === type.id ? 'text-white' : 'text-gray-400'
                        }`}
                    >
                      {type.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Text className="text-gray-400 text-xs mt-1">
              Não é possível alterar o procedimento.
            </Text>
          </View>

          {/* Follow-up Days (disabled) */}
          <View className="mb-4 opacity-80">
            <Text className="text-gray-400 font-medium mb-2">Tempo de acompanhamento (dias)</Text>
            <TextInput
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-400"
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              value={followUpDays}
              editable={false}
            />
            <Text className="text-gray-400 text-xs mt-1">
              Definido pelo procedimento. Não pode ser alterado.
            </Text>
          </View>

          {/* Surgery Date (disabled) */}
          <View className="mb-8 opacity-80">
            <Text className="text-gray-400 font-medium mb-2">Data do Procedimento</Text>
            <TextInput
              className="bg-gray-100 border border-gray-200 rounded-xl px-4 text-gray-400"
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              value={surgeryDate}
              editable={false}
            />
            <Text className="text-gray-400 text-xs mt-1">
              Não é possível alterar a data do procedimento.
            </Text>
          </View>

          {/* Submit */}
          <Button
            title={loading ? 'Salvando...' : 'Salvar Alterações'}
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary-700 mb-10"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
