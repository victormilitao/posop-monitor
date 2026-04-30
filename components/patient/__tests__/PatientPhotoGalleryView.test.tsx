import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockShowToast = jest.fn();
const mockUsePatientPhotos = jest.fn();
const mockUploadMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();

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
}));

jest.mock('../../../context/ToastContext', () => ({
    useToast: () => ({
        showToast: mockShowToast,
    }),
}));

jest.mock('../../../lib/imageUtils', () => ({
    getLocalDateString: () => '2026-01-15',
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
        expect(screen.getByText('Toque no botão abaixo para adicionar sua primeira foto.')).toBeTruthy();
    });

    it('deve renderizar botão de adicionar foto', () => {
        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));
        expect(screen.getByTestId('add-photo-button')).toBeTruthy();
    });

    it('deve renderizar fotos com thumbnails', () => {
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

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));
        expect(screen.getByTestId('photo-thumbnail-photo-1')).toBeTruthy();
    });

    it('deve mostrar botão de excluir apenas para fotos de hoje', () => {
        const mockPhotos = [
            {
                id: 'photo-today',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-15', // hoje
                storage_path: 'p1/today.jpg',
                created_at: '2026-01-15T10:00:00',
                signedUrl: 'https://url-today',
            },
            {
                id: 'photo-old',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-14', // ontem
                storage_path: 'p1/old.jpg',
                created_at: '2026-01-14T10:00:00',
                signedUrl: 'https://url-old',
            },
        ];
        mockUsePatientPhotos.mockReturnValue({
            data: mockPhotos,
            isLoading: false,
        });

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));
        expect(screen.getByTestId('delete-photo-photo-today')).toBeTruthy();
        expect(screen.queryByTestId('delete-photo-photo-old')).toBeNull();
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

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));

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

        render(React.createElement(PatientPhotoGalleryView, { patientId: 'p1', surgeryId: 's1' }));

        // Abrir modal
        fireEvent.press(screen.getByTestId('photo-thumbnail-photo-1'));
        expect(screen.getByTestId('photo-counter')).toBeTruthy();

        // Fechar modal
        fireEvent.press(screen.getByTestId('close-fullscreen-photo'));
        expect(screen.queryByTestId('photo-counter')).toBeNull();
    });
});
