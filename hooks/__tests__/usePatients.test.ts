import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock services
const mockGetPatientsByDoctorId = jest.fn();
const mockGetPatientById = jest.fn();

jest.mock('../../services', () => ({
  patientService: {
    getPatientsByDoctorId: (...args: any[]) => mockGetPatientsByDoctorId(...args),
    getPatientById: (...args: any[]) => mockGetPatientById(...args),
  },
}));

import { usePatientsByDoctor, usePatient } from '../usePatients';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePatients hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePatientsByDoctor', () => {
    it('deve estar desabilitado sem doctorId', () => {
      const { result } = renderHook(() => usePatientsByDoctor(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('deve buscar pacientes com doctorId', async () => {
      const mockPatients = [
        { id: 'p1', profile: { full_name: 'João' } },
      ];
      mockGetPatientsByDoctorId.mockResolvedValue(mockPatients);

      const { result } = renderHook(() => usePatientsByDoctor('d1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPatients);
      expect(mockGetPatientsByDoctorId).toHaveBeenCalledWith('d1');
    });
  });

  describe('usePatient', () => {
    it('deve estar desabilitado sem patientId', () => {
      const { result } = renderHook(() => usePatient(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('deve buscar paciente com patientId', async () => {
      const mockPatient = { id: 'p1', profile: { full_name: 'João' } };
      mockGetPatientById.mockResolvedValue(mockPatient);

      const { result } = renderHook(() => usePatient('p1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPatient);
    });
  });
});
