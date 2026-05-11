import { SupabaseOrientationService } from '../orientationService';

// Mock supabase
const mockFrom = jest.fn();
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function createChainMock(finalData: unknown, finalError: unknown = null) {
  const result = { data: finalData, error: finalError };
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockReturnValue(chain);

  // Make the chain itself awaitable
  (chain as any).then = (resolve: (v: unknown) => void) => resolve(result);

  return chain;
}

describe('SupabaseOrientationService', () => {
  let service: SupabaseOrientationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseOrientationService();
  });

  describe('getOrientationsBySurgeryId', () => {
    it('deve retornar orientações ordenadas por created_at desc', async () => {
      const mockOrientations = [
        {
          id: 'o1',
          surgery_id: 's1',
          doctor_id: 'd1',
          content: 'Orientação 1',
          created_at: '2026-05-06T10:00:00Z',
          updated_at: null,
        },
        {
          id: 'o2',
          surgery_id: 's1',
          doctor_id: 'd1',
          content: 'Orientação 2',
          created_at: '2026-05-05T10:00:00Z',
          updated_at: null,
        },
      ];

      const chain = createChainMock(mockOrientations);
      mockFrom.mockReturnValue(chain);

      const result = await service.getOrientationsBySurgeryId('s1');

      expect(mockFrom).toHaveBeenCalledWith('doctor_orientations');
      expect(chain.eq).toHaveBeenCalledWith('surgery_id', 's1');
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Orientação 1');
    });

    it('deve retornar array vazio quando não há orientações', async () => {
      const chain = createChainMock([]);
      mockFrom.mockReturnValue(chain);

      const result = await service.getOrientationsBySurgeryId('s-empty');

      expect(result).toHaveLength(0);
    });

    it('deve retornar array vazio quando data é null', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      const result = await service.getOrientationsBySurgeryId('s-null');

      expect(result).toHaveLength(0);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'DB error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getOrientationsBySurgeryId('s1')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('addOrientation', () => {
    it('deve inserir nova orientação e retornar resultado', async () => {
      const mockResult = {
        id: 'o-new',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Nova orientação',
        created_at: '2026-05-06T12:00:00Z',
        updated_at: null,
      };

      const chain = createChainMock(mockResult);
      mockFrom.mockReturnValue(chain);

      const result = await service.addOrientation('s1', 'd1', 'Nova orientação');

      expect(mockFrom).toHaveBeenCalledWith('doctor_orientations');
      expect(chain.insert).toHaveBeenCalledWith({
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Nova orientação',
      });
      expect(result.id).toBe('o-new');
      expect(result.content).toBe('Nova orientação');
    });

    it('deve lançar erro quando supabase retorna erro na inserção', async () => {
      const chain = createChainMock(null, { message: 'Insert error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.addOrientation('s1', 'd1', 'test')).rejects.toEqual({ message: 'Insert error' });
    });
  });

  describe('updateOrientation', () => {
    it('deve atualizar orientação e retornar resultado', async () => {
      const mockResult = {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação atualizada',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: '2026-05-06T14:00:00Z',
      };

      const chain = createChainMock(mockResult);
      mockFrom.mockReturnValue(chain);

      const result = await service.updateOrientation('o1', 'Orientação atualizada');

      expect(mockFrom).toHaveBeenCalledWith('doctor_orientations');
      expect(chain.update).toHaveBeenCalledWith({ content: 'Orientação atualizada' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'o1');
      expect(result.id).toBe('o1');
      expect(result.content).toBe('Orientação atualizada');
    });

    it('deve lançar erro quando supabase retorna erro na atualização', async () => {
      const chain = createChainMock(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.updateOrientation('o1', 'test')).rejects.toEqual({ message: 'Update error' });
    });
  });

  describe('deleteOrientation', () => {
    it('deve deletar orientação por ID', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      await service.deleteOrientation('o1');

      expect(mockFrom).toHaveBeenCalledWith('doctor_orientations');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'o1');
    });

    it('deve lançar erro quando supabase retorna erro na deleção', async () => {
      const chain = createChainMock(null, { message: 'Delete error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.deleteOrientation('o1')).rejects.toEqual({ message: 'Delete error' });
    });
  });
});
