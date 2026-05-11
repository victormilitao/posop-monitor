import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetDistinctHospitals = jest.fn();

jest.mock('../../services', () => ({
  surgeryService: {
    getDistinctHospitals: (...args: any[]) => mockGetDistinctHospitals(...args),
  },
}));

import { useHospitalSuggestions } from '../useHospitalSuggestions';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useHospitalSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar hospitais distintos para o médico', async () => {
    const mockHospitals = ['Hospital São Lucas', 'Clínica Santa Clara'];
    mockGetDistinctHospitals.mockResolvedValue(mockHospitals);

    const { result } = renderHook(() => useHospitalSuggestions('d1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHospitals);
    expect(mockGetDistinctHospitals).toHaveBeenCalledWith('d1');
  });

  it('deve estar desabilitado sem doctorId', () => {
    const { result } = renderHook(() => useHospitalSuggestions(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetDistinctHospitals).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando serviço falha', async () => {
    mockGetDistinctHospitals.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useHospitalSuggestions('d1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('DB error');
  });

  it('deve retornar lista vazia quando não há hospitais', async () => {
    mockGetDistinctHospitals.mockResolvedValue([]);

    const { result } = renderHook(() => useHospitalSuggestions('d1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
