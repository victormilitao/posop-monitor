import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

// Mock useDoctorContact hook
const mockUseDoctorContact = jest.fn();
jest.mock('../../../hooks/useDoctorContact', () => ({
  useDoctorContact: (...args: any[]) => mockUseDoctorContact(...args),
}));

// Mock Linking
jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve(true));

import { DoctorContactSheet } from '../DoctorContactSheet';

describe('DoctorContactSheet', () => {
  const baseProps = {
    visible: true,
    onClose: jest.fn(),
    patientId: 'p1',
  };

  const doctorData = {
    name: 'Dr. Carlos Silva',
    crm: 'CRM/CE 12345',
    email: 'carlos@medico.com',
    phone: '85999001122',
    phonePersonal: '85988001122',
    contactPhone: '85977001122',
    contactPhoneBusiness: '85966001122',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar estado de carregamento', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: true });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.getByText('Carregando dados do médico...')).toBeTruthy();
  });

  it('deve renderizar mensagem quando médico não encontrado', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: false });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.getByText('Nenhum médico vinculado encontrado.')).toBeTruthy();
  });

  it('deve renderizar dados do médico com contatos de cirurgia', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.getByText('Contato Médico')).toBeTruthy();
    expect(screen.getByText('Dados do Médico')).toBeTruthy();
    expect(screen.getByText('Contato')).toBeTruthy();
    expect(screen.getByText('Dr. Carlos Silva')).toBeTruthy();
    expect(screen.getByText('CRM/CE 12345')).toBeTruthy();
    // Surgery-level contacts should be displayed
    expect(screen.getByText('85977001122')).toBeTruthy();
    expect(screen.getByText('85966001122')).toBeTruthy();
    expect(screen.getByText('Contato Pessoal')).toBeTruthy();
    expect(screen.getByText('Contato Empresarial')).toBeTruthy();
  });

  it('não deve renderizar contato empresarial quando não disponível', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Ana',
        crm: 'CRM/SP 99999',
        email: 'ana@medico.com',
        phone: '11999998888',
        phonePersonal: null,
        contactPhone: '11977778888',
        contactPhoneBusiness: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.queryByText('Contato Empresarial')).toBeNull();
    expect(screen.getByText('Contato Pessoal')).toBeTruthy();
  });

  it('deve chamar onClose ao pressionar o botão fechar', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: false });

    render(React.createElement(DoctorContactSheet, baseProps));

    fireEvent.press(screen.getByTestId('close-doctor-contact-sheet'));

    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('não deve renderizar botão ligar quando não está em alerta crítico', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.queryByTestId('call-doctor-button')).toBeNull();
    expect(screen.queryByText('Ligar para o Médico')).toBeNull();
    // Contact phones should still be visible for copying
    expect(screen.getByText('85977001122')).toBeTruthy();
  });

  it('deve renderizar botão ligar quando paciente está em alerta crítico', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, { ...baseProps, isCriticalAlert: true }));

    expect(screen.getByTestId('call-doctor-button')).toBeTruthy();
    expect(screen.getByText('Ligar para o Médico')).toBeTruthy();
  });

  it('deve abrir discador ao pressionar botão ligar em alerta crítico', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: '(85) 97700-1122',
        contactPhoneBusiness: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, { ...baseProps, isCriticalAlert: true }));

    fireEvent.press(screen.getByTestId('call-doctor-button'));

    expect(Linking.openURL).toHaveBeenCalledWith('tel:85977001122');
  });

  it('deve usar telefone do perfil do médico como fallback', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: null,
        contactPhoneBusiness: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactSheet, { ...baseProps, isCriticalAlert: true }));

    fireEvent.press(screen.getByTestId('call-doctor-button'));

    expect(Linking.openURL).toHaveBeenCalledWith('tel:85999001122');
  });

  it('não deve renderizar quando não está visível e nunca esteve', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: false });

    const { toJSON } = render(
      React.createElement(DoctorContactSheet, { ...baseProps, visible: false })
    );

    expect(toJSON()).toBeNull();
  });

  it('deve renderizar o título e subtítulo do header', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: false });

    render(React.createElement(DoctorContactSheet, baseProps));

    expect(screen.getByText('Contato Médico')).toBeTruthy();
    expect(screen.getByText('Informações do seu médico responsável')).toBeTruthy();
  });
});
