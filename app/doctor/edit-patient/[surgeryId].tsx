import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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
import { PickerModal, PickerOption } from '../../../components/ui/SearchablePickerModal';
import { AppColors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { patientService, surgeryService, surgeryTypeService, reportService } from '../../../services';

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
  const [hospital, setHospital] = useState('');
  const [surgeryTypes, setSurgeryTypes] = useState<SurgeryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [showSurgeryPicker, setShowSurgeryPicker] = useState(false);
  const [hasReports, setHasReports] = useState(true); // default true to keep fields locked until check
  const [isFinalized, setIsFinalized] = useState(false); // true when surgery is not active (completed/pending_return/cancelled)

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
      setHospital((surgery as any).hospital || '');

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

      // Check surgery status — if not active, block all editing
      const surgeryStatus = (surgery as any).status as string;
      if (surgeryStatus !== 'active') {
        setIsFinalized(true);
        setHasReports(true); // force lock surgery fields too
      } else {
        // Only check reports if surgery is still active
        const reports = await reportService.getReportsBySurgeryId(surgeryId as string);
        setHasReports(reports.length > 0);
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

  const pickerOptions: PickerOption[] = useMemo(
    () => surgeryTypes.map((t) => ({ id: t.id, label: t.name })),
    [surgeryTypes]
  );

  const selectedSurgeryName = useMemo(
    () => surgeryTypes.find((t) => t.id === surgeryTypeId)?.name ?? '',
    [surgeryTypes, surgeryTypeId]
  );

  const handleSurgeryTypeChange = (option: PickerOption) => {
    setSurgeryTypeId(option.id);
    const selectedType = surgeryTypes.find((t) => t.id === option.id);
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
      const updateData: any = {
        patientId,
        surgeryId: surgeryId as string,
        name: name.trim(),
        cpf: cleanCpf,
        sex,
        phone: cleanPhone,
        hospital: hospital.trim(),
      };

      // Include surgery fields only when editing is allowed (no reports)
      if (!hasReports) {
        updateData.surgeryTypeId = surgeryTypeId;
        updateData.followUpDays = parseInt(followUpDays, 10) || undefined;

        // Parse surgery date DD/MM/YYYY to YYYY-MM-DD
        const dateDigits = surgeryDate.replace(/\D/g, '');
        if (dateDigits.length === 8) {
          const day = parseInt(dateDigits.slice(0, 2), 10);
          const month = parseInt(dateDigits.slice(2, 4), 10);
          const year = parseInt(dateDigits.slice(4, 8), 10);
          const parsedDate = new Date(year, month - 1, day);
          const isValidDate =
            parsedDate.getFullYear() === year &&
            parsedDate.getMonth() === month - 1 &&
            parsedDate.getDate() === day;

          if (!isValidDate) {
            setLoading(false);
            showToast({ type: 'error', title: 'Erro', message: 'Data inválida.' });
            return;
          }
          updateData.surgeryDate = `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      await patientService.updatePatient(updateData);

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
          {/* Finalized warning banner */}
          {isFinalized && (
            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: AppColors.warning.light }}>
              <Text className="text-sm font-medium" style={{ color: AppColors.warning.dark }}>
                Este paciente já finalizou o acompanhamento. Os dados não podem ser alterados.
              </Text>
            </View>
          )}

          {/* Name */}
          <View className={`mb-4 ${isFinalized ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${isFinalized ? 'text-gray-400' : 'text-gray-700'}`}>Nome completo *</Text>
            <TextInput
              className={`rounded-xl px-4 ${isFinalized ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="Nome do paciente"
              value={name}
              onChangeText={!isFinalized ? setName : undefined}
              editable={!isFinalized}
            />
          </View>

          {/* CPF */}
          <View className={`mb-4 ${isFinalized ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${isFinalized ? 'text-gray-400' : 'text-gray-700'}`}>CPF *</Text>
            <TextInput
              className={`rounded-xl px-4 ${isFinalized ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={!isFinalized ? (v) => setCpf(formatCPF(v)) : undefined}
              keyboardType="numeric"
              maxLength={14}
              editable={!isFinalized}
            />
          </View>

          {/* Sex */}
          <View className={`mb-4 ${isFinalized ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${isFinalized ? 'text-gray-400' : 'text-gray-700'}`}>Sexo *</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border items-center ${sex === 'M'
                  ? (isFinalized ? 'bg-gray-400 border-gray-400' : 'bg-primary-100 border-primary-700')
                  : (isFinalized ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300')
                  }`}
                onPress={!isFinalized ? () => setSex('M') : undefined}
                disabled={isFinalized}
              >
                <Text
                  className={`font-medium ${sex === 'M'
                    ? (isFinalized ? 'text-white' : 'text-primary-700')
                    : (isFinalized ? 'text-gray-400' : 'text-gray-500')
                    }`}
                >
                  Masculino
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border items-center ${sex === 'F'
                  ? (isFinalized ? 'bg-gray-400 border-gray-400' : 'bg-primary-100 border-primary-700')
                  : (isFinalized ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300')
                  }`}
                onPress={!isFinalized ? () => setSex('F') : undefined}
                disabled={isFinalized}
              >
                <Text
                  className={`font-medium ${sex === 'F'
                    ? (isFinalized ? 'text-white' : 'text-primary-700')
                    : (isFinalized ? 'text-gray-400' : 'text-gray-500')
                    }`}
                >
                  Feminino
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phone */}
          <View className={`mb-4 ${isFinalized ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${isFinalized ? 'text-gray-400' : 'text-gray-700'}`}>Telefone *</Text>
            <TextInput
              className={`rounded-xl px-4 ${isFinalized ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="(00) 00000-0000"
              value={phone}
              onChangeText={!isFinalized ? (v) => setPhone(formatPhone(v)) : undefined}
              keyboardType="phone-pad"
              maxLength={15}
              editable={!isFinalized}
            />
          </View>

          {/* Surgery Type */}
          <View className={`mb-4 ${(hasReports || isFinalized) ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${(hasReports || isFinalized) ? 'text-gray-400' : 'text-gray-700'}`}>Procedimento{(!hasReports && !isFinalized) ? ' *' : ''}</Text>
            {loadingTypes ? (
              <ActivityIndicator size="small" color={(hasReports || isFinalized) ? AppColors.gray[400] : AppColors.primary[700]} />
            ) : (hasReports || isFinalized) ? (
              <View
                className="flex-row items-center rounded-xl border border-gray-200 bg-gray-100 px-4"
                style={{ height: 48 }}
              >
                <Text className="flex-1 text-base text-gray-400" numberOfLines={1}>
                  {selectedSurgeryName || '—'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                testID="surgery-type-selector"
                className={`flex-row items-center justify-between rounded-xl border px-4 ${
                  selectedSurgeryName
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-gray-300 bg-white'
                }`}
                style={{ height: 48 }}
                onPress={() => setShowSurgeryPicker(true)}
                activeOpacity={0.7}
              >
                <Text
                  className={`flex-1 text-base ${
                    selectedSurgeryName ? 'font-medium text-primary-700' : 'text-gray-400'
                  }`}
                  numberOfLines={1}
                >
                  {selectedSurgeryName || 'Selecione o procedimento'}
                </Text>
                <ChevronDown size={20} color={AppColors.gray[400]} />
              </TouchableOpacity>
            )}
            {(hasReports || isFinalized) && (
              <Text className="text-gray-400 text-xs mt-1">
                {isFinalized
                  ? 'Acompanhamento finalizado. Não é possível alterar.'
                  : 'Não é possível alterar pois o paciente já possui registros.'
                }
              </Text>
            )}
          </View>

          <PickerModal
            visible={showSurgeryPicker}
            onClose={() => setShowSurgeryPicker(false)}
            onSelect={handleSurgeryTypeChange}
            options={pickerOptions}
            selectedId={surgeryTypeId}
            title="Selecionar Procedimento"
            emptyMessage="Nenhum procedimento encontrado."
          />

          {/* Follow-up Days */}
          <View className={`mb-4 ${(hasReports || isFinalized) ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${(hasReports || isFinalized) ? 'text-gray-400' : 'text-gray-700'}`}>Tempo de acompanhamento (dias){(!hasReports && !isFinalized) ? ' *' : ''}</Text>
            <TextInput
              className={`rounded-xl px-4 ${(hasReports || isFinalized) ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              value={followUpDays}
              onChangeText={(!hasReports && !isFinalized) ? setFollowUpDays : undefined}
              editable={!hasReports && !isFinalized}
              keyboardType="numeric"
            />
            {(hasReports || isFinalized) && (
              <Text className="text-gray-400 text-xs mt-1">
                {isFinalized
                  ? 'Acompanhamento finalizado. Não é possível alterar.'
                  : 'Não é possível alterar pois o paciente já possui registros.'
                }
              </Text>
            )}
          </View>

          {/* Surgery Date */}
          <View className={`mb-8 ${(hasReports || isFinalized) ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${(hasReports || isFinalized) ? 'text-gray-400' : 'text-gray-700'}`}>Data do Procedimento{(!hasReports && !isFinalized) ? ' *' : ''}</Text>
            <TextInput
              className={`rounded-xl px-4 ${(hasReports || isFinalized) ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              value={surgeryDate}
              onChangeText={(!hasReports && !isFinalized) ? (v) => setSurgeryDate(formatDate(v)) : undefined}
              editable={!hasReports && !isFinalized}
              keyboardType={(!hasReports && !isFinalized) ? 'numeric' : undefined}
              maxLength={10}
            />
            {(hasReports || isFinalized) && (
              <Text className="text-gray-400 text-xs mt-1">
                {isFinalized
                  ? 'Acompanhamento finalizado. Não é possível alterar.'
                  : 'Não é possível alterar pois o paciente já possui registros.'
                }
              </Text>
            )}
          </View>

          {/* Hospital */}
          <View className={`mb-8 ${isFinalized ? 'opacity-80' : ''}`}>
            <Text className={`font-medium mb-2 ${isFinalized ? 'text-gray-400' : 'text-gray-700'}`}>Hospital / Clínica</Text>
            <TextInput
              testID="hospital-input"
              className={`rounded-xl px-4 ${isFinalized ? 'bg-gray-100 border border-gray-200 text-gray-400' : 'bg-white border border-gray-300 text-gray-800'}`}
              style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
              placeholder="Nome do hospital ou clínica"
              value={hospital}
              onChangeText={!isFinalized ? setHospital : undefined}
              editable={!isFinalized}
            />
          </View>

          {/* Submit */}
          {!isFinalized && (
            <Button
              title={loading ? 'Salvando...' : 'Salvar Alterações'}
              onPress={handleSubmit}
              disabled={loading}
              className="bg-primary-700 mb-10"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
