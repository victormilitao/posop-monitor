import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSurgeryTypes } from '../../hooks/useSurgeryTypes';
import { patientService } from '../../services';
import { Button } from '../ui/Button';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPatientModal({ visible, onClose, onSuccess }: AddPatientModalProps) {
  const { profile } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [surgeryTypeId, setSurgeryTypeId] = useState('');
  const [surgeryDate, setSurgeryDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`; // Brazilian format for input
  });

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: surgeryTypes, isLoading: isLoadingTypes } = useSurgeryTypes(sex);

  // Reset surgery type selection when sex changes and the selected type is no longer available
  React.useEffect(() => {
    if (surgeryTypeId && surgeryTypes) {
      const stillAvailable = surgeryTypes.some(t => t.id === surgeryTypeId);
      if (!stillAvailable) {
        setSurgeryTypeId('');
      }
    }
  }, [sex, surgeryTypes, surgeryTypeId]);

  const handleSubmit = async () => {
    if (!name || !email || !surgeryTypeId || !surgeryDate) {
      setError('Por favor, preencha todos os campos obrigatórios (Nome, Email, Sexo, Tipo de Cirurgia, Data).');
      return;
    }

    if (!profile?.id) {
      setError('Usuário médico não identificado.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Convert DD/MM/YYYY to YYYY-MM-DD for Supabase
    const dateDigits: string = surgeryDate.replace(/\D/g, '');
    if (dateDigits.length !== 8) {
      setError('Formato de data inválido. Use DD/MM/AAAA.');
      setIsSubmitting(false);
      return;
    }

    const dayNum: number = parseInt(dateDigits.slice(0, 2), 10);
    const monthNum: number = parseInt(dateDigits.slice(2, 4), 10);
    const yearNum: number = parseInt(dateDigits.slice(4, 8), 10);

    const parsedDate: Date = new Date(yearNum, monthNum - 1, dayNum);
    const isValidDate: boolean =
      parsedDate.getFullYear() === yearNum &&
      parsedDate.getMonth() === monthNum - 1 &&
      parsedDate.getDate() === dayNum;

    if (!isValidDate) {
      setError('Data inválida. Verifique o dia, mês e ano informados.');
      setIsSubmitting(false);
      return;
    }

    const formattedDate: string = `${String(yearNum)}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    try {
      await patientService.createPatient({
        name: name.trim(),
        cpf: email.trim(), // legacy: using email field as CPF placeholder
        sex,
        age: '0',
        phone: '',
        surgeryTypeId,
        surgeryDate: formattedDate,
        doctorId: profile.id
      });

      // Success
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error adding patient:', err);
      setError(err.message || 'Ocorreu um erro ao adicionar o paciente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setSex('M');
    setSurgeryTypeId('');
    setStep(1);
    setError(null);
    onClose();
  };

  const selectedSurgeryType = surgeryTypes?.find(t => t.id === surgeryTypeId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">Adicionar Paciente</Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <X color="#9ca3af" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 24 }}>
            <Text className="text-gray-600 mb-6">Por favor, preencha os dados do novo paciente.</Text>

            {error && (
              <View className="bg-red-50 p-3 rounded-lg mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View className="space-y-4">
              <View className="z-10">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Nome:</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 text-gray-900"
                  style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
                  placeholder="Nome completo do paciente..."
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="z-20">
                <Text className="text-sm font-semibold text-gray-700 mb-1">E-mail corporativo/pessoal:</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 text-gray-900"
                  style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
                  placeholder="E-mail para login do paciente..."
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Sex Selector */}
              <View className="z-10">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Sexo:</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    testID="sex-male-button"
                    className={`flex-1 py-3 rounded-lg border items-center ${
                      sex === 'M' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'
                    }`}
                    onPress={() => setSex('M')}
                  >
                    <Text className={`font-medium ${sex === 'M' ? 'text-blue-600' : 'text-gray-500'}`}>
                      Masculino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="sex-female-button"
                    className={`flex-1 py-3 rounded-lg border items-center ${
                      sex === 'F' ? 'bg-pink-50 border-pink-500' : 'bg-gray-50 border-gray-200'
                    }`}
                    onPress={() => setSex('F')}
                  >
                    <Text className={`font-medium ${sex === 'F' ? 'text-pink-600' : 'text-gray-500'}`}>
                      Feminino
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className={showTypePicker ? 'z-50 relative' : 'z-30 relative'}>
                <Text className="text-sm font-semibold text-gray-700 mb-1">Tipo de Cirurgia:</Text>
                <TouchableOpacity
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row justify-between items-center"
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <Text className={selectedSurgeryType ? "text-gray-900" : "text-gray-400"}>
                    {selectedSurgeryType ? selectedSurgeryType.name : "Selecione a cirurgia..."}
                  </Text>
                  <Text className="text-gray-500">▼</Text>
                </TouchableOpacity>

                {showTypePicker && (
                  <View className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 z-50">
                    <ScrollView nestedScrollEnabled className="flex-1">
                      {isLoadingTypes ? (
                        <ActivityIndicator className="p-4" />
                      ) : (
                        surgeryTypes?.map(type => (
                          <TouchableOpacity
                            key={type.id}
                            className="px-4 py-3 border-b border-gray-100"
                            onPress={() => {
                              setSurgeryTypeId(type.id);
                              setShowTypePicker(false);
                            }}
                          >
                            <Text className="text-gray-900">{type.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View className="z-10">
                <Text className="text-sm font-semibold text-gray-700 mb-1">Data da Cirurgia (DD/MM/AAAA):</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 text-gray-900"
                  style={{ fontSize: 16, height: 48, textAlignVertical: 'center' }}
                  placeholder="DD/MM/AAAA"
                  value={surgeryDate}
                  onChangeText={setSurgeryDate}
                />
              </View>

            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-6 border-t border-gray-100 flex-row justify-end space-x-3 gap-3 bg-white">
            <Button
              title="Cancelar"
              variant="outline"
              onPress={handleClose}
              disabled={isSubmitting}
            />
            <Button
              title="Adicionar"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
