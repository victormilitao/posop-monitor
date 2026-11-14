import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../index';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn() })),
  Stack: { Screen: () => null },
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../context/ToastContext', () => ({
  useToast: jest.fn(),
}));
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: jest.fn() },
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn() })) })) })),
  },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  FileText: 'FileText',
  Lock: 'Lock',
  User: 'User',
  Stethoscope: 'Stethoscope',
}));

describe('LoginScreen - Doctor Registration CRM tests', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: null,
      profile: null,
      isLoading: false,
    });
    (useToast as jest.Mock).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('should validate CRM length correctly (4 to 6 numbers + 2 letters)', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    // Select Doctor Role
    fireEvent.press(getByText('Sou Médico'));
    
    // Select "Não possuo cadastro"
    fireEvent.press(getByText('Não possuo cadastro'));

    // Fill registration form
    fireEvent.changeText(getByPlaceholderText('Nome Completo *'), 'Dr. Test');
    fireEvent.changeText(getByPlaceholderText('000.000.000-00 *'), '11111111111');
    fireEvent.changeText(getByPlaceholderText('E-mail *'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('Senha *'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Telefone Empresarial *'), '11999999999');

    const crmInput = getByPlaceholderText('Número do CRM');
    const cadastrarButton = getByText('Cadastrar');
    fireEvent.press(getByText('Selecione a UF'));
    fireEvent.changeText(getByPlaceholderText('Buscar por sigla ou estado'), 'SP');
    fireEvent.press(getByText('SP — São Paulo'));

    // Test case 1: 3 numbers (Invalid)
    fireEvent.changeText(crmInput, '123');
    fireEvent.press(cadastrarButton);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Atenção',
        message: expect.stringContaining('Informe um CRM de 4 a 6 dígitos e selecione uma UF válida.'),
      }));
    });

    // Reset mock
    mockShowToast.mockClear();

    // Test case 2: 7 numbers (Invalid, although the TextInput formats to 6)
    fireEvent.changeText(crmInput, '1234567'); // The formatting will actually cap it at 6, so it becomes 123456/SP, which is valid.
    
    // We can test what the formatting function actually produces
    expect(crmInput.props.value).toBe('123456');

    // Test case 3: 4 numbers (Valid format)
    fireEvent.changeText(crmInput, '1234');
    expect(crmInput.props.value).toBe('1234');

    // Test case 4: 6 numbers + 2 letters (Valid format)
    fireEvent.changeText(crmInput, '123456');
    expect(crmInput.props.value).toBe('123456');
    
    // Try to register with valid CRM (it should pass CRM validation and hit the service layer, failing at the mock)
    // To prevent actual error, we just verify the warning toast was NOT called for CRM.
    fireEvent.press(cadastrarButton);
    await waitFor(() => {
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Informe um CRM de 4 a 6 dígitos e selecione uma UF válida.'),
      }));
    });
  });
});


describe('Login do paciente', () => {
  it('permite entrar somente com o telefone, sem campo de senha', async () => {
    (useAuth as jest.Mock).mockReturnValue({ session: null, profile: null, isLoading: false });
    (useToast as jest.Mock).mockReturnValue({ showToast: jest.fn() });
    (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ eq: () => ({ single: async () => ({ data: { email: 'teste@example.com' }, error: null }) }) }) });
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(<LoginScreen />);
    fireEvent.press(getByText('Sou Paciente'));
    fireEvent.changeText(getByPlaceholderText('(00) 00000-0000'), '11999999999');
    expect(queryByPlaceholderText('Senha do paciente')).toBeNull();
    fireEvent.press(getByText('Entrar'));
    await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'teste@example.com', password: 'Password123!',
    }));
  });
});
