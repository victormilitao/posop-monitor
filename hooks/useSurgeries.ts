import { useInfiniteQuery, useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { surgeryService } from '../services';
import { PaginatedResult, SurgeryWithDetails } from '../services/types';
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

export const useCompletedSurgeriesByDoctor = (
  doctorId: string | undefined,
  searchName?: string,
) => {
  return useInfiniteQuery<PaginatedResult<SurgeryWithDetails>, Error>({
    queryKey: ['surgeries', 'completed', 'doctor', doctorId, searchName],
    queryFn: ({ pageParam = 0 }) => {
      if (!doctorId) throw new Error('Doctor ID is required');
      return surgeryService.getCompletedSurgeriesByDoctorId(doctorId, {
        page: pageParam as number,
        searchName,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!doctorId,
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
      followUpDays?: number;
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
      followUpDays?: number;
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

export const useDismissPendingReturn = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (surgeryId: string) => surgeryService.dismissPendingReturn(surgeryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['surgery'] });
      queryClient.invalidateQueries({ queryKey: ['surgeries', 'completed'] });
    },
  });
};
