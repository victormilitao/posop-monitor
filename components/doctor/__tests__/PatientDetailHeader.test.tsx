import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PatientDetailHeader } from '../PatientDetailHeader';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

describe('PatientDetailHeader', () => {
  const baseProps = {
    patientName: 'Maria Bezerra',
    surgeryType: 'Histerectomia',
    surgeryDate: '23/04/2026',
    onBackPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o nome do paciente', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    expect(screen.getByTestId('patient-name')).toBeTruthy();
    expect(screen.getByText('Maria Bezerra')).toBeTruthy();
  });

  it('deve renderizar o tipo de cirurgia', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    expect(screen.getByTestId('surgery-type')).toBeTruthy();
    expect(screen.getByText('Histerectomia')).toBeTruthy();
  });

  it('deve renderizar a data da cirurgia', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    expect(screen.getByTestId('surgery-date')).toBeTruthy();
    expect(screen.getByText('23/04/2026')).toBeTruthy();
  });

  it('deve renderizar os labels de Cirurgia e Data', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    expect(screen.getByTestId('surgery-label')).toBeTruthy();
    expect(screen.getByText('Cirurgia:')).toBeTruthy();
    expect(screen.getByTestId('date-label')).toBeTruthy();
    expect(screen.getByText('Data:')).toBeTruthy();
  });

  it('deve chamar onBackPress ao pressionar o botão de voltar', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    fireEvent.press(screen.getByTestId('back-button'));
    expect(baseProps.onBackPress).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o botão de voltar', () => {
    render(React.createElement(PatientDetailHeader, baseProps));
    expect(screen.getByTestId('back-button')).toBeTruthy();
  });

  it('deve renderizar com valores vazios sem quebrar', () => {
    const emptyProps = {
      patientName: '',
      surgeryType: '',
      surgeryDate: '',
      onBackPress: jest.fn(),
    };
    render(React.createElement(PatientDetailHeader, emptyProps));
    expect(screen.getByTestId('patient-name')).toBeTruthy();
    expect(screen.getByTestId('surgery-type')).toBeTruthy();
    expect(screen.getByTestId('surgery-date')).toBeTruthy();
  });

  it('deve renderizar corretamente com dados diferentes', () => {
    const differentProps = {
      patientName: 'João Silva',
      surgeryType: 'Colecistectomia',
      surgeryDate: '15/03/2026',
      onBackPress: jest.fn(),
    };
    render(React.createElement(PatientDetailHeader, differentProps));
    expect(screen.getByText('João Silva')).toBeTruthy();
    expect(screen.getByText('Colecistectomia')).toBeTruthy();
    expect(screen.getByText('15/03/2026')).toBeTruthy();
  });
});
