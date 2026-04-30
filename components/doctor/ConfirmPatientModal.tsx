import { CheckCircle } from 'lucide-react-native';
import { Modal, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { AppColors } from '../../constants/colors';

export interface ConfirmPatientData {
    name: string;
    cpf: string;
    sex: string;
    age?: string;
    phone: string;
    surgeryType: string;
    surgeryDate: string;
    followUpDays: string;
    hospital?: string;
}

interface ConfirmPatientModalProps {
    visible: boolean;
    data: ConfirmPatientData;
    onConfirm: () => void;
    onClose: () => void;
    isLoading?: boolean;
    title?: string;
    confirmLabel?: string;
}

function DataRow({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-row justify-between py-2 border-b" style={{ borderColor: AppColors.gray[100] }}>
            <Text className="text-sm" style={{ color: AppColors.gray[500] }}>{label}</Text>
            <Text className="text-sm font-medium" style={{ color: AppColors.gray[800], maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
        </View>
    );
}

export function ConfirmPatientModal({ visible, data, onConfirm, onClose, isLoading, title = 'Confirmar Cadastro', confirmLabel = 'Confirmar' }: ConfirmPatientModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View className="bg-white rounded-2xl mx-6 p-6 w-11/12 max-w-md shadow-xl">
                    {/* Header */}
                    <View className="items-center mb-4">
                        <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: AppColors.primary[50] }}>
                            <CheckCircle size={28} color={AppColors.primary[700]} />
                        </View>
                        <Text className="text-xl font-bold text-center" style={{ color: AppColors.gray[900] }}>{title}</Text>
                    </View>

                    <Text className="text-center text-sm mb-4" style={{ color: AppColors.gray[500] }}>
                        Confira os dados abaixo antes de confirmar.
                    </Text>

                    {/* Data Summary */}
                    <ScrollView style={{ maxHeight: 300 }}>
                        <View className="rounded-xl p-3" style={{ backgroundColor: AppColors.gray[50] }}>
                            <DataRow label="Nome" value={data.name} />
                            <DataRow label="CPF" value={data.cpf} />
                            <DataRow label="Sexo" value={data.sex === 'M' ? 'Masculino' : 'Feminino'} />
                            {data.age ? <DataRow label="Idade" value={`${data.age} anos`} /> : null}
                            <DataRow label="Telefone" value={data.phone} />
                            <DataRow label="Procedimento" value={data.surgeryType} />
                            <DataRow label="Data" value={data.surgeryDate} />
                            <DataRow label="Acompanhamento" value={`${data.followUpDays} dias`} />
                            {data.hospital ? <DataRow label="Hospital" value={data.hospital} /> : null}
                        </View>
                    </ScrollView>

                    {/* Buttons */}
                    <View className="flex-row gap-3 mt-6">
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-xl border items-center"
                            style={{ borderColor: AppColors.gray[300] }}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text className="font-medium" style={{ color: AppColors.gray[700] }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 py-3 rounded-xl items-center"
                            style={{ backgroundColor: AppColors.primary[700] }}
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            <Text className="text-white font-medium">
                                {isLoading ? 'Salvando...' : confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
