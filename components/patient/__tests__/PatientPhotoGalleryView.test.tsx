import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockShowToast = jest.fn();
const mockUsePatientPhotos = jest.fn();
const mockUploadMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockReplaceMutateAsync = jest.fn();

jest.mock('../../../hooks/usePatientPhotos', () => ({
    usePatientPhotos: (...args: any[]) => mockUsePatientPhotos(...args),
    useUploadPhoto: () => ({
        mutateAsync: mockUploadMutateAsync,
        isPending: false,
    }),
    useDeletePhoto: () => ({
        mutateAsync: mockDeleteMutateAsync,
        isPending: false,
    }),
    useReplacePhoto: () => ({
        mutateAsync: mockReplaceMutateAsync,
        isPending: false,
    }),
}));

jest.mock('../../../context/ToastContext', () => ({
    useToast: () => ({
        showToast: mockShowToast,
    }),
}));

import { PatientPhotoGalleryView } from '../PatientPhotoGalleryView';

describe('PatientPhotoGalleryView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePatientPhotos.mockReturnValue({
            data: [],
            isLoading: false,
        });
    });

    it('deve renderizar mensagem de nenhuma foto', () => {
        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));
        expect(screen.getByText('Nenhuma foto adicionada')).toBeTruthy();
    });

    it('deve renderizar texto descritivo para paciente', () => {
        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));
        expect(screen.getByText('Suas fotos aparecerão aqui quando forem adicionadas.')).toBeTruthy();
    });

    it('deve renderizar fotos com thumbnails e header de dia pós-operatório', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-14' }));
        expect(screen.getByTestId('photo-thumbnail-photo-1')).toBeTruthy();
        // Dia 1 = 1 dia após a cirurgia (14 jan)
        expect(screen.getByText(/Dia 1 —/)).toBeTruthy();
    });

    it('deve mostrar botão de excluir para todas as fotos', () => {
        const mockPhotos = [
            {
                id: 'photo-today',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/today.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://url-today',
            },
            {
                id: 'photo-old',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-14',
                storage_path: 'p1/old.jpg',
                created_at: '2026-01-14T10:00:00',
                signedUrl: 'https://url-old',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-13' }));
        // Ambas as fotos devem ter botão de excluir
        expect(screen.getByTestId('delete-photo-photo-today')).toBeTruthy();
        expect(screen.getByTestId('delete-photo-photo-old')).toBeTruthy();
    });

    it('deve mostrar botão de substituir (editar) para todas as fotos', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
            {
                id: 'photo-2',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-14',
                storage_path: 'p1/photo2.jpg',
                created_at: '2026-01-14T10:00:00',
                signedUrl: 'https://signed-url-2',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-13' }));
        expect(screen.getByTestId('replace-photo-photo-1')).toBeTruthy();
        expect(screen.getByTestId('replace-photo-photo-2')).toBeTruthy();
    });

    it('deve mostrar tile de adicionar foto quando dia tem menos de 2 fotos', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-14' }));
        // Dia tem 1 foto, deve mostrar tile de adicionar
        expect(screen.getByTestId('add-photo-day-2026-01-15')).toBeTruthy();
    });

    it('não deve mostrar tile de adicionar quando dia já tem 2 fotos', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
            {
                id: 'photo-2',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo2.jpg',
                created_at: '2026-01-15T11:00:00',
                signedUrl: 'https://signed-url-2',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-14' }));
        // Dia tem 2 fotos, não deve mostrar tile de adicionar
        expect(screen.queryByTestId('add-photo-tile-2026-01-15')).toBeNull();
    });

    it('deve abrir modal fullscreen com contador ao tocar em uma foto', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
            {
                id: 'photo-2',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo2.jpg',
                created_at: '2026-01-15T11:00:00',
                signedUrl: 'https://signed-url-2',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-14' }));

        // Tocar na primeira foto
        fireEvent.press(screen.getByTestId('photo-thumbnail-photo-1'));

        // Deve exibir o contador "1 / 2"
        expect(screen.getByTestId('photo-counter')).toBeTruthy();
        expect(screen.getByText('1 / 2')).toBeTruthy();

        // Deve exibir a lista paginada
        expect(screen.getByTestId('fullscreen-photo-list')).toBeTruthy();
    });

    it('deve fechar modal fullscreen ao pressionar botão fechar', () => {
        const mockPhotos = [
            {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/photo1.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://signed-url-1',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-14' }));

        // Abrir modal
        fireEvent.press(screen.getByTestId('photo-thumbnail-photo-1'));
        expect(screen.getByTestId('photo-counter')).toBeTruthy();

        // Fechar modal
        fireEvent.press(screen.getByTestId('close-fullscreen-photo'));
        expect(screen.queryByTestId('photo-counter')).toBeNull();
    });

    it('deve exibir seções agrupadas por dia pós-operatório', () => {
        const mockPhotos = [
            {
                id: 'photo-d1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-14',
                storage_path: 'p1/d1.jpg',
                created_at: '2026-01-14T10:00:00',
                signedUrl: 'https://url-d1',
            },
            {
                id: 'photo-d2',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15',
                storage_path: 'p1/d2.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://url-d2',
            },
            {
                id: 'photo-d3',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-16',
                storage_path: 'p1/d3.jpg',
                created_at: '2026-01-16T10:00:00',
                signedUrl: 'https://url-d3',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        // Cirurgia em 13/01 → 14/01 = Dia 1, 15/01 = Dia 2, 16/01 = Dia 3
        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1', surgeryDate: '2026-01-13' }));

        expect(screen.getByText(/Dia 1 —/)).toBeTruthy();
        expect(screen.getByText(/Dia 2 —/)).toBeTruthy();
        expect(screen.getByText(/Dia 3 —/)).toBeTruthy();
    });
});
