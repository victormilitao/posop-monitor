import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ConfirmPatientModal, ConfirmPatientData } from '../ConfirmPatientModal';

describe('ConfirmPatientModal', () => {
  const sampleData: ConfirmPatientData = {
    name: 'Maria Oliveira',
    cpf: '123.456.789-00',
    sex: 'F',
    age: '45',
    phone: '(88) 99999-1234',
    surgeryType: 'Colecistectomia',
    surgeryDate: '15/04/2026',
    followUpDays: '14',
    hospital: 'Hospital São Lucas',
  };

  const baseProps = {
    visible: true,
    data: sampleData,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar título e dados do paciente', () => {
    render(React.createElement(ConfirmPatientModal, baseProps));
    expect(screen.getByText('Confirmar Cadastro')).toBeTruthy();
    expect(screen.getByText('Maria Oliveira')).toBeTruthy();
    expect(screen.getByText('123.456.789-00')).toBeTruthy();
    expect(screen.getByText('Feminino')).toBeTruthy();
    expect(screen.getByText('45 anos')).toBeTruthy();
    expect(screen.getByText('(88) 99999-1234')).toBeTruthy();
    expect(screen.getByText('Colecistectomia')).toBeTruthy();
    expect(screen.getByText('15/04/2026')).toBeTruthy();
    expect(screen.getByText('14 dias')).toBeTruthy();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();
  });

  it('não deve renderizar hospital quando não informado', () => {
    const dataWithoutHospital = { ...sampleData, hospital: undefined };
    render(React.createElement(ConfirmPatientModal, { ...baseProps, data: dataWithoutHospital }));
    expect(screen.queryByText('Hospital')).toBeNull();
  });

  it('deve exibir Masculino quando sex é M', () => {
    const maleData = { ...sampleData, sex: 'M' };
    render(React.createElement(ConfirmPatientModal, { ...baseProps, data: maleData }));
    expect(screen.getByText('Masculino')).toBeTruthy();
  });

  it('deve chamar onConfirm ao pressionar o botão de confirmar', () => {
    render(React.createElement(ConfirmPatientModal, baseProps));
    fireEvent.press(screen.getByText('Confirmar'));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao pressionar Cancelar', () => {
    render(React.createElement(ConfirmPatientModal, baseProps));
    fireEvent.press(screen.getByText('Cancelar'));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('deve exibir "Salvando..." quando isLoading', () => {
    render(React.createElement(ConfirmPatientModal, { ...baseProps, isLoading: true }));
    expect(screen.getByText('Salvando...')).toBeTruthy();
  });

  it('deve usar título e label customizados', () => {
    render(React.createElement(ConfirmPatientModal, {
      ...baseProps,
      title: 'Confirmar Edição',
      confirmLabel: 'Salvar',
    }));
    expect(screen.getByText('Confirmar Edição')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('não deve renderizar conteúdo quando visible é false', () => {
    render(React.createElement(ConfirmPatientModal, { ...baseProps, visible: false }));
    expect(screen.queryByText('Confirmar Cadastro')).toBeNull();
  });

  it('não deve renderizar idade quando age não é fornecido', () => {
    const dataWithoutAge = { ...sampleData, age: undefined };
    render(React.createElement(ConfirmPatientModal, { ...baseProps, data: dataWithoutAge }));
    expect(screen.queryByText(/anos/)).toBeNull();
  });

  it('deve renderizar texto de instrução', () => {
    render(React.createElement(ConfirmPatientModal, baseProps));
    expect(screen.getByText('Confira os dados abaixo antes de confirmar.')).toBeTruthy();
  });
});
