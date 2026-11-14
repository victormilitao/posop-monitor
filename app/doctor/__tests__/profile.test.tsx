import { Animated } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import DoctorProfile from '../profile';

const mockBack = jest.fn();
const mockToast = jest.fn();
const mockRefresh = jest.fn();
const mockUpdate = jest.fn();
const mockSingle = jest.fn();
const mockAuthUpdate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }), Redirect: () => null }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ dispatch: jest.fn() }), usePreventRemove: jest.fn() }));
jest.mock('../../../context/AuthContext', () => ({ useAuth: () => ({
  user: { id: 'doctor-1', email: 'doctor@example.com' }, isDoctor: true, isLoading: false,
  profile: { full_name: 'Victor', cpf: '12345678901', crm: '12345/SP', phone: '11999999999' }, refreshProfile: mockRefresh,
}) }));
jest.mock('../../../context/ToastContext', () => ({ useToast: () => ({ showToast: mockToast }) }));
jest.mock('../../../lib/supabase', () => ({ supabase: {
  from: () => ({ update: mockUpdate }), auth: { updateUser: (...args: unknown[]) => mockAuthUpdate(...args) },
} }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Animated, 'timing').mockImplementation(() => ({
    start: callback => callback?.({ finished: true }),
    stop: jest.fn(),
    reset: jest.fn(),
  }));
  mockUpdate.mockReturnValue({ eq: () => ({ select: () => ({ single: mockSingle }) }) });
  mockSingle.mockResolvedValue({ error: null });
  mockAuthUpdate.mockResolvedValue({ error: null });
});

it('salva apresentação e RQE somente com números e atualiza o perfil compartilhado', async () => {
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Nome de apresentação'), 'Dr. Victor');
  fireEvent.changeText(screen.getByLabelText('RQE'), '0012abc');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ display_name: 'Dr. Victor', rqe: '0012', specialty: null }));
  expect(mockAuthUpdate).not.toHaveBeenCalled();
});

it('mantém os dados digitados quando o salvamento falha', async () => {
  mockSingle.mockResolvedValue({ error: { code: '23505' } });
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Nome de apresentação'), 'Dr. Victor');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(screen.getByText('Não foi possível salvar')).toBeTruthy());
  expect(screen.getByLabelText('Nome de apresentação').props.value).toBe('Dr. Victor');
  expect(mockRefresh).not.toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});

it('solicita troca de e-mail pelo auth sem sobrescrever o endereço confirmado no perfil', async () => {
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('E-mail *'), 'new@example.com');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Confira seu e-mail para confirmar a alteração de endereço.' })));
  expect(mockAuthUpdate).toHaveBeenCalledWith({ email: 'new@example.com' });
  expect(mockUpdate.mock.calls[0][0]).not.toHaveProperty('email');
});

it('mostra junto ao botão o campo inválido sem tentar salvar', () => {
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Telefone profissional *'), '123');
  fireEvent.press(screen.getByText('Salvar alterações'));
  expect(screen.getByText('Corrija: telefone profissional com DDD.')).toBeTruthy();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it.each([
  [{ code: 'PGRST204', message: "Could not find the 'display_name' column" }, /banco de dados ainda não reconhece.*display_name.*PGRST204/],
  [{ code: '42501', message: 'permission denied' }, /não tem permissão.*42501/],
  [new Error('Network request failed'), /Verifique sua conexão/],
  [{ code: 'CUSTOM', message: 'Motivo específico do servidor' }, /Motivo específico do servidor.*CUSTOM/],
  [null, /servidor não informou o motivo/],
])('exibe o motivo da falha de salvamento %#', async (error, expected) => {
  mockSingle.mockRejectedValueOnce(error);
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Nome de apresentação'), 'Dr. Victor');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(screen.getByText(expected)).toBeTruthy());
  expect(screen.getByLabelText('Nome de apresentação').props.value).toBe('Dr. Victor');
});

it('fecha para cima depois de salvar e exibe somente um toast de sucesso', async () => {
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Nome de apresentação'), 'Dr. Victor');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(Animated.timing).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ toValue: 0 }));
  expect(mockToast).toHaveBeenCalledTimes(1);
  expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', title: 'Perfil atualizado' }));
  expect(screen.queryByText('Perfil atualizado')).toBeNull();
});

it('mantém o perfil aberto se a atualização de acesso falhar', async () => {
  mockAuthUpdate.mockResolvedValueOnce({ error: { message: 'Falha ao atualizar senha' } });
  const screen = render(<DoctorProfile />);
  fireEvent.changeText(screen.getByLabelText('Nova senha'), 'NovaSenha123!');
  fireEvent.press(screen.getByText('Salvar alterações'));
  await waitFor(() => expect(screen.getByText('Perfil salvo; acesso não atualizado')).toBeTruthy());
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockToast).not.toHaveBeenCalled();
});
