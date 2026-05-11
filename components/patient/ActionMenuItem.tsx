import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../../constants/colors';

interface ActionMenuItemProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    onPress: () => void;
    iconColor?: string;
    iconBgColor?: string;
    actionLabel?: string;
    badge?: number;
}

export function ActionMenuItem({
    title,
    subtitle,
    icon: Icon,
    onPress,
    iconColor = "#2563eb",
    iconBgColor = "bg-blue-100",
    actionLabel,
    badge,
}: ActionMenuItemProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center bg-white p-4 rounded-xl border border-gray-100 mb-3 active:bg-gray-50"
        >
            <View className={`w-12 h-12 ${iconBgColor} rounded-lg items-center justify-center mr-4`}>
                <Icon size={24} color={iconColor} />
                {badge != null && badge > 0 && (
                    <View
                        testID="notification-badge"
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: AppColors.error.DEFAULT,
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                        }}
                    >
                        <Text style={{ color: AppColors.white, fontSize: 11, fontWeight: '700' }}>
                            {badge > 99 ? '99+' : badge}
                        </Text>
                    </View>
                )}
            </View>

            <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">{title}</Text>
                <Text className="text-gray-500 text-sm">{subtitle}</Text>
            </View>

            {actionLabel ? (
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 font-medium text-xs">{actionLabel}</Text>
                </View>
            ) : (
                <ChevronRight size={20} color="#9ca3af" />
            )}
        </TouchableOpacity>
    );
}

