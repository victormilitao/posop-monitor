const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
    getItemAsync: (...args: any[]) => mockGetItemAsync(...args),
    setItemAsync: (...args: any[]) => mockSetItemAsync(...args),
}));

const mockGetSession = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('../../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: (...args: any[]) => mockGetSession(...args),
            updateUser: (...args: any[]) => mockUpdateUser(...args),
        },
    },
}));

import { SupabaseTermsService } from '../termsService';

describe('SupabaseTermsService', () => {
    let service: SupabaseTermsService;

    beforeEach(() => {
        service = new SupabaseTermsService();
        jest.clearAllMocks();
    });

    describe('hasAcceptedTerms', () => {
        it('deve retornar true quando aceito no SecureStore', async () => {
            mockGetItemAsync.mockResolvedValue('true');

            const result = await service.hasAcceptedTerms('user-1');

            expect(result).toBe(true);
            expect(mockGetItemAsync).toHaveBeenCalledWith('terms_accepted_user-1');
            // Should not check Supabase if SecureStore already has it
            expect(mockGetSession).not.toHaveBeenCalled();
        });

        it('deve retornar true quando aceito no user_metadata e sincronizar com SecureStore', async () => {
            mockGetItemAsync.mockResolvedValue(null);
            mockGetSession.mockResolvedValue({
                data: {
                    session: {
                        user: {
                            user_metadata: { terms_accepted: true },
                        },
                    },
                },
            });

            const result = await service.hasAcceptedTerms('user-2');

            expect(result).toBe(true);
            // Should sync to SecureStore
            expect(mockSetItemAsync).toHaveBeenCalledWith('terms_accepted_user-2', 'true');
        });

        it('deve retornar false quando não aceito em nenhum lugar', async () => {
            mockGetItemAsync.mockResolvedValue(null);
            mockGetSession.mockResolvedValue({
                data: {
                    session: {
                        user: {
                            user_metadata: {},
                        },
                    },
                },
            });

            const result = await service.hasAcceptedTerms('user-3');

            expect(result).toBe(false);
            expect(mockSetItemAsync).not.toHaveBeenCalled();
        });

        it('deve retornar false quando sessão não existe', async () => {
            mockGetItemAsync.mockResolvedValue(null);
            mockGetSession.mockResolvedValue({
                data: { session: null },
            });

            const result = await service.hasAcceptedTerms('user-4');

            expect(result).toBe(false);
        });

        it('deve retornar false quando ocorre erro', async () => {
            mockGetItemAsync.mockRejectedValue(new Error('Storage error'));

            const result = await service.hasAcceptedTerms('user-5');

            expect(result).toBe(false);
        });
    });

    describe('acceptTerms', () => {
        it('deve salvar aceite no SecureStore e no Supabase', async () => {
            mockSetItemAsync.mockResolvedValue(undefined);
            mockUpdateUser.mockResolvedValue({ error: null });

            await service.acceptTerms('user-1');

            expect(mockSetItemAsync).toHaveBeenCalledWith('terms_accepted_user-1', 'true');
            expect(mockUpdateUser).toHaveBeenCalledWith({
                data: { terms_accepted: true },
            });
        });

        it('não deve lançar erro quando Supabase falha mas SecureStore funciona', async () => {
            mockSetItemAsync.mockResolvedValue(undefined);
            mockUpdateUser.mockResolvedValue({ error: { message: 'Network error' } });

            // Should not throw
            await expect(service.acceptTerms('user-2')).resolves.not.toThrow();
            expect(mockSetItemAsync).toHaveBeenCalledWith('terms_accepted_user-2', 'true');
        });

        it('deve propagar erro quando SecureStore falha', async () => {
            mockSetItemAsync.mockRejectedValue(new Error('SecureStore error'));

            await expect(service.acceptTerms('user-3')).rejects.toThrow('SecureStore error');
        });
    });
});
