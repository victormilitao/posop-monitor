import * as Clipboard from 'expo-clipboard';
import { Phone, Stethoscope } from 'lucide-react-native';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useDoctorContact } from '../../hooks/useDoctorContact';

interface DoctorContactViewProps {
    patientId?: string;
    isCriticalAlert?: boolean;
}

function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

export function DoctorContactView({ patientId, isCriticalAlert }: DoctorContactViewProps) {
    const { data: doctor, isLoading } = useDoctorContact(patientId);

    const handleCopyPhone = async (phoneNumber: string) => {
        const formatted = formatPhone(phoneNumber);
        await Clipboard.setStringAsync(phoneNumber);
        Alert.alert('Copiado!', `Telefone ${formatted} copiado para a área de transferência.`);
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

    // Determine which phone to use for calling: prefer surgery-level contacts, fallback to doctor profile
    const primaryCallPhone = doctor.contactPhone || doctor.contactPhoneBusiness || doctor.phone;

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
                {doctor.hospital && (
                    <DataRow label="Hospital" value={doctor.hospital} />
                )}
                {doctor.contactPhone && (
                    <DataRow
                        label="Contato Pessoal"
                        value={formatPhone(doctor.contactPhone)}
                        onPress={() => handleCopyPhone(doctor.contactPhone!)}
                    />
                )}
                {doctor.contactPhoneBusiness && (
                    <DataRow
                        label="Contato Empresarial"
                        value={formatPhone(doctor.contactPhoneBusiness)}
                        onPress={() => handleCopyPhone(doctor.contactPhoneBusiness!)}
                    />
                )}
            </View>

            {/* Call Button - only shown when patient has critical alert */}
            {isCriticalAlert && primaryCallPhone && (
                <TouchableOpacity
                    className="flex-row items-center justify-center py-4 rounded-xl mb-6"
                    style={{ backgroundColor: AppColors.primary[700] }}
                    onPress={() => handleCallPhone(primaryCallPhone)}
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
