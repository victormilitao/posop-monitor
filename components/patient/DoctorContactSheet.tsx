import { Phone, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { useDoctorContact } from '../../hooks/useDoctorContact';

interface DoctorContactSheetProps {
    visible: boolean;
    onClose: () => void;
    patientId?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

function DataRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
    const content = (
        <View className="flex-row justify-between py-3 border-b" style={{ borderColor: AppColors.gray[100] }}>
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
        </View>
    );

    if (onPress) {
        return <Pressable onPress={onPress}>{content}</Pressable>;
    }

    return content;
}

export function DoctorContactSheet({ visible, onClose, patientId }: DoctorContactSheetProps) {
    const [mounted, setMounted] = useState(false);
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const { data: doctor, isLoading } = useDoctorContact(patientId);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SHEET_HEIGHT,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setMounted(false));
        }
    }, [visible]);

    const handlePhonePress = (phoneNumber: string) => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        Linking.openURL(`tel:${cleaned}`);
    };

    if (!mounted) return null;

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
            {/* Backdrop */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    opacity: backdropOpacity,
                }}
            >
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    height: SHEET_HEIGHT,
                    backgroundColor: AppColors.white,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingTop: 8,
                    paddingBottom: 32,
                    transform: [{ translateY }],
                }}
            >
                {/* Header Handle */}
                <View className="items-center mb-4">
                    <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: AppColors.gray[200] }} />
                </View>

                {/* Header Content */}
                <View className="flex-row justify-between items-start px-6 mb-6">
                    <View className="flex-1">
                        <Text className="text-2xl font-bold mb-1" style={{ color: AppColors.gray[900] }}>
                            Contato Médico
                        </Text>
                        <Text className="text-base" style={{ color: AppColors.gray[500] }}>
                            Informações do seu médico responsável
                        </Text>
                    </View>
                    <Pressable
                        onPress={onClose}
                        className="p-2 -mr-2 -mt-2 rounded-full"
                        style={{ backgroundColor: AppColors.gray[100] }}
                        testID="close-doctor-contact-sheet"
                    >
                        <X size={20} color={AppColors.gray[500]} />
                    </Pressable>
                </View>

                {/* Content */}
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-6">
                        {isLoading ? (
                            <View className="py-12 items-center">
                                <ActivityIndicator size="large" color={AppColors.primary[700]} />
                                <Text className="mt-4" style={{ color: AppColors.gray[500] }}>
                                    Carregando dados do médico...
                                </Text>
                            </View>
                        ) : !doctor ? (
                            <View className="py-12 items-center">
                                <Text style={{ color: AppColors.gray[500] }}>
                                    Nenhum médico vinculado encontrado.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Doctor Info Card */}
                                <View
                                    className="bg-white rounded-xl p-4 border mb-4"
                                    style={{ borderColor: AppColors.gray[100] }}
                                >
                                    <Text className="text-lg font-bold mb-4" style={{ color: AppColors.gray[900] }}>
                                        Dados do Médico
                                    </Text>
                                    <DataRow label="Nome" value={doctor.name} />
                                    <DataRow label="CRM" value={doctor.crm} />
                                </View>

                                {/* Contact Info Card */}
                                <View
                                    className="bg-white rounded-xl p-4 border mb-4"
                                    style={{ borderColor: AppColors.gray[100] }}
                                >
                                    <Text className="text-lg font-bold mb-4" style={{ color: AppColors.gray[900] }}>
                                        Contato
                                    </Text>
                                    <DataRow label="E-mail" value={doctor.email} />
                                    <DataRow
                                        label="Telefone"
                                        value={doctor.phone}
                                        onPress={() => handlePhonePress(doctor.phone)}
                                    />
                                    {doctor.phonePersonal && (
                                        <DataRow
                                            label="Telefone Pessoal"
                                            value={doctor.phonePersonal}
                                            onPress={() => handlePhonePress(doctor.phonePersonal!)}
                                        />
                                    )}
                                </View>

                                {/* Call Button */}
                                {doctor.phone && (
                                    <Pressable
                                        className="flex-row items-center justify-center py-4 rounded-xl"
                                        style={{ backgroundColor: AppColors.primary[700] }}
                                        onPress={() => handlePhonePress(doctor.phone)}
                                        testID="call-doctor-button"
                                    >
                                        <Phone size={18} color={AppColors.white} />
                                        <Text className="text-white font-semibold text-base ml-2">
                                            Ligar para o Médico
                                        </Text>
                                    </Pressable>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
}
