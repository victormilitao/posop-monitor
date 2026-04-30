import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { PhotoGalleryGrid } from '../ui/PhotoGalleryGrid';
import { useToast } from '../../context/ToastContext';
import { useDeletePhoto, usePatientPhotos, useReplacePhoto, useUploadPhoto } from '../../hooks/usePatientPhotos';
import { PatientPhoto } from '../../services/types';

interface PatientPhotoGalleryViewProps {
    patientId: string | undefined;
    surgeryId: string | undefined;
    surgeryDate?: string;
}

/**
 * Visão da galeria de fotos do paciente.
 * Permite adicionar fotos a qualquer dia pós-operatório (passado ou atual),
 * substituir fotos existentes e deletar fotos de qualquer dia.
 */
export function PatientPhotoGalleryView({ patientId, surgeryId, surgeryDate }: PatientPhotoGalleryViewProps) {
    const { showToast } = useToast();
    const { data: photos = [], isLoading } = usePatientPhotos(surgeryId);
    const uploadPhoto = useUploadPhoto();
    const deletePhoto = useDeletePhoto();
    const replacePhoto = useReplacePhoto();

    // Estado para controlar a ação pendente (usado em "replace" para saber qual foto substituir)
    const [pendingReplace, setPendingReplace] = useState<PatientPhoto | null>(null);

    /**
     * Seleciona imagem da câmera ou galeria e faz upload.
     */
    const handlePickAndUpload = useCallback(async (source: 'camera' | 'gallery', photoDate: string) => {
        if (!patientId || !surgeryId) return;

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
                    quality: 1,
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
                photoDate,
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
    }, [patientId, surgeryId, showToast, uploadPhoto]);

    /**
     * Seleciona imagem e substitui uma foto existente.
     */
    const handlePickAndReplace = useCallback(async (source: 'camera' | 'gallery', photo: PatientPhoto) => {
        if (!patientId || !surgeryId) return;

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
                    quality: 1,
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

            await replacePhoto.mutateAsync({
                photoId: photo.id,
                patientId,
                oldStoragePath: photo.storage_path,
                imageUri: result.assets[0].uri,
                surgeryId,
            });

            showToast({
                type: 'success',
                title: 'Foto substituída',
                message: 'A foto foi atualizada com sucesso.',
            });
        } catch (error) {
            console.error('Error replacing photo:', error);
            showToast({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível substituir a foto. Tente novamente.',
            });
        } finally {
            setPendingReplace(null);
        }
    }, [patientId, surgeryId, showToast, replacePhoto]);

    /**
     * Abre o picker de câmera/galeria para adicionar foto no dia selecionado.
     */
    const handleAddPhoto = useCallback((photoDate: string) => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handlePickAndUpload('camera', photoDate);
                    else if (buttonIndex === 2) handlePickAndUpload('gallery', photoDate);
                }
            );
        } else {
            Alert.alert(
                'Adicionar Foto',
                'Como deseja adicionar a foto?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tirar Foto', onPress: () => handlePickAndUpload('camera', photoDate) },
                    { text: 'Galeria', onPress: () => handlePickAndUpload('gallery', photoDate) },
                ]
            );
        }
    }, [handlePickAndUpload]);

    /**
     * Abre o picker de câmera/galeria para substituir uma foto existente.
     */
    const handleReplacePhoto = useCallback((photo: PatientPhoto) => {
        setPendingReplace(photo);

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) handlePickAndReplace('camera', photo);
                    else if (buttonIndex === 2) handlePickAndReplace('gallery', photo);
                    else setPendingReplace(null);
                }
            );
        } else {
            Alert.alert(
                'Substituir Foto',
                'Como deseja substituir a foto?',
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setPendingReplace(null) },
                    { text: 'Tirar Foto', onPress: () => handlePickAndReplace('camera', photo) },
                    { text: 'Galeria', onPress: () => handlePickAndReplace('gallery', photo) },
                ]
            );
        }
    }, [handlePickAndReplace]);

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
            canReplacePhotos={true}
            onAddPhoto={handleAddPhoto}
            onDeletePhoto={handleDeletePhoto}
            onReplacePhoto={handleReplacePhoto}
            isUploading={uploadPhoto.isPending || replacePhoto.isPending}
            surgeryDate={surgeryDate}
        />
    );
}
