import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PatientGalleryView } from '../PatientGalleryView';

describe('PatientGalleryView', () => {
  it('deve renderizar mensagem de nenhuma foto', () => {
    render(React.createElement(PatientGalleryView));
    expect(screen.getByText('Nenhuma foto adicionada')).toBeTruthy();
  });

  it('deve renderizar texto descritivo', () => {
    render(React.createElement(PatientGalleryView));
    expect(screen.getByText('As fotos do paciente aparecerão aqui quando forem adicionadas.')).toBeTruthy();
  });

  it('deve renderizar ícone de imagem', () => {
    render(React.createElement(PatientGalleryView));
    expect(screen.getByTestId('icon-ImageOff')).toBeTruthy();
  });
});
