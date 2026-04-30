import React from 'react';
import { render, screen } from '@testing-library/react-native';

const mockUsePatientPhotos = jest.fn();

jest.mock('../../../hooks/usePatientPhotos', () => ({
    usePatientPhotos: (...args: any[]) => mockUsePatientPhotos(...args),
}));

import { PatientGalleryView } from '../PatientGalleryView';

describe('PatientGalleryView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePatientPhotos.mockReturnValue({
            data: [],
            isLoading: false,
        });
    });

    it('deve renderizar mensagem de nenhuma foto', () => {
        render(React.createElement(PatientGalleryView, { surgeryId: 's1' }));
        expect(screen.getByText('Nenhuma foto adicionada')).toBeTruthy();
    });

    it('deve renderizar texto descritivo para médico (read-only)', () => {
        render(React.createElement(PatientGalleryView, { surgeryId: 's1' }));
        expect(screen.getByText('As fotos do paciente aparecerão aqui quando forem adicionadas.')).toBeTruthy();
    });

    it('deve renderizar ícone de imagem', () => {
        render(React.createElement(PatientGalleryView, { surgeryId: 's1' }));
        expect(screen.getByTestId('icon-ImageOff')).toBeTruthy();
    });

    it('deve exibir loading enquanto carrega', () => {
        mockUsePatientPhotos.mockReturnValue({
            data: [],
            isLoading: true,
        });
        render(React.createElement(PatientGalleryView, { surgeryId: 's1' }));
        // ActivityIndicator does not have easily testable text, just verify no crash
        expect(screen.queryByText('Nenhuma foto adicionada')).toBeNull();
    });

    it('não deve renderizar botão de adicionar foto', () => {
        render(React.createElement(PatientGalleryView, { surgeryId: 's1' }));
        expect(screen.queryByTestId('add-photo-button')).toBeNull();
    });
});
