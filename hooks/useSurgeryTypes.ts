import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { surgeryTypeService } from '../services';
import { Database } from '../types/supabase';

type SurgeryType = Database['public']['Tables']['surgery_types']['Row'];

export const useSurgeryTypes = (
  patientSex?: string,
  options?: Omit<UseQueryOptions<SurgeryType[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SurgeryType[], Error>({
    queryKey: ['surgery-types', patientSex ?? 'all'],
    queryFn: () => surgeryTypeService.getActiveSurgeryTypes(patientSex),
    ...options
  });
};

export const useSurgeryType = (
  id: string | undefined,
  options?: Omit<UseQueryOptions<SurgeryType | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SurgeryType | null, Error>({
    queryKey: ['surgery-type', id],
    queryFn: () => {
      if (!id) throw new Error('Surgery type ID is required');
      return surgeryTypeService.getSurgeryTypeById(id);
    },
    enabled: !!id,
    ...options
  });
};
