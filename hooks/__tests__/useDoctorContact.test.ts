import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetDoctorByPatientId = jest.fn();

jest.mock('../../services', () => ({
  patientService: {
    getDoctorByPatientId: (...args: any[]) => mockGetDoctorByPatientId(...args),
  },
}));

import { useDoctorContact } from '../useDoctorContact';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDoctorContact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar desabilitado sem patientId', () => {
    const { result } = renderHook(() => useDoctorContact(undefined), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('deve retornar dados do médico', async () => {
    const mockData = {
      name: 'Dr. Carlos Silva',
      crm: 'CRM/CE 12345',
      email: 'carlos@medico.com',
      phone: '85999001122',
      phonePersonal: '85988001122',
    };
    mockGetDoctorByPatientId.mockResolvedValue(mockData);

    const { result } = renderHook(() => useDoctorContact('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetDoctorByPatientId).toHaveBeenCalledWith('p1');
  });

  it('deve tratar erro do serviço', async () => {
    mockGetDoctorByPatientId.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => useDoctorContact('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Service error');
  });

  it('deve retornar null quando médico não encontrado', async () => {
    mockGetDoctorByPatientId.mockResolvedValue(null);

    const { result } = renderHook(() => useDoctorContact('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
