import { FileText, ChevronRight, Calendar, CheckCircle } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../ui/Card';
import { AppColors } from '../../constants/colors';

interface MedicalRecordListItemProps {
    name: string;
    surgeryType: string;
    surgeryDate: string;
    completedDate: string;
    totalDays: number;
    sex?: string | null;
    onPress: () => void;
}

export function MedicalRecordListItem({
    name,
    surgeryType,
    surgeryDate,
    completedDate,
    totalDays,
    sex,
    onPress,
}: MedicalRecordListItemProps) {
    return (
        <TouchableOpacity onPress={onPress} testID="medical-record-item">
            <Card className="mb-3 border-l-4" style={{ borderLeftColor: AppColors.info.DEFAULT }}>
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center flex-1">
                        <FileText
                            size={20}
                            color={AppColors.info.DEFAULT}
                            style={{ marginRight: 6 }}
                        />
                        <View className="flex-1">
                            <Text className="text-gray-900 font-bold text-lg">{name}</Text>
                            <Text className="text-gray-500 text-sm" numberOfLines={1}>
                                <Text className="font-bold">Cirurgia:</Text> {surgeryType}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={{ backgroundColor: AppColors.info.light }}
                        className="px-2 py-1 rounded-full"
                    >
                        <Text style={{ color: AppColors.info.dark }} className="text-xs font-medium">
                            Prontuário
                        </Text>
                    </View>
                </View>

                <View className="bg-gray-50 p-2 rounded-lg">
                    <View className="flex-row items-center mb-1">
                        <Calendar size={12} color={AppColors.gray[500]} style={{ marginRight: 4 }} />
                        <Text className="text-gray-600 text-xs">
                            <Text className="font-bold">Data da Cirurgia:</Text> {surgeryDate}
                        </Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                        <CheckCircle size={12} color={AppColors.success.DEFAULT} style={{ marginRight: 4 }} />
                        <Text className="text-gray-600 text-xs">
                            <Text className="font-bold">Finalizado em:</Text> {completedDate}
                        </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                        {totalDays} dias de acompanhamento
                    </Text>
                </View>

                <View className="flex-row justify-end items-center mt-2">
                    <Text className="text-xs mr-1" style={{ color: AppColors.info.DEFAULT }}>
                        Ver detalhes
                    </Text>
                    <ChevronRight size={14} color={AppColors.info.DEFAULT} />
                </View>
            </Card>
        </TouchableOpacity>
    );
}
