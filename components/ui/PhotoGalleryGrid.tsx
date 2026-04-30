import { Image as ExpoImage } from 'expo-image';
import { ChevronLeft, ChevronRight, ImageOff, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/colors';
import { PatientPhoto } from '../../services/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const GRID_GAP = 8;
const GRID_PADDING = 16;
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / COLUMN_COUNT;
const MAX_PHOTOS_PER_DAY = 2;

interface PhotoGalleryGridProps {
    photos: PatientPhoto[];
    isLoading: boolean;
    canAddPhotos?: boolean;
    canDeletePhotos?: boolean;
    canReplacePhotos?: boolean;
    onAddPhoto?: (photoDate: string) => void;
    onDeletePhoto?: (photo: PatientPhoto) => void;
    onReplacePhoto?: (photo: PatientPhoto) => void;
    isUploading?: boolean;
    surgeryDate?: string;
}

interface PhotoSection {
    date: string;
    dayNumber: number;
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
    canReplacePhotos = false,
    onAddPhoto,
    onDeletePhoto,
    onReplacePhoto,
    isUploading = false,
    surgeryDate,
}: PhotoGalleryGridProps) {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

    // Agrupar fotos por data
    const photosByDate = useMemo(() => {
        const grouped = new Map<string, PatientPhoto[]>();
        for (const photo of photos) {
            const date = photo.photo_date;
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(photo);
        }
        return grouped;
    }, [photos]);

    // Gerar seções para TODOS os dias desde a cirurgia até hoje
    // Para médico (canAddPhotos=false), mostrar apenas dias com fotos
    const sections = useMemo<PhotoSection[]>(() => {
        if (!surgeryDate || !canAddPhotos) {
            // Médico ou sem data: só dias com fotos
            return Array.from(photosByDate.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, datePhotos]) => {
                    const dayNumber = computePostOpDay(date, surgeryDate);
                    return {
                        date,
                        dayNumber,
                        formattedDate: formatDateSectionWithDay(date, dayNumber),
                        photos: datePhotos,
                    };
                });
        }

        // Paciente: gerar todos os dias de cirurgia+1 até hoje
        const surgeryDateClean = surgeryDate.split('T')[0];
        const [sYear, sMonth, sDay] = surgeryDateClean.split('-').map(Number);
        const sDate = new Date(sYear, sMonth - 1, sDay);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSections: PhotoSection[] = [];
        const currentDate = new Date(sDate);
        currentDate.setDate(currentDate.getDate() + 1); // Dia 1 = dia seguinte à cirurgia

        while (currentDate <= today) {
            const dateStr = formatDateToISO(currentDate);
            const dayNumber = computePostOpDay(dateStr, surgeryDate);
            const datePhotos = photosByDate.get(dateStr) ?? [];
            allSections.push({
                date: dateStr,
                dayNumber,
                formattedDate: formatDateSectionWithDay(dateStr, dayNumber),
                photos: datePhotos,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return allSections;
    }, [photosByDate, surgeryDate, canAddPhotos]);

    // Flat list of all photos in display order for swipe navigation
    const allPhotosFlat = useMemo(() => {
        const result: PatientPhoto[] = [];
        for (const section of sections) {
            result.push(...section.photos);
        }
        return result;
    }, [sections]);

    const handlePhotoPress = useCallback((photo: PatientPhoto) => {
        const index = allPhotosFlat.findIndex(p => p.id === photo.id);
        setSelectedPhotoIndex(index >= 0 ? index : null);
    }, [allPhotosFlat]);

    const handleCloseModal = useCallback(() => {
        setSelectedPhotoIndex(null);
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

    if (photos.length === 0 && canAddPhotos && sections.length === 0) {
        return (
            <View className="flex-1">
                <EmptyState isPatient={true} />
            </View>
        );
    }

    return (
        <View className="flex-1">
            <ScrollView
                contentContainerStyle={{ padding: GRID_PADDING }}
                showsVerticalScrollIndicator={false}
            >
                {sections.map((section) => {
                    const canAddToDay = canAddPhotos && onAddPhoto && section.photos.length < MAX_PHOTOS_PER_DAY;

                    return (
                        <View key={section.date} className="mb-4">
                            {/* Date header com botão de adicionar à direita */}
                            <View className="flex-row items-center justify-between mb-2">
                                <Text
                                    className="text-base font-semibold"
                                    style={{ color: AppColors.gray[600] }}
                                >
                                    {section.formattedDate}
                                </Text>

                                {canAddToDay && (
                                    <TouchableOpacity
                                        testID={`add-photo-day-${section.date}`}
                                        onPress={() => onAddPhoto!(section.date)}
                                        disabled={isUploading}
                                        activeOpacity={0.7}
                                        className="rounded-lg items-center justify-center"
                                        style={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: AppColors.gray[100],
                                        }}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator size="small" color={AppColors.primary[700]} />
                                        ) : (
                                            <ImagePlus size={16} color={AppColors.primary[600]} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Photo grid */}
                            {section.photos.length > 0 && (
                                <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                                    {section.photos.map((photo) => (
                                        <PhotoThumbnail
                                            key={photo.id}
                                            photo={photo}
                                            canDelete={canDeletePhotos}
                                            canReplace={canReplacePhotos}
                                            onPress={handlePhotoPress}
                                            onDelete={onDeletePhoto}
                                            onReplace={onReplacePhoto}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Modal de visualização em tela cheia */}
            <FullScreenPhotoModal
                photos={allPhotosFlat}
                initialIndex={selectedPhotoIndex}
                onClose={handleCloseModal}
                surgeryDate={surgeryDate}
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
    canReplace: boolean;
    onPress: (photo: PatientPhoto) => void;
    onDelete?: (photo: PatientPhoto) => void;
    onReplace?: (photo: PatientPhoto) => void;
}

function PhotoThumbnail({ photo, canDelete, canReplace, onPress, onDelete, onReplace }: PhotoThumbnailProps) {
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

            {/* Botão de editar (substituir) — canto superior esquerdo */}
            {canReplace && onReplace && (
                <TouchableOpacity
                    testID={`replace-photo-${photo.id}`}
                    onPress={() => onReplace(photo)}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                >
                    <Pencil size={14} color={AppColors.white} />
                </TouchableOpacity>
            )}

            {/* Botão de deletar — canto superior direito */}
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
                    ? 'Suas fotos aparecerão aqui quando forem adicionadas.'
                    : 'As fotos do paciente aparecerão aqui quando forem adicionadas.'
                }
            </Text>
        </View>
    );
}

// ============================================================
// Full Screen Photo Modal
// ============================================================

interface FullScreenPhotoModalProps {
    photos: PatientPhoto[];
    initialIndex: number | null;
    onClose: () => void;
    surgeryDate?: string;
}

function FullScreenPhotoModal({ photos, initialIndex, onClose, surgeryDate }: FullScreenPhotoModalProps) {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList<PatientPhoto>>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);

    const isVisible = initialIndex !== null && photos.length > 0;

    // Sync currentIndex when modal opens with a new initialIndex
    React.useEffect(() => {
        if (initialIndex !== null) {
            setCurrentIndex(initialIndex);
        }
    }, [initialIndex]);

    const handleMomentumEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / SCREEN_WIDTH);
            setCurrentIndex(index);
        },
        []
    );

    const currentPhoto = isVisible ? photos[currentIndex] : null;

    const renderItem = useCallback(
        ({ item }: { item: PatientPhoto }) => (
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
                key={item.id}
            >
                {item.signedUrl ? (
                    <ExpoImage
                        source={{ uri: item.signedUrl }}
                        style={{
                            width: SCREEN_WIDTH,
                            height: SCREEN_HEIGHT * 0.75,
                        }}
                        contentFit="contain"
                        transition={300}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <ImageOff size={48} color={AppColors.gray[400]} />
                    </View>
                )}
            </ScrollView>
        ),
        []
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
        }),
        []
    );

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
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
                    <View className="flex-1">
                        {currentPhoto && (
                            <Text className="text-sm" style={{ color: AppColors.gray[300] }}>
                                {formatDateSectionWithDay(currentPhoto.photo_date, computePostOpDay(currentPhoto.photo_date, surgeryDate))}
                            </Text>
                        )}
                    </View>
                    {/* Counter */}
                    <Text
                        testID="photo-counter"
                        className="text-sm font-semibold"
                        style={{ color: AppColors.white }}
                    >
                        {currentIndex + 1} / {photos.length}
                    </Text>
                    <View className="flex-1 items-end">
                        <TouchableOpacity
                            testID="close-fullscreen-photo"
                            onPress={onClose}
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                        >
                            <X size={20} color={AppColors.white} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Horizontal paging gallery */}
                <FlatList
                    ref={flatListRef}
                    testID="fullscreen-photo-list"
                    data={photos}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex ?? 0}
                    getItemLayout={getItemLayout}
                    onMomentumScrollEnd={handleMomentumEnd}
                    bounces={false}
                />
            </View>
        </Modal>
    );
}

// ============================================================
// Helpers
// ============================================================

/**
 * Formata um Date para string ISO YYYY-MM-DD usando componentes locais.
 */
function formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calcula o dia pós-operatório (1-indexed) com base na data da foto e da cirurgia.
 * Dia 1 = dia seguinte à cirurgia.
 * Retorna 0 se surgeryDate não estiver disponível.
 */
function computePostOpDay(photoDateStr: string, surgeryDate?: string): number {
    if (!surgeryDate) return 0;
    const [pYear, pMonth, pDay] = photoDateStr.split('-').map(Number);
    const photoDate = new Date(pYear, pMonth - 1, pDay);

    const surgeryDateClean = surgeryDate.split('T')[0];
    const [sYear, sMonth, sDay] = surgeryDateClean.split('-').map(Number);
    const sDate = new Date(sYear, sMonth - 1, sDay);

    const diffMs = photoDate.getTime() - sDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays; // dia 0 = dia da cirurgia, dia 1 = primeiro dia pós-op
}

/**
 * Formata o header de seção com o dia pós-operatório.
 * Ex: "Dia 1 — 15 de janeiro" ou fallback para data formatada se dia não disponível.
 */
function formatDateSectionWithDay(dateStr: string, dayNumber: number): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
    });

    if (dayNumber > 0) {
        return `Dia ${dayNumber} — ${formattedDate}`;
    }

    if (dayNumber === 0) {
        return `Dia da cirurgia — ${formattedDate}`;
    }

    // fallback: sem surgeryDate ou data anterior à cirurgia
    return formattedDate;
}
