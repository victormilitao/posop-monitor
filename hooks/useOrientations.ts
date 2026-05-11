import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { orientationService } from '../services';
import { DoctorOrientation } from '../services/types';

export const useOrientationsBySurgery = (
  surgeryId: string | undefined | null,
  options?: Omit<UseQueryOptions<DoctorOrientation[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<DoctorOrientation[], Error>({
    queryKey: ['doctor-orientations', surgeryId],
    queryFn: () => {
      if (!surgeryId) throw new Error('Surgery ID is required');
      return orientationService.getOrientationsBySurgeryId(surgeryId);
    },
    enabled: !!surgeryId,
    ...options,
  });
};

export const useAddOrientation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surgeryId, doctorId, content }: { surgeryId: string; doctorId: string; content: string }) =>
      orientationService.addOrientation(surgeryId, doctorId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-orientations', variables.surgeryId] });
    },
  });
};

export const useUpdateOrientation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orientationId, surgeryId, content }: { orientationId: string; surgeryId: string; content: string }) =>
      orientationService.updateOrientation(orientationId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-orientations', variables.surgeryId] });
    },
  });
};

export const useDeleteOrientation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orientationId, surgeryId }: { orientationId: string; surgeryId: string }) =>
      orientationService.deleteOrientation(orientationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-orientations', variables.surgeryId] });
    },
  });
};
