import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';

const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { SupabaseReportService } from '../reportService';
import { QuestionWithDetails } from '../../types';

describe('SupabaseReportService', () => {
  let service: SupabaseReportService;

  beforeEach(() => {
    service = new SupabaseReportService();
    jest.clearAllMocks();
  });

  describe('submitDailyReport', () => {
    const baseQuestions: QuestionWithDetails[] = [
      {
        id: 'q1',
        text: 'Nível de dor',
        input_type: 'scale',
        metadata: { category: 'critical', abnormal_min: 7 },
        options: [],
        display_order: 1,
        surgery_type_id: 'st1',
        is_active: true,
        created_at: '',
      } as any,
      {
        id: 'q2',
        text: 'Febre?',
        input_type: 'boolean',
        metadata: { category: 'critical' },
        options: [
          { value: 'yes', label: 'Sim', is_abnormal: 'true' },
          { value: 'no', label: 'Não', is_abnormal: 'false' },
        ],
        display_order: 2,
      } as any,
    ];

    it('deve submeter relatório sem alertas', async () => {
      const insertReportBuilder = createMockQueryBuilder(null, null);
      const updateSurgeryBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return insertReportBuilder; // daily_reports
        return updateSurgeryBuilder; // surgeries update
      });

      await service.submitDailyReport('p1', 's1', { q1: '3', q2: 'no' }, baseQuestions);

      expect(mockFrom).toHaveBeenCalledWith('daily_reports');
    });

    it('deve criar alerta critical quando 3+ sinais críticos', async () => {
      const criticalQuestions: QuestionWithDetails[] = [
        { id: 'q1', text: 'Dor', input_type: 'scale', metadata: { category: 'critical', abnormal_min: 5 }, options: [], display_order: 1 } as any,
        { id: 'q2', text: 'Febre', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 2 } as any,
        { id: 'q3', text: 'Sangramento', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 3 } as any,
        { id: 'q4', text: 'Vômito', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 4 } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const alertBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        if (callCount === 2) return alertBuilder;
        return updateBuilder;
      });

      await service.submitDailyReport('p1', 's1', { q1: '8', q2: 'yes', q3: 'yes', q4: 'yes' }, criticalQuestions);

      expect(mockFrom).toHaveBeenCalledWith('alerts');
    });

    it('deve criar alerta warning quando 3-4 sinais não-críticos', async () => {
      const warningQuestions: QuestionWithDetails[] = [
        { id: 'q1', text: 'Sintoma A', input_type: 'boolean', metadata: {}, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 1 } as any,
        { id: 'q2', text: 'Sintoma B', input_type: 'boolean', metadata: {}, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 2 } as any,
        { id: 'q3', text: 'Sintoma C', input_type: 'boolean', metadata: {}, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 3 } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const alertBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        if (callCount === 2) return alertBuilder;
        return updateBuilder;
      });

      await service.submitDailyReport('p1', 's1', { q1: 'yes', q2: 'yes', q3: 'yes' }, warningQuestions);

      expect(mockFrom).toHaveBeenCalledWith('alerts');
      expect(mockFrom).toHaveBeenCalledWith('surgeries');
    });

    it('deve tratar multiselect com opções anormais', async () => {
      const multiQ: QuestionWithDetails[] = [
        {
          id: 'q1', text: 'Sintomas', input_type: 'multiselect', metadata: {},
          options: [
            { value: 'fever', label: 'Febre', is_abnormal: 'true' },
            { value: 'pain', label: 'Dor', is_abnormal: 'false' },
          ],
          display_order: 1,
        } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return updateBuilder;
      });

      await service.submitDailyReport('p1', 's1', { q1: ['fever'] }, multiQ);

      expect(mockFrom).toHaveBeenCalledWith('daily_reports');
    });

    it('deve criar alerta critical quando 5+ sinais não-críticos', async () => {
      const manyQuestions: QuestionWithDetails[] = Array.from({ length: 5 }, (_, i) => ({
        id: `q${i}`, text: `Sintoma ${i}`, input_type: 'boolean', metadata: {},
        options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: i,
      } as any));

      const reportBuilder = createMockQueryBuilder(null, null);
      const alertBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        if (callCount === 2) return alertBuilder;
        return updateBuilder;
      });

      const answers: Record<string, string> = {};
      manyQuestions.forEach(q => { answers[q.id] = 'yes'; });

      await service.submitDailyReport('p1', 's1', answers, manyQuestions);
      expect(mockFrom).toHaveBeenCalledWith('alerts');
    });

    it('deve detectar dor > 5 sem abnormal_min', async () => {
      const painQ: QuestionWithDetails[] = [
        { id: 'q1', text: 'Nível de dor', input_type: 'scale', metadata: { category: 'critical' }, options: [], display_order: 1 } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return updateBuilder;
      });

      await service.submitDailyReport('p1', 's1', { q1: '7' }, painQ);
      expect(mockFrom).toHaveBeenCalledWith('daily_reports');
    });

    it('deve tratar select com opção selecionada', async () => {
      const selectQ: QuestionWithDetails[] = [
        {
          id: 'q1', text: 'Sintoma select', input_type: 'select', metadata: {},
          options: [
            { value: 'bad', label: 'Ruim', is_abnormal: 'true' },
            { value: 'good', label: 'Bom', is_abnormal: 'false' },
          ],
          display_order: 1,
        } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return updateBuilder;
      });

      await service.submitDailyReport('p1', 's1', { q1: 'bad' }, selectQ);
      expect(mockFrom).toHaveBeenCalledWith('daily_reports');
    });

    it('deve lançar erro quando insert de relatório falha', async () => {
      const reportBuilder = createMockQueryBuilder(null, { message: 'Insert failed' });
      mockFrom.mockReturnValue(reportBuilder);

      await expect(service.submitDailyReport('p1', 's1', { q1: '3' }, [{
        id: 'q1', text: 'Dor', input_type: 'scale', metadata: {}, options: [], display_order: 1,
      } as any])).rejects.toBeTruthy();
    });

    it('deve tratar erro ao criar alerta sem lançar exceção', async () => {
      const criticalQuestions: QuestionWithDetails[] = [
        { id: 'q1', text: 'A', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 1 } as any,
        { id: 'q2', text: 'B', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 2 } as any,
        { id: 'q3', text: 'C', input_type: 'boolean', metadata: { category: 'critical' }, options: [{ value: 'yes', label: 'Sim', is_abnormal: 'true' }], display_order: 3 } as any,
      ];

      const reportBuilder = createMockQueryBuilder(null, null);
      const alertBuilder = createMockQueryBuilder(null, { message: 'Alert insert error' });
      const updateBuilder = createMockQueryBuilder(null, null);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        if (callCount === 2) return alertBuilder;
        return updateBuilder;
      });

      // Should not throw even if alert insert fails
      await service.submitDailyReport('p1', 's1', { q1: 'yes', q2: 'yes', q3: 'yes' }, criticalQuestions);
    });

    it('deve tratar erro ao atualizar status da cirurgia', async () => {
      const reportBuilder = createMockQueryBuilder(null, null);
      const updateBuilder = createMockQueryBuilder(null, { message: 'Update failed' });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return updateBuilder;
      });

      // Should not throw even if surgery update fails
      await service.submitDailyReport('p1', 's1', { q1: '3' }, [{
        id: 'q1', text: 'Dor', input_type: 'scale', metadata: {}, options: [], display_order: 1,
      } as any]);
    });
  });

  describe('getPatientReports', () => {
    it('deve retornar lista vazia sem cirurgias', async () => {
      const builder = createMockQueryBuilder([]);
      mockFrom.mockReturnValue(builder);

      const result = await service.getPatientReports('p1');
      expect(result).toEqual([]);
    });

    it('deve retornar relatórios com alertas matched', async () => {
      const surgeryBuilder = createMockQueryBuilder([{ id: 's1' }]);

      const reportsData = [
        { id: 'r1', date: '2026-03-20', pain_level: 5, symptoms: null, answers: {}, surgery_id: 's1', created_at: '2026-03-20T10:00:00Z' },
      ];
      const reportsBuilder = createMockQueryBuilder(reportsData);

      const alertsData = [
        { severity: 'warning', message: 'Alerta de dor', created_at: '2026-03-20T12:00:00Z' },
      ];
      const alertsBuilder = createMockQueryBuilder(alertsData);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return surgeryBuilder;
        if (callCount === 2) return reportsBuilder;
        return alertsBuilder;
      });

      const result = await service.getPatientReports('p1');
      expect(result).toHaveLength(1);
      expect(result[0].alerts).toBeDefined();
      expect(result[0].alerts![0].severity).toBe('warning');
    });

    it('deve lançar erro quando busca de cirurgias falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'DB error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getPatientReports('p1')).rejects.toBeTruthy();
    });

    it('deve tratar erro de alertas sem lançar exceção', async () => {
      const surgeryBuilder = createMockQueryBuilder([{ id: 's1' }]);
      const reportsBuilder = createMockQueryBuilder([
        { id: 'r1', date: '2026-03-20', pain_level: 3, surgery_id: 's1' },
      ]);
      const alertsBuilder = createMockQueryBuilder(null, { message: 'Alerts error' });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return surgeryBuilder;
        if (callCount === 2) return reportsBuilder;
        return alertsBuilder;
      });

      const result = await service.getPatientReports('p1');
      expect(result).toHaveLength(1);
    });

    it('deve tratar relatórios sem date', async () => {
      const surgeryBuilder = createMockQueryBuilder([{ id: 's1' }]);
      const reportsBuilder = createMockQueryBuilder([
        { id: 'r1', date: null, pain_level: 3, surgery_id: 's1' },
      ]);
      const alertsBuilder = createMockQueryBuilder([]);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return surgeryBuilder;
        if (callCount === 2) return reportsBuilder;
        return alertsBuilder;
      });

      const result = await service.getPatientReports('p1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getReportsBySurgeryId', () => {
    it('deve retornar relatórios de uma cirurgia', async () => {
      const reportsData = [
        { id: 'r1', date: '2026-03-20', pain_level: 3, symptoms: null, answers: {}, surgery_id: 's1', created_at: '2026-03-20T10:00:00Z' },
      ];
      const reportsBuilder = createMockQueryBuilder(reportsData);

      const alertsBuilder = createMockQueryBuilder([]);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportsBuilder;
        return alertsBuilder;
      });

      const result = await service.getReportsBySurgeryId('s1');
      expect(result).toHaveLength(1);
    });

    it('deve tratar erro de alertas em getReportsBySurgeryId', async () => {
      const reportsBuilder = createMockQueryBuilder([
        { id: 'r1', date: '2026-03-20', pain_level: 3, surgery_id: 's1' },
      ]);
      const alertsBuilder = createMockQueryBuilder(null, { message: 'Error' });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportsBuilder;
        return alertsBuilder;
      });

      const result = await service.getReportsBySurgeryId('s1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getReportById', () => {
    it('deve retornar relatório encontrado', async () => {
      const report = { id: 'r1', date: '2026-03-20', surgery_id: 's1', pain_level: 5, symptoms: null, answers: {} };

      const reportBuilder = createMockQueryBuilder();
      reportBuilder.single.mockResolvedValue({ data: report, error: null });

      const alertsBuilder = createMockQueryBuilder([]);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return alertsBuilder;
      });

      const result = await service.getReportById('r1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('r1');
    });

    it('deve retornar null quando não encontrado', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.getReportById('r999');
      expect(result).toBeNull();
    });

    it('deve retornar report sem date', async () => {
      const report = { id: 'r1', date: null, surgery_id: 's1', pain_level: 5 };

      const reportBuilder = createMockQueryBuilder();
      reportBuilder.single.mockResolvedValue({ data: report, error: null });
      mockFrom.mockReturnValue(reportBuilder);

      const result = await service.getReportById('r1');
      expect(result).toEqual(report);
    });

    it('deve retornar report sem surgery_id', async () => {
      const report = { id: 'r1', date: '2026-03-20', surgery_id: null, pain_level: 5 };

      const reportBuilder = createMockQueryBuilder();
      reportBuilder.single.mockResolvedValue({ data: report, error: null });
      mockFrom.mockReturnValue(reportBuilder);

      const result = await service.getReportById('r1');
      expect(result).toEqual(report);
    });

    it('deve retornar relatório com alertas matching encontrados', async () => {
      const report = { id: 'r1', date: '2026-03-20', surgery_id: 's1', pain_level: 5 };

      const reportBuilder = createMockQueryBuilder();
      reportBuilder.single.mockResolvedValue({ data: report, error: null });

      const alertsData = [
        { severity: 'critical', message: 'Alerta grave', created_at: '2026-03-20T15:00:00Z' },
        { severity: 'warning', message: 'Alerta leve', created_at: '2026-03-21T15:00:00Z' },
      ];
      const alertsBuilder = createMockQueryBuilder(alertsData);

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return reportBuilder;
        return alertsBuilder;
      });

      const result = await service.getReportById('r1');
      expect(result?.alerts).toHaveLength(1);
      expect(result?.alerts![0].severity).toBe('critical');
    });
  });
});
