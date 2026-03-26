import { createMockQueryBuilder } from '../../../__mocks__/supabaseMock';

const mockFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { SupabaseSurgeryTypeService } from '../surgeryTypeService';

describe('SupabaseSurgeryTypeService', () => {
  let service: SupabaseSurgeryTypeService;

  beforeEach(() => {
    service = new SupabaseSurgeryTypeService();
    jest.clearAllMocks();
  });

  describe('getActiveSurgeryTypes', () => {
    it('deve retornar tipos de cirurgia ativos', async () => {
      const mockTypes = [
        { id: 'st1', name: 'Artroscopia', is_active: true },
        { id: 'st2', name: 'Hernioplastia', is_active: true },
      ];

      const builder = createMockQueryBuilder(mockTypes);
      mockFrom.mockReturnValue(builder);

      const result = await service.getActiveSurgeryTypes();

      expect(result).toHaveLength(2);
      expect(mockFrom).toHaveBeenCalledWith('surgery_types');
      expect(builder.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('deve retornar array vazio quando sem dados', async () => {
      const builder = createMockQueryBuilder(null);
      mockFrom.mockReturnValue(builder);

      const result = await service.getActiveSurgeryTypes();
      expect(result).toEqual([]);
    });

    it('deve lançar erro quando supabase falha', async () => {
      const builder = createMockQueryBuilder(null, { message: 'Error' });
      mockFrom.mockReturnValue(builder);

      await expect(service.getActiveSurgeryTypes()).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('getSurgeryTypeById', () => {
    it('deve retornar tipo de cirurgia encontrado', async () => {
      const mockType = { id: 'st1', name: 'Artroscopia' };

      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: mockType, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeryTypeById('st1');
      expect(result).toEqual(mockType);
    });

    it('deve retornar null quando não encontrado', async () => {
      const builder = createMockQueryBuilder();
      builder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(builder);

      const result = await service.getSurgeryTypeById('st999');
      expect(result).toBeNull();
    });
  });
});
