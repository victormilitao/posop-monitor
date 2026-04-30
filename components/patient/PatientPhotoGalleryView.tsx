import * as ImagePicker from 'expo-image-picker';
import React, { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform, View } from 'react-native';
import { PhotoGalleryGrid } from '../ui/PhotoGalleryGrid';
import { useToast } from '../../context/ToastContext';
import { useDeletePhoto, usePatientPhotos, useUploadPhoto } from '../../hooks/usePatientPhotos';
import { getLocalDateString } from '../../lib/imageUtils';
import { PatientPhoto } from '../../services/types';

const MAX_PHOTOS_PER_DAY = 2;

interface PatientPhotoGalleryViewProps {
    patientId: string | undefined;
    surgeryId: string | undefined;
}

/**
 * Visão da galeria de fotos do paciente.
 * Permite adicionar fotos (câmera ou galeria) e deletar fotos do dia vigente.
 */
export function PatientPhotoGalleryView({ patientId, surgeryId }: PatientPhotoGalleryViewProps) {
    const { showToast } = useToast();
    const { data: photos = [], isLoading } = usePatientPhotos(surgeryId);
    const uploadPhoto = useUploadPhoto();
    const deletePhoto = useDeletePhoto();

    const todayDateString = getLocalDateString();

    // Contar fotos de hoje localmente (evita query extra)
    const todayPhotosCount = photos.filter(p => p.photo_date === todayDateString).length;

    const handlePickImage = useCallback(async (source: 'camera' | 'gallery') => {
        if (!patientId || !surgeryId) return;

        // Verificar limite
        if (todayPhotosCount >= MAX_PHOTOS_PER_DAY) {
            showToast({
                type: 'info',
                title: 'Limite atingido',
                message: `Você já adicionou ${MAX_PHOTOS_PER_DAY} fotos hoje.`,
            });
            return;
        }

        try {
            let result: ImagePicker.ImagePickerResult;

            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    showToast({
                        type: 'error',
                        title: 'Permissão necessária',
                        message: 'Permita o acesso à câmera nas configurações.',
                    });
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 1, // Qualidade total, a compressão é feita depois
                    allowsEditing: false,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    showToast({
                        type: 'error',
                        title: 'Permissão necessária',
                        message: 'Permita o acesso à galeria nas configurações.',
                    });
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 1,
                    allowsEditing: false,
                });
            }

            if (result.canceled || !result.assets?.[0]) return;

            await uploadPhoto.mutateAsync({
                patientId,
                surgeryId,
                imageUri: result.assets[0].uri,
            });

            showToast({
                type: 'success',
                title: 'Foto enviada',
                message: 'Sua foto foi adicionada com sucesso.',
            });
        } catch (error) {
            console.error('Error uploading photo:', error);
            showToast({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível enviar a foto. Tente novamente.',
            });
        }
    }, [patientId, surgeryId, todayPhotosCount, showToast, uploadPhoto]);

    const handleAddPhoto = useCallback(() => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handlePickImage('camera');
                    else if (buttonIndex === 2) handlePickImage('gallery');
                }
            );
        } else {
            Alert.alert(
                'Adicionar Foto',
                'Como deseja adicionar a foto?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tirar Foto', onPress: () => handlePickImage('camera') },
                    { text: 'Galeria', onPress: () => handlePickImage('gallery') },
                ]
            );
        }
    }, [handlePickImage]);

    const handleDeletePhoto = useCallback(async (photo: PatientPhoto) => {
        if (!surgeryId) return;

        Alert.alert(
            'Excluir Foto',
            'Tem certeza que deseja excluir esta foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePhoto.mutateAsync({
                                photoId: photo.id,
                                storagePath: photo.storage_path,
                                surgeryId,
                            });
                            showToast({
                                type: 'success',
                                title: 'Foto excluída',
                                message: 'A foto foi removida com sucesso.',
                            });
                        } catch (error) {
                            console.error('Error deleting photo:', error);
                            showToast({
                                type: 'error',
                                title: 'Erro',
                                message: 'Não foi possível excluir a foto.',
                            });
                        }
                    },
                },
            ]
        );
    }, [surgeryId, deletePhoto, showToast]);

    return (
        <PhotoGalleryGrid
            photos={photos}
            isLoading={isLoading}
            canAddPhotos={true}
            canDeletePhotos={true}
            todayDateString={todayDateString}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            isUploading={uploadPhoto.isPending}
        />
    );
}
