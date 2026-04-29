import { ImageOff } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AppColors } from '../../constants/colors';

export function PatientPhotoGalleryView() {
    return (
        <View className="flex-1 justify-center items-center px-6">
            <View
                className="w-20 h-20 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: AppColors.gray[100] }}
            >
                <ImageOff size={36} color={AppColors.gray[400]} />
            </View>
            <Text className="text-lg font-semibold mb-2" style={{ color: AppColors.gray[700] }}>
                Nenhuma foto adicionada
            </Text>
            <Text className="text-sm text-center" style={{ color: AppColors.gray[400] }}>
                Suas fotos aparecerão aqui quando forem adicionadas pelo médico.
            </Text>
        </View>
    );
}
