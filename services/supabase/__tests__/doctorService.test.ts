const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: any[]) => mockSignUp(...args),
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';
import { SupabaseDoctorService } from '../doctorService';

describe('SupabaseDoctorService', () => {
  let service: SupabaseDoctorService;

  const baseDoctorData = {
    name: 'Dr. Silva',
    cpf: '12345678901',
    crm: 'CRM12345',
    phone_business: '11999999999',
    email: 'dr.silva@test.com',
    password: 'Senha123!',
  };

  beforeEach(() => {
    service = new SupabaseDoctorService();
    jest.clearAllMocks();
  });

  describe('registerDoctor', () => {
    it('deve registrar médico com sucesso', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSignIn.mockResolvedValue({ error: null });

      const updateBuilder = createMockQueryBuilder(null, null);
      mockFrom.mockReturnValue(updateBuilder);

      mockSignOut.mockResolvedValue({ error: null });

      const result = await service.registerDoctor(baseDoctorData);

      expect(result.doctorId).toBe('user-1');
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'dr.silva@test.com',
        password: 'Senha123!',
      });
      expect(mockSignIn).toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('deve lançar erro quando email já registrado', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(service.registerDoctor(baseDoctorData))
        .rejects.toThrow('Já existe um cadastro com este e-mail.');
    });

    it('deve lançar erro quando signUp retorna user null', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.registerDoctor(baseDoctorData))
        .rejects.toThrow('Não foi possível criar o usuário.');
    });

    it('deve lançar erro quando auto sign-in falha', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      await expect(service.registerDoctor(baseDoctorData))
        .rejects.toThrow('Conta criada, mas não foi possível completar o cadastro.');
    });

    it('deve lançar erro de CRM/CPF duplicado no perfil', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      mockSignIn.mockResolvedValue({ error: null });

      const updateBuilder = createMockQueryBuilder(null, { code: '23505', message: 'duplicate' });
      mockFrom.mockReturnValue(updateBuilder);

      mockSignOut.mockResolvedValue({ error: null });

      await expect(service.registerDoctor(baseDoctorData))
        .rejects.toThrow('Já existe um médico cadastrado com este CRM ou CPF.');
    });
  });
});
