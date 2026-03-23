import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { surgeryService } from '../services';
import { SurgeryWithDetails } from '../services/types';
import { Database } from '../types/supabase';

type Surgery = Database['public']['Tables']['surgeries']['Row'];

export const useSurgeriesByDoctor = (
  doctorId: string | undefined,
  options?: Omit<UseQueryOptions<SurgeryWithDetails[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SurgeryWithDetails[], Error>({
    queryKey: ['surgeries', 'doctor', doctorId],
    queryFn: () => {
      if (!doctorId) throw new Error('Doctor ID is required');
      return surgeryService.getSurgeriesByDoctorId(doctorId);
    },
    enabled: !!doctorId,
    ...options
  });
};

export const useSurgery = (
  surgeryId: string | undefined,
  options?: Omit<UseQueryOptions<SurgeryWithDetails | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SurgeryWithDetails | null, Error>({
    queryKey: ['surgery', surgeryId],
    queryFn: () => {
      if (!surgeryId) throw new Error('Surgery ID is required');
      return surgeryService.getSurgeryById(surgeryId);
    },
    enabled: !!surgeryId,
    ...options
  });
};

export const useCreateSurgery = (
  options?: UseMutationOptions<
    Surgery,
    Error,
    {
      doctorId: string;
      patientId: string;
      surgeryTypeId: string;
      surgeryDate: string;
      notes?: string;
    }
  >
) => {
  return useMutation<
    Surgery,
    Error,
    {
      doctorId: string;
      patientId: string;
      surgeryTypeId: string;
      surgeryDate: string;
      notes?: string;
    }
  >({
    mutationFn: (data) => surgeryService.createSurgery(data),
    ...options
  });
};

export const useAutoFinalizeSurgeries = (doctorId: string | undefined) => {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!doctorId || hasRun.current) return;
    hasRun.current = true;

    surgeryService.finalizeSurgeriesPastRecovery(doctorId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['surgeries', 'doctor', doctorId] });
    }).catch((err) => {
      console.error('Error auto-finalizing surgeries:', err);
    });
  }, [doctorId, queryClient]);
};
