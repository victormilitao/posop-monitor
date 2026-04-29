import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PatientProfileView, PatientProfileData } from '../PatientProfileView';

describe('PatientProfileView', () => {
  const sampleData: PatientProfileData = {
    name: 'Maria Oliveira',
    cpf: '123.456.789-00',
    sex: 'F',
    phone: '(88) 99999-1234',
    surgeryType: 'Colecistectomia',
    surgeryDate: '15/04/2026',
    followUpDays: '14',
    status: 'active',
  };

  const baseProps = {
    data: sampleData,
    isLoading: false,
    onEditPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar dados do paciente', () => {
    render(React.createElement(PatientProfileView, baseProps));
    expect(screen.getByText('Maria Oliveira')).toBeTruthy();
    expect(screen.getByText('123.456.789-00')).toBeTruthy();
    expect(screen.getByText('Feminino')).toBeTruthy();
    expect(screen.getByText('(88) 99999-1234')).toBeTruthy();
  });

  it('deve renderizar dados do procedimento', () => {
    render(React.createElement(PatientProfileView, baseProps));
    expect(screen.getByText('Colecistectomia')).toBeTruthy();
    expect(screen.getByText('15/04/2026')).toBeTruthy();
    expect(screen.getByText('14 dias')).toBeTruthy();
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('deve exibir Masculino quando sex é M', () => {
    const maleData = { ...sampleData, sex: 'M' };
    render(React.createElement(PatientProfileView, { ...baseProps, data: maleData }));
    expect(screen.getByText('Masculino')).toBeTruthy();
  });

  it('deve chamar onEditPress ao pressionar botão de editar', () => {
    render(React.createElement(PatientProfileView, baseProps));
    fireEvent.press(screen.getByTestId('edit-patient-button'));
    expect(baseProps.onEditPress).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar loading quando isLoading é true', () => {
    render(React.createElement(PatientProfileView, { ...baseProps, isLoading: true }));
    expect(screen.queryByText('Maria Oliveira')).toBeNull();
  });

  it('deve mostrar loading quando data é null', () => {
    render(React.createElement(PatientProfileView, { ...baseProps, data: null }));
    expect(screen.queryByText('Maria Oliveira')).toBeNull();
  });

  it('deve desabilitar botão de editar quando isFinalized', () => {
    render(React.createElement(PatientProfileView, { ...baseProps, isFinalized: true }));
    const editButton = screen.getByTestId('edit-patient-button');
    expect(editButton.props.accessibilityState?.disabled || editButton.props.disabled).toBeTruthy();
  });

  it('deve mostrar mensagem de alerta quando isFinalized', () => {
    render(React.createElement(PatientProfileView, { ...baseProps, isFinalized: true }));
    expect(screen.getByText('Este paciente já finalizou o acompanhamento.')).toBeTruthy();
  });

  it('deve mostrar status Finalizado quando completed', () => {
    const completedData = { ...sampleData, status: 'completed' };
    render(React.createElement(PatientProfileView, { ...baseProps, data: completedData }));
    expect(screen.getByText('Finalizado')).toBeTruthy();
  });

  it('deve mostrar status Pendente Retorno', () => {
    const pendingData = { ...sampleData, status: 'pending_return' };
    render(React.createElement(PatientProfileView, { ...baseProps, data: pendingData }));
    expect(screen.getByText('Pendente Retorno')).toBeTruthy();
  });

  it('deve mostrar status Cancelado', () => {
    const cancelledData = { ...sampleData, status: 'cancelled' };
    render(React.createElement(PatientProfileView, { ...baseProps, data: cancelledData }));
    expect(screen.getByText('Cancelado')).toBeTruthy();
  });

  it('deve renderizar títulos das seções', () => {
    render(React.createElement(PatientProfileView, baseProps));
    expect(screen.getByText('Dados do Paciente')).toBeTruthy();
    expect(screen.getByText('Dados do Procedimento')).toBeTruthy();
  });

  it('deve renderizar botão de editar com texto correto', () => {
    render(React.createElement(PatientProfileView, baseProps));
    expect(screen.getByText('Editar Dados')).toBeTruthy();
  });
});
