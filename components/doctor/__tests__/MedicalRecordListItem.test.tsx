import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { MedicalRecordListItem } from '../MedicalRecordListItem';

describe('MedicalRecordListItem', () => {
  const baseProps = {
    name: 'Maria Silva',
    surgeryType: 'Colecistectomia',
    surgeryDate: '15/03/2026',
    completedDate: '28/03/2026',
    totalDays: 13,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar nome do paciente', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText('Maria Silva')).toBeTruthy();
  });

  it('deve renderizar tipo de cirurgia', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText(/Colecistectomia/)).toBeTruthy();
  });

  it('deve renderizar data da cirurgia', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText(/15\/03\/2026/)).toBeTruthy();
  });

  it('deve renderizar data de finalização', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText(/28\/03\/2026/)).toBeTruthy();
  });

  it('deve renderizar total de dias de acompanhamento', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText('13 dias de acompanhamento')).toBeTruthy();
  });

  it('deve renderizar badge Prontuário', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText('Prontuário')).toBeTruthy();
  });

  it('deve renderizar link Ver detalhes', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    expect(screen.getByText('Ver detalhes')).toBeTruthy();
  });

  it('deve chamar onPress ao tocar', () => {
    render(React.createElement(MedicalRecordListItem, baseProps));
    fireEvent.press(screen.getByTestId('medical-record-item'));
    expect(baseProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar corretamente com sex=F', () => {
    render(React.createElement(MedicalRecordListItem, { ...baseProps, sex: 'F' }));
    expect(screen.getByText('Maria Silva')).toBeTruthy();
  });

  it('deve renderizar corretamente com totalDays=0', () => {
    render(React.createElement(MedicalRecordListItem, { ...baseProps, totalDays: 0 }));
    expect(screen.getByText('0 dias de acompanhamento')).toBeTruthy();
  });
});
