import { SupabaseDeviceTokenService } from '../deviceTokenService';

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
  chain.upsert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockReturnValue(chain);

  // Make the chain itself awaitable
  (chain as any).then = (resolve: (v: unknown) => void) => resolve(result);

  return chain;
}

describe('SupabaseDeviceTokenService', () => {
  let service: SupabaseDeviceTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseDeviceTokenService();
  });

  describe('upsertToken', () => {
    it('deve inserir ou atualizar token de dispositivo', async () => {
      const mockToken = {
        id: 'dt1',
        user_id: 'u1',
        push_token: 'ExponentPushToken[abc123]',
        platform: 'ios',
        is_active: true,
        created_at: '2026-05-06T10:00:00Z',
        updated_at: '2026-05-06T10:00:00Z',
      };

      const chain = createChainMock(mockToken);
      mockFrom.mockReturnValue(chain);

      const result = await service.upsertToken('u1', 'ExponentPushToken[abc123]', 'ios');

      expect(mockFrom).toHaveBeenCalledWith('device_tokens');
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          push_token: 'ExponentPushToken[abc123]',
          platform: 'ios',
          is_active: true,
        }),
        { onConflict: 'user_id,push_token' }
      );
      expect(result.id).toBe('dt1');
      expect(result.push_token).toBe('ExponentPushToken[abc123]');
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Upsert error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.upsertToken('u1', 'token', 'ios')).rejects.toEqual({ message: 'Upsert error' });
    });
  });

  describe('deactivateToken', () => {
    it('deve desativar token de dispositivo', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      await service.deactivateToken('ExponentPushToken[abc123]');

      expect(mockFrom).toHaveBeenCalledWith('device_tokens');
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false })
      );
      expect(chain.eq).toHaveBeenCalledWith('push_token', 'ExponentPushToken[abc123]');
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'Update error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.deactivateToken('token')).rejects.toEqual({ message: 'Update error' });
    });
  });

  describe('getActiveTokensByUserId', () => {
    it('deve retornar tokens ativos do usuário', async () => {
      const mockTokens = [
        {
          id: 'dt1',
          user_id: 'u1',
          push_token: 'ExponentPushToken[abc123]',
          platform: 'ios',
          is_active: true,
          created_at: '2026-05-06T10:00:00Z',
          updated_at: null,
        },
      ];

      const chain = createChainMock(mockTokens);
      mockFrom.mockReturnValue(chain);

      const result = await service.getActiveTokensByUserId('u1');

      expect(mockFrom).toHaveBeenCalledWith('device_tokens');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio quando não há tokens', async () => {
      const chain = createChainMock([]);
      mockFrom.mockReturnValue(chain);

      const result = await service.getActiveTokensByUserId('u1');

      expect(result).toHaveLength(0);
    });

    it('deve retornar array vazio quando data é null', async () => {
      const chain = createChainMock(null);
      mockFrom.mockReturnValue(chain);

      const result = await service.getActiveTokensByUserId('u1');

      expect(result).toHaveLength(0);
    });

    it('deve lançar erro quando supabase retorna erro', async () => {
      const chain = createChainMock(null, { message: 'DB error' });
      mockFrom.mockReturnValue(chain);

      await expect(service.getActiveTokensByUserId('u1')).rejects.toEqual({ message: 'DB error' });
    });
  });
});
