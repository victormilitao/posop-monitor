import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { patientService } from '../services';
import { DoctorContactInfo } from '../services/types';

export const useDoctorContact = (
  patientId: string | undefined,
  options?: Omit<UseQueryOptions<DoctorContactInfo | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<DoctorContactInfo | null, Error>({
    queryKey: ['doctor-contact', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return patientService.getDoctorByPatientId(patientId);
    },
    enabled: !!patientId,
    ...options
  });
};
