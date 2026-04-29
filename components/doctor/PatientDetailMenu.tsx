import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';

interface PatientDetailMenuItemProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    onPress: () => void;
    iconColor?: string;
    iconBgColor?: string;
    testID?: string;
}

export function PatientDetailMenuItem({
    title,
    subtitle,
    icon: Icon,
    onPress,
    iconColor = AppColors.primary[700],
    iconBgColor = AppColors.primary[50],
    testID,
}: PatientDetailMenuItemProps) {
    return (
        <TouchableOpacity
            testID={testID}
            onPress={onPress}
            className="flex-row items-center bg-white p-4 rounded-xl border mb-3 active:bg-gray-50"
            style={{ borderColor: AppColors.gray[100] }}
        >
            <View
                className="w-12 h-12 rounded-lg items-center justify-center mr-4"
                style={{ backgroundColor: iconBgColor }}
            >
                <Icon size={24} color={iconColor} />
            </View>

            <View className="flex-1">
                <Text className="font-semibold text-base" style={{ color: AppColors.gray[900] }}>
                    {title}
                </Text>
                <Text className="text-sm" style={{ color: AppColors.gray[500] }}>
                    {subtitle}
                </Text>
            </View>

            <ChevronRight size={20} color={AppColors.gray[400]} />
        </TouchableOpacity>
    );
}
