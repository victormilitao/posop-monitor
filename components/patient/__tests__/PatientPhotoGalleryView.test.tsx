import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PatientPhotoGalleryView } from '../PatientPhotoGalleryView';

describe('PatientPhotoGalleryView', () => {
  it('deve renderizar mensagem de nenhuma foto', () => {
    render(React.createElement(PatientPhotoGalleryView));
    expect(screen.getByText('Nenhuma foto adicionada')).toBeTruthy();
  });

  it('deve renderizar texto descritivo para paciente', () => {
    render(React.createElement(PatientPhotoGalleryView));
    expect(screen.getByText('Suas fotos aparecerão aqui quando forem adicionadas pelo médico.')).toBeTruthy();
  });

  it('deve renderizar ícone de imagem', () => {
    render(React.createElement(PatientPhotoGalleryView));
    expect(screen.getByTestId('icon-ImageOff')).toBeTruthy();
  });
});
