import { Pencil } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';

export interface PatientProfileData {
    name: string;
    cpf: string;
    sex: string;
    phone: string;
    surgeryType: string;
    surgeryDate: string;
    followUpDays: string;
    status?: string;
    hospital?: string;
}

interface PatientProfileViewProps {
    data: PatientProfileData | null;
    isLoading: boolean;
    onEditPress: () => void;
    isFinalized?: boolean;
}

function DataRow({ label, value }: { label: string; value: string }) {
    return (
        <View
            className="flex-row justify-between py-3 border-b"
            style={{ borderColor: AppColors.gray[100] }}
        >
            <Text className="text-sm" style={{ color: AppColors.gray[500] }}>
                {label}
            </Text>
            <Text
                className="text-sm font-medium"
                style={{ color: AppColors.gray[800], maxWidth: '60%', textAlign: 'right' }}
            >
                {value}
            </Text>
        </View>
    );
}

export function PatientProfileView({
    data,
    isLoading,
    onEditPress,
    isFinalized = false,
}: PatientProfileViewProps) {
    if (isLoading || !data) {
        return (
            <View className="flex-1 justify-center items-center py-20">
                <ActivityIndicator size="large" color={AppColors.primary[700]} />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Patient Info Card */}
            <View className="bg-white rounded-xl p-4 border mb-4" style={{ borderColor: AppColors.gray[100] }}>
                <Text className="text-lg font-bold mb-4" style={{ color: AppColors.gray[900] }}>
                    Dados do Paciente
                </Text>
                <DataRow label="Nome" value={data.name} />
                <DataRow label="CPF" value={data.cpf} />
                <DataRow label="Sexo" value={data.sex === 'M' ? 'Masculino' : 'Feminino'} />
                <DataRow label="Telefone" value={data.phone} />
            </View>

            {/* Surgery Info Card */}
            <View className="bg-white rounded-xl p-4 border mb-4" style={{ borderColor: AppColors.gray[100] }}>
                <Text className="text-lg font-bold mb-4" style={{ color: AppColors.gray[900] }}>
                    Dados do Procedimento
                </Text>
                <DataRow label="Procedimento" value={data.surgeryType} />
                <DataRow label="Data" value={data.surgeryDate} />
                <DataRow label="Acompanhamento" value={`${data.followUpDays} dias`} />
                {data.hospital && (
                    <DataRow label="Hospital" value={data.hospital} />
                )}
                {data.status && (
                    <DataRow
                        label="Status"
                        value={
                            data.status === 'active'
                                ? 'Ativo'
                                : data.status === 'completed'
                                    ? 'Finalizado'
                                    : data.status === 'pending_return'
                                        ? 'Pendente Retorno'
                                        : data.status === 'cancelled'
                                            ? 'Cancelado'
                                            : data.status
                        }
                    />
                )}
            </View>

            {/* Edit Button */}
            <TouchableOpacity
                testID="edit-patient-button"
                className="py-4 rounded-xl items-center mb-6"
                style={{
                    backgroundColor: isFinalized ? AppColors.gray[300] : AppColors.primary[700],
                }}
                onPress={onEditPress}
                disabled={isFinalized}
            >
                <View className="flex-row items-center">
                    <Pencil size={16} color={AppColors.white} />
                    <Text className="text-white font-semibold text-base ml-2">
                        Editar Dados
                    </Text>
                </View>
            </TouchableOpacity>

            {isFinalized && (
                <View
                    className="rounded-xl p-4 mb-4"
                    style={{ backgroundColor: AppColors.warning.light }}
                >
                    <Text className="text-sm text-center" style={{ color: AppColors.warning.dark }}>
                        Este paciente já finalizou o acompanhamento.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}
