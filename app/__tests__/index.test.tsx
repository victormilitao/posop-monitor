import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../index';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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

    const crmInput = getByPlaceholderText('123456/UF *');
    const cadastrarButton = getByText('Cadastrar');

    // Test case 1: 3 numbers (Invalid)
    fireEvent.changeText(crmInput, '123/SP');
    fireEvent.press(cadastrarButton);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Atenção',
        message: expect.stringContaining('CRM inválido. Use o formato de 4 a 6 dígitos + sigla do estado.'),
      }));
    });

    // Reset mock
    mockShowToast.mockClear();

    // Test case 2: 7 numbers (Invalid, although the TextInput formats to 6)
    fireEvent.changeText(crmInput, '1234567/SP'); // The formatting will actually cap it at 6, so it becomes 123456/SP, which is valid.
    
    // We can test what the formatting function actually produces
    expect(crmInput.props.value).toBe('123456/SP');

    // Test case 3: 4 numbers (Valid format)
    fireEvent.changeText(crmInput, '1234/RJ');
    expect(crmInput.props.value).toBe('1234/RJ');

    // Test case 4: 6 numbers + 2 letters (Valid format)
    fireEvent.changeText(crmInput, '123456/MG');
    expect(crmInput.props.value).toBe('123456/MG');
    
    // Try to register with valid CRM (it should pass CRM validation and hit the service layer, failing at the mock)
    // To prevent actual error, we just verify the warning toast was NOT called for CRM.
    fireEvent.press(cadastrarButton);
    await waitFor(() => {
      expect(mockShowToast).not.toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('CRM inválido. Use o formato de 4 a 6 dígitos + sigla do estado.'),
      }));
    });
  });
});
