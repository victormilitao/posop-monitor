import { Image as ExpoImage } from 'expo-image';
import { ImageOff, Plus, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';
import { PatientPhoto } from '../../services/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 8;
const GRID_PADDING = 16;
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;

interface PhotoGalleryGridProps {
    photos: PatientPhoto[];
    isLoading: boolean;
    canAddPhotos?: boolean;
    canDeletePhotos?: boolean;
    todayDateString?: string;
    onAddPhoto?: () => void;
    onDeletePhoto?: (photo: PatientPhoto) => void;
    isUploading?: boolean;
}

interface PhotoSection {
    date: string;
    formattedDate: string;
    photos: PatientPhoto[];
}

/**
 * Componente compartilhado de galeria de fotos.
 * Usado tanto na visão do paciente quanto na do médico.
 * 
 * - Grid de 2 colunas
 * - Agrupado por data
 * - Ordenado da mais antiga (topo) para a mais recente (fundo)
 * - Tela cheia com zoom ao tocar na foto
 */
export function PhotoGalleryGrid({
    photos,
    isLoading,
    canAddPhotos = false,
    canDeletePhotos = false,
    todayDateString,
    onAddPhoto,
    onDeletePhoto,
    isUploading = false,
}: PhotoGalleryGridProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<PatientPhoto | null>(null);

    // Agrupar fotos por data
    const sections = useMemo<PhotoSection[]>(() => {
        const grouped = new Map<string, PatientPhoto[]>();
        for (const photo of photos) {
            const date = photo.photo_date;
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(photo);
        }

        return Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b)) // mais antiga primeiro
            .map(([date, datePhotos]) => ({
                date,
                formattedDate: formatDateSection(date),
                photos: datePhotos,
            }));
    }, [photos]);

    const handlePhotoPress = useCallback((photo: PatientPhoto) => {
        setSelectedPhoto(photo);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedPhoto(null);
    }, []);

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={AppColors.primary[700]} />
            </View>
        );
    }

    if (photos.length === 0 && !canAddPhotos) {
        return <EmptyState isPatient={false} />;
    }

    if (photos.length === 0 && canAddPhotos) {
        return (
            <View className="flex-1">
                <EmptyState isPatient={true} />
                {canAddPhotos && onAddPhoto && (
                    <View className="px-4 pb-6">
                        <AddPhotoButton onPress={onAddPhoto} isUploading={isUploading} />
                    </View>
                )}
            </View>
        );
    }

    return (
        <View className="flex-1">
            <ScrollView
                contentContainerStyle={{ padding: GRID_PADDING, paddingBottom: canAddPhotos ? 100 : GRID_PADDING }}
                showsVerticalScrollIndicator={false}
            >
                {sections.map((section) => (
                    <View key={section.date} className="mb-4">
                        {/* Date header */}
                        <Text
                            className="text-sm font-semibold mb-2"
                            style={{ color: AppColors.gray[600] }}
                        >
                            {section.formattedDate}
                        </Text>

                        {/* Photo grid */}
                        <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                            {section.photos.map((photo) => (
                                <PhotoThumbnail
                                    key={photo.id}
                                    photo={photo}
                                    canDelete={canDeletePhotos && photo.photo_date === todayDateString}
                                    onPress={handlePhotoPress}
                                    onDelete={onDeletePhoto}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Botão flutuante de adicionar foto */}
            {canAddPhotos && onAddPhoto && (
                <View
                    className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3"
                    style={{ backgroundColor: AppColors.white }}
                >
                    <AddPhotoButton onPress={onAddPhoto} isUploading={isUploading} />
                </View>
            )}

            {/* Modal de visualização em tela cheia */}
            <FullScreenPhotoModal
                photo={selectedPhoto}
                onClose={handleCloseModal}
            />
        </View>
    );
}

// ============================================================
// Sub-components
// ============================================================

interface PhotoThumbnailProps {
    photo: PatientPhoto;
    canDelete: boolean;
    onPress: (photo: PatientPhoto) => void;
    onDelete?: (photo: PatientPhoto) => void;
}

function PhotoThumbnail({ photo, canDelete, onPress, onDelete }: PhotoThumbnailProps) {
    return (
        <View style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}>
            <TouchableOpacity
                testID={`photo-thumbnail-${photo.id}`}
                onPress={() => onPress(photo)}
                activeOpacity={0.8}
                className="flex-1 rounded-xl overflow-hidden"
                style={{ backgroundColor: AppColors.gray[100] }}
            >
                {photo.signedUrl ? (
                    <ExpoImage
                        source={{ uri: photo.signedUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <ImageOff size={24} color={AppColors.gray[400]} />
                    </View>
                )}
            </TouchableOpacity>

            {canDelete && onDelete && (
                <TouchableOpacity
                    testID={`delete-photo-${photo.id}`}
                    onPress={() => onDelete(photo)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                >
                    <Trash2 size={14} color={AppColors.white} />
                </TouchableOpacity>
            )}
        </View>
    );
}

interface AddPhotoButtonProps {
    onPress: () => void;
    isUploading: boolean;
}

function AddPhotoButton({ onPress, isUploading }: AddPhotoButtonProps) {
    return (
        <TouchableOpacity
            testID="add-photo-button"
            onPress={onPress}
            disabled={isUploading}
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{
                backgroundColor: isUploading ? AppColors.gray[200] : AppColors.primary[700],
            }}
        >
            {isUploading ? (
                <>
                    <ActivityIndicator size="small" color={AppColors.white} />
                    <Text className="text-white font-semibold ml-2">Enviando...</Text>
                </>
            ) : (
                <>
                    <Plus size={20} color={AppColors.white} />
                    <Text className="text-white font-semibold ml-2">Adicionar Foto</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

interface EmptyStateProps {
    isPatient: boolean;
}

function EmptyState({ isPatient }: EmptyStateProps) {
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
                {isPatient
                    ? 'Toque no botão abaixo para adicionar sua primeira foto.'
                    : 'As fotos do paciente aparecerão aqui quando forem adicionadas.'
                }
            </Text>
        </View>
    );
}

interface FullScreenPhotoModalProps {
    photo: PatientPhoto | null;
    onClose: () => void;
}

function FullScreenPhotoModal({ photo, onClose }: FullScreenPhotoModalProps) {
    const insets = useSafeAreaInsets();

    if (!photo) return null;

    return (
        <Modal
            visible={!!photo}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
                {/* Header */}
                <View
                    className="flex-row items-center justify-between px-4 py-3"
                    style={{ paddingTop: insets.top + 8 }}
                >
                    <Text className="text-white text-sm">
                        {formatDateSection(photo.photo_date)}
                    </Text>
                    <TouchableOpacity
                        testID="close-fullscreen-photo"
                        onPress={onClose}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    >
                        <X size={20} color={AppColors.white} />
                    </TouchableOpacity>
                </View>

                {/* Image with zoom via ScrollView */}
                <ScrollView
                    contentContainerStyle={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    maximumZoomScale={4}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    bouncesZoom
                >
                    {photo.signedUrl && (
                        <ExpoImage
                            source={{ uri: photo.signedUrl }}
                            style={{
                                width: SCREEN_WIDTH,
                                height: SCREEN_WIDTH,
                            }}
                            contentFit="contain"
                            transition={300}
                        />
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

// ============================================================
// Helpers
// ============================================================

/**
 * Formata uma data YYYY-MM-DD para exibição como header de seção.
 */
function formatDateSection(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
        return 'Hoje';
    }
    if (date.getTime() === yesterday.getTime()) {
        return 'Ontem';
    }

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}
