import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetPatientDashboardData = jest.fn();

jest.mock('../../services', () => ({
  patientService: {
    getPatientDashboardData: (...args: any[]) => mockGetPatientDashboardData(...args),
  },
}));

import { usePatientDashboard } from '../usePatientDashboard';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePatientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar desabilitado sem patientId', () => {
    const { result } = renderHook(() => usePatientDashboard(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('deve retornar dados do dashboard', async () => {
    const mockData = {
      profile: { id: 'p1', full_name: 'João' },
      currentSurgery: { id: 's1' },
      daysSinceSurgery: 5,
      totalRecoveryDays: 14,
    };
    mockGetPatientDashboardData.mockResolvedValue(mockData);

    const { result } = renderHook(() => usePatientDashboard('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('deve tratar erro do serviço', async () => {
    mockGetPatientDashboardData.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => usePatientDashboard('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Service error');
  });
});
