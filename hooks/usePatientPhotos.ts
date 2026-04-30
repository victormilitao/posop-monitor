import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { photoService } from '../services';
import { PatientPhoto } from '../services/types';

const photoKeys = {
    all: ['patient-photos'] as const,
    bySurgery: (surgeryId: string) => [...photoKeys.all, 'surgery', surgeryId] as const,
    countByDate: (patientId: string, date: string) => [...photoKeys.all, 'count', patientId, date] as const,
};

/**
 * Hook para buscar fotos de uma cirurgia.
 * Retorna fotos ordenadas da mais antiga para a mais recente.
 */
export function usePatientPhotos(surgeryId: string | undefined) {
    return useQuery({
        queryKey: photoKeys.bySurgery(surgeryId || ''),
        queryFn: () => {
            if (!surgeryId) throw new Error('Surgery ID is required');
            return photoService.getPhotosBySurgeryId(surgeryId);
        },
        enabled: !!surgeryId,
    });
}

/**
 * Hook para contar fotos de um paciente em uma data específica.
 */
export function usePhotosCountByDate(patientId: string | undefined, date: string) {
    return useQuery({
        queryKey: photoKeys.countByDate(patientId || '', date),
        queryFn: () => {
            if (!patientId) throw new Error('Patient ID is required');
            return photoService.getPhotosCountByDate(patientId, date);
        },
        enabled: !!patientId,
    });
}

/**
 * Mutation para upload de foto.
 * Invalida queries relacionadas após sucesso.
 */
export function useUploadPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            patientId,
            surgeryId,
            imageUri,
        }: {
            patientId: string;
            surgeryId: string;
            imageUri: string;
        }) => photoService.uploadPhoto(patientId, surgeryId, imageUri),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: photoKeys.bySurgery(variables.surgeryId),
            });
            queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

/**
 * Mutation para deletar foto.
 * Invalida queries relacionadas após sucesso.
 */
export function useDeletePhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            photoId,
            storagePath,
        }: {
            photoId: string;
            storagePath: string;
            surgeryId: string;
        }) => photoService.deletePhoto(photoId, storagePath),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: photoKeys.bySurgery(variables.surgeryId),
            });
            queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}
