import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetActiveSurgeryTypes = jest.fn();
const mockGetSurgeryTypeById = jest.fn();

jest.mock('../../services', () => ({
  surgeryTypeService: {
    getActiveSurgeryTypes: (...args: any[]) => mockGetActiveSurgeryTypes(...args),
    getSurgeryTypeById: (...args: any[]) => mockGetSurgeryTypeById(...args),
  },
}));

import { useSurgeryTypes, useSurgeryType } from '../useSurgeryTypes';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSurgeryTypes hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSurgeryTypes', () => {
    it('deve buscar tipos de cirurgia', async () => {
      const mockTypes = [{ id: 'st1', name: 'Artroscopia' }];
      mockGetActiveSurgeryTypes.mockResolvedValue(mockTypes);

      const { result } = renderHook(() => useSurgeryTypes(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockTypes);
    });
  });

  describe('useSurgeryType', () => {
    it('deve estar desabilitado sem id', () => {
      const { result } = renderHook(() => useSurgeryType(undefined), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('deve buscar tipo de cirurgia com id', async () => {
      const mockType = { id: 'st1', name: 'Artroscopia' };
      mockGetSurgeryTypeById.mockResolvedValue(mockType);

      const { result } = renderHook(() => useSurgeryType('st1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockType);
    });
  });
});
