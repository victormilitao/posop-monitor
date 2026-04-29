import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { CheckCircle, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';
import { PendingReturnModal } from './PendingReturnModal';

export interface TimelineDay {
    day: number;
    date: Date;
    status: 'pending' | 'completed' | 'missed' | 'future';
    reportId?: string;
    alertSeverity?: 'critical' | 'warning';
}

interface PatientTimelineViewProps {
    timeline: TimelineDay[];
    surgeryTypeName?: string;
    surgeryStatus?: string;
    patientName?: string;
    isLoading: boolean;
    onConfirmReturn: () => void;
    showReturnModal: boolean;
    onOpenReturnModal: () => void;
    onCloseReturnModal: () => void;
    isReturnLoading: boolean;
}

export function PatientTimelineView({
    timeline,
    surgeryTypeName,
    surgeryStatus,
    patientName,
    isLoading,
    onConfirmReturn,
    showReturnModal,
    onOpenReturnModal,
    onCloseReturnModal,
    isReturnLoading,
}: PatientTimelineViewProps) {
    const router = useRouter();

    const handleDayPress = (day: TimelineDay) => {
        if (day.status === 'completed' && day.reportId) {
            router.push({ pathname: '/doctor/report-details/[reportId]', params: { reportId: day.reportId } });
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={AppColors.primary[700]} />
            </View>
        );
    }

    return (
        <View className="flex-1">
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className="text-base" style={{ color: AppColors.gray[500] }}>
                        Acompanhando evolução de {surgeryTypeName || 'cirurgia'}
                    </Text>
                </View>

                {surgeryStatus === 'pending_return' && (
                    <TouchableOpacity
                        className="flex-row items-center justify-between p-4 rounded-xl border mb-4"
                        style={{
                            backgroundColor: AppColors.warning.light,
                            borderColor: '#fed7aa',
                        }}
                        onPress={onOpenReturnModal}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center flex-1">
                            <Clock size={20} color="#f97316" style={{ marginRight: 8 }} />
                            <View className="flex-1">
                                <Text className="font-semibold text-base" style={{ color: '#9a3412' }}>
                                    Pendente Retorno
                                </Text>
                                <Text className="text-sm" style={{ color: '#ea580c' }}>
                                    Toque para confirmar o retorno do paciente
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#f97316" />
                    </TouchableOpacity>
                )}

                {timeline.map((item) => (
                    <TouchableOpacity
                        key={item.day}
                        disabled={item.status !== 'completed'}
                        onPress={() => handleDayPress(item)}
                        className={`mb-4 p-4 rounded-xl border flex-row items-center justify-between ${item.status === 'future' ? 'bg-gray-50 border-gray-100 opacity-60' :
                            item.status === 'pending' ? 'bg-white border-blue-200' :
                                item.status === 'missed' ? 'bg-gray-100 border-gray-200' :
                                    item.alertSeverity === 'critical' ? 'bg-red-50 border-red-200' :
                                        item.alertSeverity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                            'bg-green-50 border-green-200'
                            }`}
                    >
                        <View className="flex-row items-center flex-1">
                            <View className={`w-10 h-10 rounded-full justify-center items-center mr-4 ${item.status === 'pending' ? 'bg-blue-50' :
                                item.status === 'future' ? 'bg-gray-200' :
                                    item.status === 'missed' ? 'bg-gray-300' :
                                        item.alertSeverity === 'critical' ? 'bg-red-100' :
                                            item.alertSeverity === 'warning' ? 'bg-yellow-100' :
                                                'bg-green-100'
                                }`}>
                                <Text className={`font-bold ${item.status === 'pending' ? 'text-blue-500' :
                                    item.status === 'future' ? 'text-gray-500' :
                                        item.status === 'missed' ? 'text-gray-500' :
                                            item.alertSeverity === 'critical' ? 'text-red-700' :
                                                item.alertSeverity === 'warning' ? 'text-yellow-700' :
                                                    'text-green-700'
                                    }`}>{item.day}</Text>
                            </View>

                            <View>
                                <Text className="font-semibold text-lg" style={{ color: AppColors.gray[800] }}>
                                    Dia {item.day}
                                </Text>
                                <Text className="text-sm" style={{ color: AppColors.gray[500] }}>
                                    {format(item.date, "d 'de' MMMM", { locale: ptBR })}
                                </Text>
                            </View>
                        </View>

                        <View>
                            {item.status === 'completed' && (
                                <View className="flex-row items-center">
                                    {item.alertSeverity === 'critical' ? (
                                        <Text className="text-red-600 font-medium mr-2">Crítico</Text>
                                    ) : item.alertSeverity === 'warning' ? (
                                        <Text className="text-yellow-600 font-medium mr-2">Atenção</Text>
                                    ) : (
                                        <>
                                            <Text className="text-green-600 font-medium mr-1">Respondido</Text>
                                            <CheckCircle size={16} color="#16A34A" />
                                        </>
                                    )}
                                    <ChevronRight size={20} color={
                                        item.alertSeverity === 'critical' ? '#DC2626' :
                                            item.alertSeverity === 'warning' ? '#D97706' :
                                                '#16A34A'
                                    } />
                                </View>
                            )}
                            {item.status === 'missed' && (
                                <Text className="text-xs" style={{ color: AppColors.gray[400] }}>Não respondido</Text>
                            )}
                            {item.status === 'pending' && (
                                <Text className="text-blue-500 font-medium text-xs">Aguardando resposta</Text>
                            )}
                            {item.status === 'future' && (
                                <Text className="text-xs" style={{ color: AppColors.gray[300] }}>Futuro</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <PendingReturnModal
                visible={showReturnModal}
                patientName={patientName || ''}
                onConfirm={onConfirmReturn}
                onClose={onCloseReturnModal}
                isLoading={isReturnLoading}
            />
        </View>
    );
}
