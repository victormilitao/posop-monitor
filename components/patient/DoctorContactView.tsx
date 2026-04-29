import * as Clipboard from 'expo-clipboard';
import { Phone, Stethoscope } from 'lucide-react-native';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useDoctorContact } from '../../hooks/useDoctorContact';

interface DoctorContactViewProps {
    patientId?: string;
}

function DataRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
    return (
        <TouchableOpacity
            disabled={!onPress}
            onPress={onPress}
            className="flex-row justify-between py-3 border-b"
            style={{ borderColor: AppColors.gray[100] }}
        >
            <Text className="text-sm" style={{ color: AppColors.gray[500] }}>{label}</Text>
            <Text
                className="text-sm font-medium"
                style={{
                    color: onPress ? AppColors.primary[500] : AppColors.gray[800],
                    maxWidth: '60%',
                    textAlign: 'right',
                    textDecorationLine: onPress ? 'underline' : 'none',
                }}
            >
                {value}
            </Text>
        </TouchableOpacity>
    );
}

export function DoctorContactView({ patientId }: DoctorContactViewProps) {
    const { data: doctor, isLoading } = useDoctorContact(patientId);

    const handleCopyPhone = async (phoneNumber: string) => {
        await Clipboard.setStringAsync(phoneNumber);
        Alert.alert('Copiado!', `Telefone ${phoneNumber} copiado para a área de transferência.`);
    };

    const handleCallPhone = async (phoneNumber: string) => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        const url = `tel:${cleaned}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            Linking.openURL(url);
        } else {
            Alert.alert('Aviso', 'Não é possível realizar ligações neste dispositivo.');
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center py-20">
                <ActivityIndicator testID="activity-indicator" size="large" color={AppColors.primary[700]} />
            </View>
        );
    }

    if (!doctor) {
        return (
            <View className="flex-1 justify-center items-center py-20">
                <Text style={{ color: AppColors.gray[500] }}>
                    Nenhum médico vinculado encontrado.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Doctor Icon + Name */}
            <View className="items-center mb-6 mt-2">
                <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: AppColors.primary[50] }}
                >
                    <Stethoscope size={32} color={AppColors.primary[700]} />
                </View>
                <Text
                    testID="doctor-name-header"
                    className="text-lg font-bold"
                    style={{ color: AppColors.gray[900] }}
                >
                    {doctor.name}
                </Text>
            </View>

            {/* Data Card */}
            <View
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: AppColors.gray[50] }}
            >
                <DataRow label="Nome" value={doctor.name} />
                <DataRow label="CRM" value={doctor.crm} />
                <DataRow label="E-mail" value={doctor.email} />
                <DataRow
                    label="Telefone"
                    value={doctor.phone}
                    onPress={() => handleCopyPhone(doctor.phone)}
                />
                {doctor.phonePersonal && (
                    <DataRow
                        label="Telefone Pessoal"
                        value={doctor.phonePersonal}
                        onPress={() => handleCopyPhone(doctor.phonePersonal!)}
                    />
                )}
            </View>

            {/* Call Button */}
            {doctor.phone && (
                <TouchableOpacity
                    className="flex-row items-center justify-center py-4 rounded-xl mb-6"
                    style={{ backgroundColor: AppColors.primary[700] }}
                    onPress={() => handleCallPhone(doctor.phone)}
                    testID="call-doctor-button"
                >
                    <Phone size={18} color={AppColors.white} />
                    <Text className="text-white font-semibold text-base ml-2">
                        Ligar para o Médico
                    </Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}
