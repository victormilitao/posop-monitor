import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';

const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { SupabaseQuestionService } from '../questionService';

describe('SupabaseQuestionService', () => {
  let service: SupabaseQuestionService;

  beforeEach(() => {
    service = new SupabaseQuestionService();
    jest.clearAllMocks();
  });

  describe('getQuestionsBySurgeryTypeId', () => {
    it('deve retornar questões com opções ordenadas', async () => {
      const mockData = [
        {
          display_order: 1,
          is_active: true,
          question: {
            id: 'q1',
            text: 'Nível de dor',
            input_type: 'scale',
            options: [
              { display_order: 2, value: 'high', label: 'Alta' },
              { display_order: 1, value: 'low', label: 'Baixa' },
            ],
          },
        },
        {
          display_order: 2,
          is_active: true,
          question: {
            id: 'q2',
            text: 'Febre?',
            input_type: 'boolean',
            options: [],
          },
        },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getQuestionsBySurgeryTypeId('st1');

      expect(result).toHaveLength(2);
      expect(result[0].display_order).toBe(1);
      // Options should be sorted by display_order
      expect(result[0].options[0].value).toBe('low');
    });

    it('deve retornar lista vazia quando sem dados', async () => {
      const builder = createMockQueryBuilder(null);
      mockFrom.mockReturnValue(builder);

      const result = await service.getQuestionsBySurgeryTypeId('st1');
      expect(result).toEqual([]);
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getQuestionsBySurgeryTypeId('st1')).rejects.toEqual({ message: 'Error' });
    });

    it('deve filtrar questões com question null', async () => {
      const mockData = [
        { display_order: 1, is_active: true, question: null },
        { display_order: 2, is_active: true, question: { id: 'q1', text: 'Test', options: [] } },
      ];

      const builder = createMockQueryBuilder(mockData);
      mockFrom.mockReturnValue(builder);

      const result = await service.getQuestionsBySurgeryTypeId('st1');
      expect(result).toHaveLength(1);
    });
  });
});
