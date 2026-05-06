import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

// Mock expo-clipboard
const mockSetStringAsync = jest.fn().mockResolvedValue(true);
jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: any[]) => mockSetStringAsync(...args),
}));

// Mock useDoctorContact hook
const mockUseDoctorContact = jest.fn();
jest.mock('../../../hooks/useDoctorContact', () => ({
  useDoctorContact: (...args: any[]) => mockUseDoctorContact(...args),
}));

// Mock Linking
jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve(true));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import { DoctorContactView } from '../DoctorContactView';

describe('DoctorContactView', () => {
  const baseProps = {
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
    hospital: 'Hospital São Lucas',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar estado de carregamento', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: true });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });

  it('deve renderizar mensagem quando médico não encontrado', () => {
    mockUseDoctorContact.mockReturnValue({ data: null, isLoading: false });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getByText('Nenhum médico vinculado encontrado.')).toBeTruthy();
  });

  it('deve renderizar dados do médico no card', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getAllByText('Dr. Carlos Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CRM/CE 12345')).toBeTruthy();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();
    // Surgery-level contacts should be displayed formatted
    expect(screen.getByText('(85) 97700-1122')).toBeTruthy();
    expect(screen.getByText('(85) 96600-1122')).toBeTruthy();
    expect(screen.getByText('Contato Pessoal')).toBeTruthy();
    expect(screen.getByText('Contato Empresarial')).toBeTruthy();
  });

  it('deve renderizar nome no header e no card', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dra. Ana',
        crm: 'CRM/SP 99999',
        email: 'ana@medico.com',
        phone: '11999998888',
        phonePersonal: null,
        contactPhone: '11977778888',
        contactPhoneBusiness: null,
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getAllByText('Dra. Ana').length).toBe(2);
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
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.queryByText('Contato Empresarial')).toBeNull();
    expect(screen.getByText('Contato Pessoal')).toBeTruthy();
  });

  it('não deve renderizar botão ligar quando não está em alerta crítico', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.queryByTestId('call-doctor-button')).toBeNull();
    expect(screen.queryByText('Ligar para o Médico')).toBeNull();
    // Contact phones should still be visible for copying (formatted)
    expect(screen.getByText('(85) 97700-1122')).toBeTruthy();
  });

  it('deve renderizar botão ligar quando paciente está em alerta crítico', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, { ...baseProps, isCriticalAlert: true }));

    expect(screen.getByTestId('call-doctor-button')).toBeTruthy();
    expect(screen.getByText('Ligar para o Médico')).toBeTruthy();
  });

  it('deve abrir discador ao pressionar botão ligar em alerta crítico', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: '85977001122',
        contactPhoneBusiness: null,
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, { ...baseProps, isCriticalAlert: true }));

    fireEvent.press(screen.getByTestId('call-doctor-button'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('tel:85977001122');
    });
  });

  it('deve usar telefone do perfil do médico como fallback quando não há contatos de cirurgia', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: null,
        contactPhoneBusiness: null,
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, { ...baseProps, isCriticalAlert: true }));

    fireEvent.press(screen.getByTestId('call-doctor-button'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('tel:85999001122');
    });
  });

  it('deve copiar contato pessoal ao pressionar linha', async () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: '85977001122',
        contactPhoneBusiness: null,
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    fireEvent.press(screen.getByText('(85) 97700-1122'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('85977001122');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copiado!',
        'Telefone (85) 97700-1122 copiado para a área de transferência.'
      );
    });
  });

  it('deve copiar contato empresarial ao pressionar linha', async () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: null,
        contactPhone: null,
        contactPhoneBusiness: '85966001122',
        hospital: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    fireEvent.press(screen.getByText('(85) 96600-1122'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('85966001122');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copiado!',
        'Telefone (85) 96600-1122 copiado para a área de transferência.'
      );
    });
  });

  it('deve renderizar hospital quando disponível', () => {
    mockUseDoctorContact.mockReturnValue({
      data: doctorData,
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getByText('Hospital')).toBeTruthy();
    expect(screen.getByText('Hospital São Lucas')).toBeTruthy();
  });

  it('não deve renderizar hospital quando não disponível', () => {
    mockUseDoctorContact.mockReturnValue({
      data: { ...doctorData, hospital: null },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.queryByText('Hospital')).toBeNull();
  });
});
