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
      data: {
        name: 'Dr. Carlos Silva',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: '85988001122',
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getAllByText('Dr. Carlos Silva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CRM/CE 12345')).toBeTruthy();
    expect(screen.getByText('carlos@medico.com')).toBeTruthy();
    expect(screen.getByText('85999001122')).toBeTruthy();
    expect(screen.getByText('85988001122')).toBeTruthy();
    expect(screen.getByText('Ligar para o Médico')).toBeTruthy();
  });

  it('deve renderizar nome no header e no card', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dra. Ana',
        crm: 'CRM/SP 99999',
        email: 'ana@medico.com',
        phone: '11999998888',
        phonePersonal: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.getAllByText('Dra. Ana').length).toBe(2);
  });

  it('não deve renderizar telefone pessoal quando não disponível', () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Ana',
        crm: 'CRM/SP 99999',
        email: 'ana@medico.com',
        phone: '11999998888',
        phonePersonal: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    expect(screen.queryByText('Telefone Pessoal')).toBeNull();
  });

  it('deve abrir discador ao pressionar botão ligar', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '(85) 99900-1122',
        phonePersonal: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    fireEvent.press(screen.getByTestId('call-doctor-button'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('tel:85999001122');
    });
  });

  it('deve copiar telefone ao pressionar linha de telefone', async () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '(85) 99900-1122',
        phonePersonal: null,
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    fireEvent.press(screen.getByText('(85) 99900-1122'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('(85) 99900-1122');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copiado!',
        'Telefone (85) 99900-1122 copiado para a área de transferência.'
      );
    });
  });

  it('deve copiar telefone pessoal ao pressionar linha', async () => {
    mockUseDoctorContact.mockReturnValue({
      data: {
        name: 'Dr. Carlos',
        crm: 'CRM/CE 12345',
        email: 'carlos@medico.com',
        phone: '85999001122',
        phonePersonal: '(85) 98800-1122',
      },
      isLoading: false,
    });

    render(React.createElement(DoctorContactView, baseProps));

    fireEvent.press(screen.getByText('(85) 98800-1122'));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith('(85) 98800-1122');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Copiado!',
        'Telefone (85) 98800-1122 copiado para a área de transferência.'
      );
    });
  });
});
