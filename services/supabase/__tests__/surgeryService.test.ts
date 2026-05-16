import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';

const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { SupabaseSurgeryService } from '../surgeryService';

describe('SupabaseSurgeryService', () => {
  let service: SupabaseSurgeryService;

  beforeEach(() => {
    service = new SupabaseSurgeryService();
    jest.clearAllMocks();
  });

  describe('getSurgeriesByDoctorId', () => {
    it('deve retornar cirurgias com lastResponseDate', async () => {
      const mockData = [
        {
          id: 's1',
          doctor_id: 'd1',
          patient: { full_name: 'João', email: 'j@t.com', phone: '11999', sex: 'M' },
          doctor: { full_name: 'Dr. Silva' },
          surgery_type: { name: 'Artroscopia', description: 'desc', expected_recovery_days: 14 },
          daily_reports: [{ date: '2026-03-20' }, { date: '2026-03-22' }],
        },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeriesByDoctorId('d1');

      expect(result).toHaveLength(1);
      expect(result[0].lastResponseDate).toBe('2026-03-22');
    });

    it('deve retornar lastResponseDate null sem relatórios', async () => {
      const mockData = [
        {
          id: 's1',
          patient: { full_name: 'João' },
          doctor: { full_name: 'Dr.' },
          surgery_type: { name: 'Test' },
          daily_reports: [],
        },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeriesByDoctorId('d1');
      expect(result[0].lastResponseDate).toBeNull();
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getSurgeriesByDoctorId('d1')).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('getSurgeryById', () => {
    it('deve retornar cirurgia encontrada', async () => {
      const mockSurgery = {
        id: 's1',
        patient: { full_name: 'João' },
        doctor: { full_name: 'Dr.' },
        surgery_type: { name: 'Test' },
      };

      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockSurgery, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeryById('s1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('s1');
    });

    it('deve retornar null quando não encontrada', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeryById('s999');
      expect(result).toBeNull();
    });
  });

  describe('createSurgery', () => {
    it('deve criar cirurgia com sucesso', async () => {
      const mockSurgery = { id: 's-new', doctor_id: 'd1', patient_id: 'p1' };

      const insertBuilder = createMockQueryBuilder();
      insertBuilder.single.mockResolvedValue({ data: mockSurgery, error: null });

      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return insertBuilder;
        return updateBuilder;
      });

      const result = await service.createSurgery({
        doctorId: 'd1',
        patientId: 'p1',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
      });

      expect(result.id).toBe('s-new');
    });

    it('deve lançar erro quando insert falha', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Insert error' } });
      mockFrom.mockReturnValue(builder);

      await expect(service.createSurgery({
        doctorId: 'd1',
        patientId: 'p1',
        surgeryTypeId: 'st1',
        surgeryDate: '2026-03-20',
      })).rejects.toBeTruthy();
    });
  });

  describe('finalizeSurgeriesPastRecovery', () => {
    it('deve retornar 0 quando nenhuma cirurgia ativa', async () => {
      const builder = createMockQueryBuilder([]);
      mockFrom.mockReturnValue(builder);

      const result = await service.finalizeSurgeriesPastRecovery('d1');
      expect(result).toBe(0);
    });

    it('deve finalizar cirurgias passadas do período de recuperação', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const dateStr = pastDate.toISOString().split('T')[0];

      const activeSurgeries = [
        {
          id: 's1',
          surgery_date: dateStr,
          follow_up_days: 14,
          surgery_type: { expected_recovery_days: 14 },
        },
      ];

      const fetchBuilder = createMockQueryBuilder(activeSurgeries);

      const updateBuilder = createMockQueryBuilder();
      updateBuilder.select = jest.fn().mockResolvedValue({ data: [{ id: 's1' }], error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return fetchBuilder;
        return updateBuilder;
      });

      const result = await service.finalizeSurgeriesPastRecovery('d1');
      expect(result).toBe(1);
    });

    it('deve retornar 0 quando cirurgias ainda estão no período', async () => {
      const today = new Date().toISOString().split('T')[0];

      const activeSurgeries = [
        {
          id: 's1',
          surgery_date: today,
          follow_up_days: 14,
          surgery_type: { expected_recovery_days: 14 },
        },
      ];

      const builder = createMockQueryBuilder(activeSurgeries);
      mockFrom.mockReturnValue(builder);

      const result = await service.finalizeSurgeriesPastRecovery('d1');
      expect(result).toBe(0);
    });

    it('deve lançar erro quando fetch falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.finalizeSurgeriesPastRecovery('d1')).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('dismissPendingReturn', () => {
    it('deve atualizar status de pending_return para completed', async () => {
      const builder = createMockQueryBuilder(null, null);
      mockFrom.mockReturnValue(builder);

      await service.dismissPendingReturn('s1');

      expect(mockFrom).toHaveBeenCalledWith('surgeries');
      expect(builder.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(builder.eq).toHaveBeenCalledWith('id', 's1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'pending_return');
    });

    it('deve lançar erro quando update falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'Update error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.dismissPendingReturn('s1')).rejects.toEqual({ message: 'Update error' });
    });
  });

  describe('getDistinctHospitals', () => {
    it('deve retornar hospitais distintos ordenados', async () => {
      const mockData = [
        { hospital: 'Hospital São Lucas' },
        { hospital: 'Clínica Santa Clara' },
        { hospital: 'Hospital São Lucas' }, // duplicate
        { hospital: 'Hospital Albert Einstein' },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getDistinctHospitals('d1');

      expect(mockFrom).toHaveBeenCalledWith('surgeries');
      expect(builder.select).toHaveBeenCalledWith('hospital');
      expect(builder.eq).toHaveBeenCalledWith('doctor_id', 'd1');
      expect(builder.not).toHaveBeenCalledWith('hospital', 'is', null);
      expect(builder.neq).toHaveBeenCalledWith('hospital', '');

      // Should be deduplicated and sorted
      expect(result).toEqual([
        'Clínica Santa Clara',
        'Hospital Albert Einstein',
        'Hospital São Lucas',
      ]);
    });

    it('deve retornar lista vazia quando não há hospitais', async () => {
      const builder = createMockQueryBuilder([]);
      mockFrom.mockReturnValue(builder);

      const result = await service.getDistinctHospitals('d1');
      expect(result).toEqual([]);
    });

    it('deve filtrar hospitais em branco e com espaços', async () => {
      const mockData = [
        { hospital: '  ' },
        { hospital: 'Hospital A' },
        { hospital: '' },
        { hospital: null },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getDistinctHospitals('d1');
      expect(result).toEqual(['Hospital A']);
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'DB Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getDistinctHospitals('d1')).rejects.toEqual({ message: 'DB Error' });
    });

    it('deve fazer trim nos nomes de hospitais', async () => {
      const mockData = [
        { hospital: '  Hospital A  ' },
        { hospital: 'Hospital A' },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getDistinctHospitals('d1');
      expect(result).toEqual(['Hospital A']);
    });
  });

  describe('getCompletedSurgeriesByDoctorId', () => {
    it('deve retornar cirurgias completadas com paginação', async () => {
      const mockData = [
        {
          id: 's1',
          doctor_id: 'd1',
          status: 'completed',
          updated_at: '2026-04-01T00:00:00Z',
          patient: { full_name: 'Maria Silva', email: 'm@t.com', phone: '11999', sex: 'F' },
          doctor: { full_name: 'Dr. Silva' },
          surgery_type: { name: 'Colecistectomia', description: 'desc', expected_recovery_days: 14 },
          daily_reports: [{ date: '2026-03-20' }, { date: '2026-03-22' }],
        },
      ];

      const builder = createMockQueryBuilder(mockData, null, 1);
      mockFrom.mockReturnValue(builder);

      const result = await service.getCompletedSurgeriesByDoctorId('d1');

      expect(mockFrom).toHaveBeenCalledWith('surgeries');
      expect(builder.eq).toHaveBeenCalledWith('doctor_id', 'd1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'completed');
      expect(builder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(builder.range).toHaveBeenCalledWith(0, 19);
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.data[0].lastResponseDate).toBe('2026-03-22');
    });

    it('deve retornar hasMore=true quando há mais resultados', async () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        patient: { full_name: `Patient ${i}` },
        doctor: { full_name: 'Dr.' },
        surgery_type: { name: 'Test' },
        daily_reports: [],
      }));

      const builder = createMockQueryBuilder(mockData, null, 25);
      mockFrom.mockReturnValue(builder);

      const result = await service.getCompletedSurgeriesByDoctorId('d1');

      expect(result.hasMore).toBe(true);
      expect(result.totalCount).toBe(25);
      expect(result.data).toHaveLength(20);
    });

    it('deve respeitar page e pageSize customizados', async () => {
      const builder = createMockQueryBuilder([], null, 0);
      mockFrom.mockReturnValue(builder);

      await service.getCompletedSurgeriesByDoctorId('d1', { page: 2, pageSize: 10 });

      expect(builder.range).toHaveBeenCalledWith(20, 29);
    });

    it('deve aplicar filtro ilike quando searchName fornecido', async () => {
      const builder = createMockQueryBuilder([], null, 0);
      mockFrom.mockReturnValue(builder);

      await service.getCompletedSurgeriesByDoctorId('d1', { searchName: 'Maria' });

      expect(builder.ilike).toHaveBeenCalledWith('patient.full_name', '%Maria%');
    });

    it('não deve aplicar ilike quando searchName é vazio ou só espaços', async () => {
      const builder = createMockQueryBuilder([], null, 0);
      mockFrom.mockReturnValue(builder);

      await service.getCompletedSurgeriesByDoctorId('d1', { searchName: '   ' });

      expect(builder.ilike).not.toHaveBeenCalled();
    });

    it('deve retornar resultado vazio quando médico não tem prontuários', async () => {
      const builder = createMockQueryBuilder([], null, 0);
      mockFrom.mockReturnValue(builder);

      const result = await service.getCompletedSurgeriesByDoctorId('d1');

      expect(result).toEqual({ data: [], totalCount: 0, hasMore: false });
    });

    it('deve mapear lastResponseDate como null sem relatórios', async () => {
      const mockData = [
        {
          id: 's1',
          patient: { full_name: 'João' },
          doctor: { full_name: 'Dr.' },
          surgery_type: { name: 'Test' },
          daily_reports: [],
        },
      ];

      const builder = createMockQueryBuilder(mockData, null, 1);
      mockFrom.mockReturnValue(builder);

      const result = await service.getCompletedSurgeriesByDoctorId('d1');
      expect(result.data[0].lastResponseDate).toBeNull();
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'DB Error' }, 0);
      // Override range to return error
      const errorPromise = Promise.resolve({ data: null, error: { message: 'DB Error' }, count: 0 });
      builder.range.mockReturnValue({
        then: errorPromise.then.bind(errorPromise),
        catch: errorPromise.catch.bind(errorPromise),
      });
      mockFrom.mockReturnValue(builder);

      await expect(service.getCompletedSurgeriesByDoctorId('d1')).rejects.toEqual({ message: 'DB Error' });
    });
  });
});
