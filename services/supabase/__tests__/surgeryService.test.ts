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
});
