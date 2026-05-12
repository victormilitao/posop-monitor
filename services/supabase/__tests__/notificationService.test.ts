import { SupabaseNotificationService } from '../notificationService';

// Mock supabase
const mockFrom = jest.fn();
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function createChainMock(finalData: unknown, finalError: unknown = null, count?: number) {
  const result = { data: finalData, error: finalError, count: count ?? null };
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockReturnValue(chain);

  // Make the chain itself awaitable
  (chain as any).then = (resolve: (v: unknown) => void) => resolve(result);

  return chain;
}

describe('SupabaseNotificationService', () => {
  let service: SupabaseNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseNotificationService();
  });

  describe('getUnreadNotifications', () => {
    it('deve retornar notificações não lidas ordenadas por created_at desc', async () => {
      const mockNotifications = [
        {
          id: 'n1',
          user_id: 'u1',
          type: 'new_orientation',
          title: 'Nova orientação',
          body: 'Dr. João: Repouse por 48h',
          data: { surgeryId: 's1', orientationId: 'o1' },
          is_read: false,
          created_at: '2026-05-06T10:00:00Z',
        },
      ];

      const chain = createChainMock(mockNotifications);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadNotifications('u1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('new_orientation');
    });

    it('deve retornar array vazio quando não há notificações', async () => {
      const chain = createChainMock([]);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadNotifications('u1');

      expect(result).toHaveLength(0);
    });

    it('deve retornar array vazio quando data é null', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadNotifications('u1');

      expect(result).toHaveLength(0);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'DB error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getUnreadNotifications('u1')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('getNotifications', () => {
    it('deve retornar notificações com limite padrão', async () => {
      const mockNotifications = [
        {
          id: 'n1',
          user_id: 'u1',
          type: 'new_orientation',
          title: 'Nova orientação',
          body: 'Test',
          data: {},
          is_read: false,
          created_at: '2026-05-06T10:00:00Z',
        },
      ];

      const chain = createChainMock(mockNotifications);
      mockFrom.mockReturnValue(chain);

      const result = await service.getNotifications('u1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.limit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(1);
    });

    it('deve aceitar limite customizado', async () => {
      const chain = createChainMock([]);
      mockFrom.mockReturnValue(chain);

      await service.getNotifications('u1', 10);

      expect(chain.limit).toHaveBeenCalledWith(10);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'DB error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getNotifications('u1')).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      await service.markAsRead('n1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'n1');
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.markAsRead('n1')).rejects.toEqual({ message: 'Update error' });
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações não lidas como lidas', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      await service.markAllAsRead('u1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.markAllAsRead('u1')).rejects.toEqual({ message: 'Update error' });
    });
  });

  describe('getUnreadCount', () => {
    it('deve retornar contagem de notificações não lidas', async () => {
      const chain = createChainMock(null, null, 5);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadCount('u1');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
      expect(result).toBe(5);
    });

    it('deve retornar 0 quando count é null', async () => {
      const chain = createChainMock(null, null, undefined);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadCount('u1');

      expect(result).toBe(0);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Count error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getUnreadCount('u1')).rejects.toEqual({ message: 'Count error' });
    });
  });

  describe('getUnreadCountByType', () => {
    it('deve retornar contagem de notificações não lidas por tipo', async () => {
      const chain = createChainMock(null, null, 3);
      mockFrom.mockReturnValue(chain);

      const result = await service.getUnreadCountByType('u1', 'new_orientation');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('type', 'new_orientation');
      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
      expect(result).toBe(3);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Count error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getUnreadCountByType('u1', 'new_orientation')).rejects.toEqual({ message: 'Count error' });
    });
  });

  describe('markAsReadByType', () => {
    it('deve marcar notificações de um tipo como lidas', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      await service.markAsReadByType('u1', 'new_orientation');

      expect(mockFrom).toHaveBeenCalledWith('notifications');
      expect(chain.update).toHaveBeenCalledWith({ is_read: true });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('type', 'new_orientation');
      expect(chain.eq).toHaveBeenCalledWith('is_read', false);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.markAsReadByType('u1', 'new_orientation')).rejects.toEqual({ message: 'Update error' });
    });
  });
});
