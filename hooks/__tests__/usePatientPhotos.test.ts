import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetPhotosBySurgeryId = jest.fn();
const mockUploadPhoto = jest.fn();
const mockDeletePhoto = jest.fn();
const mockGetPhotosCountByDate = jest.fn();

jest.mock('../../services', () => ({
    photoService: {
        getPhotosBySurgeryId: (...args: any[]) => mockGetPhotosBySurgeryId(...args),
        uploadPhoto: (...args: any[]) => mockUploadPhoto(...args),
        deletePhoto: (...args: any[]) => mockDeletePhoto(...args),
        getPhotosCountByDate: (...args: any[]) => mockGetPhotosCountByDate(...args),
    },
}));

import { usePatientPhotos, usePhotosCountByDate, useUploadPhoto, useDeletePhoto } from '../usePatientPhotos';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('usePatientPhotos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve estar desabilitado sem surgeryId', () => {
        const { result } = renderHook(() => usePatientPhotos(undefined), {
            wrapper: createWrapper(),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('deve retornar fotos de uma cirurgia', async () => {
        const mockPhotos = [
            { id: '1', patient_id: 'p1', surgery_id: 's1', photo_date: '2026-01-01', storage_path: 'p1/1.jpg', created_at: '2026-01-01', signedUrl: 'https://url1' },
            { id: '2', patient_id: 'p1', surgery_id: 's1', photo_date: '2026-01-02', storage_path: 'p1/2.jpg', created_at: '2026-01-02', signedUrl: 'https://url2' },
        ];
        mockGetPhotosBySurgeryId.mockResolvedValue(mockPhotos);

        const { result } = renderHook(() => usePatientPhotos('s1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockPhotos);
        expect(mockGetPhotosBySurgeryId).toHaveBeenCalledWith('s1');
    });

    it('deve tratar erro do serviço', async () => {
        mockGetPhotosBySurgeryId.mockRejectedValue(new Error('Service error'));

        const { result } = renderHook(() => usePatientPhotos('s1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe('Service error');
    });
});

describe('usePhotosCountByDate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve estar desabilitado sem patientId', () => {
        const { result } = renderHook(() => usePhotosCountByDate(undefined, '2026-01-01'), {
            wrapper: createWrapper(),
        });
        expect(result.current.fetchStatus).toBe('idle');
    });

    it('deve retornar contagem de fotos', async () => {
        mockGetPhotosCountByDate.mockResolvedValue(2);

        const { result } = renderHook(() => usePhotosCountByDate('p1', '2026-01-01'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBe(2);
    });
});

describe('useUploadPhoto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar estado inicial de mutation', () => {
        const { result } = renderHook(() => useUploadPhoto(), {
            wrapper: createWrapper(),
        });
        expect(result.current.isPending).toBe(false);
    });
});

describe('useDeletePhoto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve retornar estado inicial de mutation', () => {
        const { result } = renderHook(() => useDeletePhoto(), {
            wrapper: createWrapper(),
        });
        expect(result.current.isPending).toBe(false);
    });
});
