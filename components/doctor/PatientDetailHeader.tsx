import { ArrowLeft } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';

interface PatientDetailHeaderProps {
    patientName: string;
    surgeryType: string;
    surgeryDate: string;
    onBackPress: () => void;
}

export function PatientDetailHeader({
    patientName,
    surgeryType,
    surgeryDate,
    onBackPress,
}: PatientDetailHeaderProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{
                backgroundColor: AppColors.primary[700],
                paddingTop: insets.top,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
            }}
        >
            <View className="px-5 pb-5 pt-3">
                {/* Top row: back button + patient name */}
                <View className="flex-row items-center mb-3">
                    <TouchableOpacity
                        testID="back-button"
                        onPress={onBackPress}
                        className="p-1 mr-3"
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <ArrowLeft size={24} color={AppColors.white} />
                    </TouchableOpacity>
                    <Text
                        testID="patient-name"
                        className="text-xl font-bold flex-1"
                        style={{ color: AppColors.white }}
                        numberOfLines={1}
                    >
                        {patientName}
                    </Text>
                </View>

                {/* Surgery info rows */}
                <View className="flex-row justify-between mb-1">
                    <Text
                        testID="surgery-label"
                        className="font-medium"
                        style={{ color: AppColors.primary[200] }}
                    >
                        Cirurgia:
                    </Text>
                    <Text
                        testID="surgery-type"
                        className="font-semibold flex-1 text-right ml-2"
                        style={{ color: AppColors.white }}
                    >
                        {surgeryType}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text
                        testID="date-label"
                        className="font-medium"
                        style={{ color: AppColors.primary[200] }}
                    >
                        Data:
                    </Text>
                    <Text
                        testID="surgery-date"
                        className="font-semibold"
                        style={{ color: AppColors.white }}
                    >
                        {surgeryDate}
                    </Text>
                </View>
            </View>
        </View>
    );
}
