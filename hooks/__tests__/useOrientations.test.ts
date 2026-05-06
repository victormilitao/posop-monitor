import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrientationsBySurgery, useAddOrientation, useUpdateOrientation, useDeleteOrientation } from '../useOrientations';

// Mock the service
jest.mock('../../services', () => ({
  orientationService: {
    getOrientationsBySurgeryId: jest.fn(),
    addOrientation: jest.fn(),
    updateOrientation: jest.fn(),
    deleteOrientation: jest.fn(),
  },
}));

const { orientationService } = require('../../services');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useOrientations hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useOrientationsBySurgery', () => {
    it('deve retornar orientações quando surgeryId é fornecido', async () => {
      const mockOrientations = [
        {
          id: 'o1',
          surgery_id: 's1',
          doctor_id: 'd1',
          content: 'Orientação 1',
          created_at: '2026-05-06T10:00:00Z',
          updated_at: null,
        },
      ];
      orientationService.getOrientationsBySurgeryId.mockResolvedValue(mockOrientations);

      const { result } = renderHook(() => useOrientationsBySurgery('s1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockOrientations);
      expect(orientationService.getOrientationsBySurgeryId).toHaveBeenCalledWith('s1');
    });

    it('não deve executar query quando surgeryId é undefined', () => {
      const { result } = renderHook(() => useOrientationsBySurgery(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(orientationService.getOrientationsBySurgeryId).not.toHaveBeenCalled();
    });

    it('não deve executar query quando surgeryId é null', () => {
      const { result } = renderHook(() => useOrientationsBySurgery(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(orientationService.getOrientationsBySurgeryId).not.toHaveBeenCalled();
    });
  });

  describe('useAddOrientation', () => {
    it('deve chamar addOrientation com os dados corretos', async () => {
      const mockResult = {
        id: 'o-new',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Nova orientação',
        created_at: '2026-05-06T12:00:00Z',
        updated_at: null,
      };
      orientationService.addOrientation.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useAddOrientation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        surgeryId: 's1',
        doctorId: 'd1',
        content: 'Nova orientação',
      });

      expect(orientationService.addOrientation).toHaveBeenCalledWith('s1', 'd1', 'Nova orientação');
    });
  });

  describe('useUpdateOrientation', () => {
    it('deve chamar updateOrientation com os dados corretos', async () => {
      const mockResult = {
        id: 'o1',
        surgery_id: 's1',
        doctor_id: 'd1',
        content: 'Orientação atualizada',
        created_at: '2026-05-06T10:00:00Z',
        updated_at: '2026-05-06T14:00:00Z',
      };
      orientationService.updateOrientation.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useUpdateOrientation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        orientationId: 'o1',
        surgeryId: 's1',
        content: 'Orientação atualizada',
      });

      expect(orientationService.updateOrientation).toHaveBeenCalledWith('o1', 'Orientação atualizada');
    });
  });

  describe('useDeleteOrientation', () => {
    it('deve chamar deleteOrientation com o ID correto', async () => {
      orientationService.deleteOrientation.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteOrientation(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        orientationId: 'o1',
        surgeryId: 's1',
      });

      expect(orientationService.deleteOrientation).toHaveBeenCalledWith('o1');
    });
  });
});
