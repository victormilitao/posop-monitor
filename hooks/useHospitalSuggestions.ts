import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { surgeryService } from '../services';

export const useHospitalSuggestions = (
  doctorId: string | undefined,
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<string[], Error>({
    queryKey: ['hospitals', 'doctor', doctorId],
    queryFn: () => {
      if (!doctorId) throw new Error('Doctor ID is required');
      return surgeryService.getDistinctHospitals(doctorId);
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
};
