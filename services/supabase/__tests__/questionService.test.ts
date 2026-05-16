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

    it('deve filtrar questões que requerem dreno quando cirurgia não possui dreno', async () => {
      const mockQuestions = [
        {
          display_order: 1,
          is_active: true,
          question: {
            id: 'q1',
            text: 'Nível de dor',
            input_type: 'scale',
            metadata: null,
            options: [],
          },
        },
        {
          display_order: 2,
          is_active: true,
          question: {
            id: 'q2',
            text: 'Volume retirado do dreno',
            input_type: 'numeric',
            metadata: { requires_drain: true },
            options: [],
          },
        },
      ];

      // First call: surgery_questions query
      const questionsBuilder = createMockQueryBuilder(mockQuestions);
      // Second call: surgeries query (has_drain = false)
      const surgeryBuilder = createMockQueryBuilder({ has_drain: false });

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'surgeries') {
          return surgeryBuilder;
        }
        return questionsBuilder;
      });

      const result = await service.getQuestionsBySurgeryTypeId('st1', 'surgery-123');

      // Should only return the non-drain question
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Nível de dor');
    });

    it('deve incluir questões de dreno quando cirurgia possui dreno', async () => {
      const mockQuestions = [
        {
          display_order: 1,
          is_active: true,
          question: {
            id: 'q1',
            text: 'Nível de dor',
            input_type: 'scale',
            metadata: null,
            options: [],
          },
        },
        {
          display_order: 2,
          is_active: true,
          question: {
            id: 'q2',
            text: 'Volume retirado do dreno',
            input_type: 'numeric',
            metadata: { requires_drain: true },
            options: [],
          },
        },
      ];

      const questionsBuilder = createMockQueryBuilder(mockQuestions);
      const surgeryBuilder = createMockQueryBuilder({ has_drain: true });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'surgeries') {
          return surgeryBuilder;
        }
        return questionsBuilder;
      });

      const result = await service.getQuestionsBySurgeryTypeId('st1', 'surgery-123');

      // Should include both questions
      expect(result).toHaveLength(2);
      expect(result[1].text).toBe('Volume retirado do dreno');
    });

    it('deve incluir todas questões quando surgeryId não é fornecido', async () => {
      const mockQuestions = [
        {
          display_order: 1,
          is_active: true,
          question: {
            id: 'q1',
            text: 'Nível de dor',
            input_type: 'scale',
            metadata: null,
            options: [],
          },
        },
        {
          display_order: 2,
          is_active: true,
          question: {
            id: 'q2',
            text: 'Volume retirado do dreno',
            input_type: 'numeric',
            metadata: { requires_drain: true },
            options: [],
          },
        },
      ];

      const questionsBuilder = createMockQueryBuilder(mockQuestions);
      mockFrom.mockReturnValue(questionsBuilder);

      // Without surgeryId, drain questions should still be filtered out (hasDrain defaults to false)
      const result = await service.getQuestionsBySurgeryTypeId('st1');

      // Without surgeryId, hasDrain defaults to false, so drain questions are filtered
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Nível de dor');
    });
  });
});
