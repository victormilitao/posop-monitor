import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';

// Mock supabase before importing the service
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  },
}));

import { SupabasePatientService } from '../patientService';

describe('SupabasePatientService', () => {
  let service: SupabasePatientService;

  beforeEach(() => {
    service = new SupabasePatientService();
    jest.clearAllMocks();
  });

  describe('getPatientsByDoctorId', () => {
    it('deve retornar pacientes do médico', async () => {
      const mockPatients = [
        { id: 'p1', doctor_id: 'd1', profile: { full_name: 'João', email: 'joao@test.com' } },
        { id: 'p2', doctor_id: 'd1', profile: { full_name: 'Maria', email: 'maria@test.com' } },
      ];

      const builder = createMockQueryBuilder(mockPatients);
      mockFrom.mockReturnValue(builder);

      const result = await service.getPatientsByDoctorId('d1');

      expect(mockFrom).toHaveBeenCalledWith('patients');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('doctor_id', 'd1');
      expect(result).toHaveLength(2);
      expect(result[0].profile.full_name).toBe('João');
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'DB Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getPatientsByDoctorId('d1')).rejects.toEqual({ message: 'DB Error' });
    });
  });

  describe('getPatientById', () => {
    it('deve retornar paciente encontrado', async () => {
      const mockPatient = {
        id: 'p1',
        profile: { full_name: 'João', email: 'joao@test.com' },
      };

      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockPatient, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.getPatientById('p1');

      expect(result).not.toBeNull();
      expect(result?.profile.full_name).toBe('João');
    });

    it('deve retornar null quando paciente não encontrado', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.getPatientById('p999');

      expect(result).toBeNull();
    });
  });

  describe('getPatientDashboardData', () => {
    it('deve retornar null quando perfil não encontrado', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.getPatientDashboardData('p999');

      expect(result).toBeNull();
    });

    it('deve retornar dados do dashboard com cirurgia', async () => {
      const mockProfile = { id: 'p1', full_name: 'João', role: 'patient' };
      const mockPatient = { surgery_id: 's1' };
      const mockSurgery = {
        id: 's1',
        surgery_date: '2026-03-20',
        follow_up_days: 14,
        surgery_type: { id: 'st1', name: 'Artroscopia', description: 'test', expected_recovery_days: 14 },
      };

      const profileBuilder = createMockQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: mockProfile, error: null });

      const patientBuilder = createMockQueryBuilder();
      patientBuilder.single.mockResolvedValue({ data: mockPatient, error: null });

      const surgeryBuilder = createMockQueryBuilder();
      surgeryBuilder.single.mockResolvedValue({ data: mockSurgery, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileBuilder;
        if (callCount === 2) return patientBuilder;
        return surgeryBuilder;
      });

      const result = await service.getPatientDashboardData('p1');

      expect(result).not.toBeNull();
      expect(result?.profile).toEqual(mockProfile);
      expect(result?.currentSurgery).not.toBeNull();
      expect(result?.totalRecoveryDays).toBe(14);
      expect(result?.daysSinceSurgery).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar dashboard sem cirurgia', async () => {
      const mockProfile = { id: 'p1', full_name: 'João', role: 'patient' };
      const mockPatient = { surgery_id: null };

      const profileBuilder = createMockQueryBuilder();
      profileBuilder.single.mockResolvedValue({ data: mockProfile, error: null });

      const patientBuilder = createMockQueryBuilder();
      patientBuilder.single.mockResolvedValue({ data: mockPatient, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileBuilder;
        return patientBuilder;
      });

      const result = await service.getPatientDashboardData('p1');

      expect(result).not.toBeNull();
      expect(result?.currentSurgery).toBeNull();
      expect(result?.daysSinceSurgery).toBe(0);
    });
  });

  describe('createPatient', () => {
    it('deve criar paciente com sucesso', async () => {
      mockRpc.mockResolvedValue({ data: 'new-patient-id', error: null });

      const surgeryBuilder = createMockQueryBuilder();
      surgeryBuilder.single.mockResolvedValue({
        data: { id: 'surgery-1' },
        error: null,
      });

      const patientLinkBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return surgeryBuilder;
        return patientLinkBuilder;
      });

      const result = await service.createPatient({
        name: 'João',
        cpf: '12345678901',
        sex: 'M',
        age: '30',
        phone: '11999999999',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
        doctorId: 'd1',
      });

      expect(result.patientId).toBe('new-patient-id');
      expect(result.surgeryId).toBe('surgery-1');
    });

    it('deve lançar erro de CPF duplicado', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      await expect(service.createPatient({
        name: 'João',
        cpf: '12345678901',
        sex: 'M',
        age: '30',
        phone: '11999999999',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
        doctorId: 'd1',
      })).rejects.toThrow('Já existe um paciente cadastrado com este CPF.');
    });

    it('deve lançar erro quando RPC não retorna ID', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      await expect(service.createPatient({
        name: 'João',
        cpf: '12345678901',
        sex: 'M',
        age: '30',
        phone: '11999999999',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
        doctorId: 'd1',
      })).rejects.toThrow('Não foi possível criar o usuário do paciente');
    });

    it('deve lançar erro de telefone duplicado', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "profiles_phone_unique"' },
      });

      await expect(service.createPatient({
        name: 'Maria',
        cpf: '98765432100',
        sex: 'F',
        age: '25',
        phone: '85988103356',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
        doctorId: 'd1',
      })).rejects.toThrow('Já existe um paciente cadastrado com este número de telefone.');
    });
  });

  describe('updatePatient', () => {
    it('deve atualizar dados do perfil com sucesso', async () => {
      const profileBuilder = createMockQueryBuilder(null, null);
      mockFrom.mockReturnValue(profileBuilder);

      await service.updatePatient({
        patientId: 'p1',
        surgeryId: 's1',
        name: 'João Atualizado',
        phone: '11888888888',
        sex: 'M',
      });

      expect(mockFrom).toHaveBeenCalledWith('profiles');
      expect(profileBuilder.update).toHaveBeenCalledWith({
        full_name: 'João Atualizado',
        phone: '11888888888',
        sex: 'M',
      });
      expect(profileBuilder.eq).toHaveBeenCalledWith('id', 'p1');
    });

    it('deve atualizar dados da cirurgia com sucesso', async () => {
      const surgeryBuilder = createMockQueryBuilder(null, null);
      mockFrom.mockReturnValue(surgeryBuilder);

      await service.updatePatient({
        patientId: 'p1',
        surgeryId: 's1',
        surgeryDate: '2026-04-01',
        followUpDays: 21,
        surgeryTypeId: 'st2',
      });

      expect(mockFrom).toHaveBeenCalledWith('surgeries');
      expect(surgeryBuilder.update).toHaveBeenCalledWith({
        surgery_date: '2026-04-01',
        follow_up_days: 21,
        surgery_type_id: 'st2',
      });
      expect(surgeryBuilder.eq).toHaveBeenCalledWith('id', 's1');
    });

    it('deve atualizar perfil e cirurgia juntos', async () => {
      const profileBuilder = createMockQueryBuilder(null, null);
      const surgeryBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileBuilder;
        return surgeryBuilder;
      });

      await service.updatePatient({
        patientId: 'p1',
        surgeryId: 's1',
        name: 'Maria',
        followUpDays: 10,
      });

      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(profileBuilder.update).toHaveBeenCalledWith({ full_name: 'Maria' });
      expect(surgeryBuilder.update).toHaveBeenCalledWith({ follow_up_days: 10 });
    });

    it('deve lançar erro de telefone duplicado ao atualizar', async () => {
      const profileBuilder = createMockQueryBuilder(null, null);
      // Override for error result
      const errorPromise = Promise.resolve({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "profiles_phone_unique"' },
      });
      profileBuilder.eq = jest.fn().mockReturnValue({
        then: errorPromise.then.bind(errorPromise),
        catch: errorPromise.catch.bind(errorPromise),
      });
      profileBuilder.update = jest.fn().mockReturnValue(profileBuilder);
      mockFrom.mockReturnValue(profileBuilder);

      await expect(service.updatePatient({
        patientId: 'p1',
        surgeryId: 's1',
        phone: '85988103356',
      })).rejects.toThrow('Já existe um paciente cadastrado com este número de telefone.');
    });

    it('deve lançar erro quando atualização da cirurgia falha', async () => {
      const surgeryBuilder = createMockQueryBuilder(null, null);
      const errorPromise = Promise.resolve({
        data: null,
        error: { message: 'Surgery update failed' },
      });
      surgeryBuilder.eq = jest.fn().mockReturnValue({
        then: errorPromise.then.bind(errorPromise),
        catch: errorPromise.catch.bind(errorPromise),
      });
      surgeryBuilder.update = jest.fn().mockReturnValue(surgeryBuilder);
      mockFrom.mockReturnValue(surgeryBuilder);

      await expect(service.updatePatient({
        patientId: 'p1',
        surgeryId: 's1',
        surgeryDate: '2026-05-01',
      })).rejects.toEqual({ message: 'Surgery update failed' });
    });
  });
});
