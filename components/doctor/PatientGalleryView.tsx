import React from 'react';
import { PhotoGalleryGrid } from '../ui/PhotoGalleryGrid';
import { usePatientPhotos } from '../../hooks/usePatientPhotos';

interface PatientGalleryViewProps {
    surgeryId: string | undefined;
    surgeryDate?: string;
}

/**
 * Visão da galeria de fotos na tela do médico.
 * Somente visualização (read-only), sem possibilidade de adicionar ou deletar.
 */
export function PatientGalleryView({ surgeryId, surgeryDate }: PatientGalleryViewProps) {
    const { data: photos = [], isLoading } = usePatientPhotos(surgeryId);

    return (
        <PhotoGalleryGrid
            photos={photos}
            isLoading={isLoading}
            canAddPhotos={false}
            canDeletePhotos={false}
            surgeryDate={surgeryDate}
        />
    );
}
