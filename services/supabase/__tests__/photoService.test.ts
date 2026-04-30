import { SupabasePhotoService } from '../photoService';

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

const mockUpload = jest.fn();
const mockRemove = jest.fn();
const mockCreateSignedUrls = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock('../../../lib/supabase', () => ({
    supabase: {
        from: (...args: unknown[]) => mockFrom(...args),
        storage: {
            from: (...args: unknown[]) => mockStorageFrom(...args),
        },
    },
}));

jest.mock('../../../lib/imageUtils', () => ({
    compressImage: jest.fn((uri: string) => Promise.resolve(`${uri}_compressed`)),
    generateStoragePath: jest.fn(() => 'patient-1/2026-01-01_abc.jpg'),
    getLocalDateString: jest.fn(() => '2026-01-01'),
}));



describe('SupabasePhotoService', () => {
    let service: SupabasePhotoService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SupabasePhotoService();

        mockStorageFrom.mockReturnValue({
            upload: mockUpload,
            remove: mockRemove,
            createSignedUrls: mockCreateSignedUrls,
        });
    });

    describe('getPhotosBySurgeryId', () => {
        it('deve retornar fotos ordenadas com signed URLs', async () => {
            const mockPhotos = [
                { id: '1', patient_id: 'p1', surgery_id: 's1', photo_date: '2026-01-01', storage_path: 'p1/photo1.jpg', created_at: '2026-01-01T10:00:00' },
                { id: '2', patient_id: 'p1', surgery_id: 's1', photo_date: '2026-01-02', storage_path: 'p1/photo2.jpg', created_at: '2026-01-02T10:00:00' },
            ];

            const chain: any = {};
            chain.select = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.order = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: (v: unknown) => void) => resolve({ data: mockPhotos, error: null });
            mockFrom.mockReturnValue(chain);

            mockCreateSignedUrls.mockResolvedValue({
                data: [
                    { signedUrl: 'https://signed-url-1' },
                    { signedUrl: 'https://signed-url-2' },
                ],
                error: null,
            });

            const result = await service.getPhotosBySurgeryId('s1');

            expect(mockFrom).toHaveBeenCalledWith('patient_photos');
            expect(result).toHaveLength(2);
            expect(result[0].signedUrl).toBe('https://signed-url-1');
            expect(result[1].signedUrl).toBe('https://signed-url-2');
        });

        it('deve retornar array vazio quando não há fotos', async () => {
            const chain: any = {};
            chain.select = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.order = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: (v: unknown) => void) => resolve({ data: [], error: null });
            mockFrom.mockReturnValue(chain);

            const result = await service.getPhotosBySurgeryId('s1');
            expect(result).toHaveLength(0);
        });

        it('deve lançar erro quando supabase retorna erro', async () => {
            const chain: any = {};
            chain.select = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.order = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: 'DB error' } });
            mockFrom.mockReturnValue(chain);

            await expect(service.getPhotosBySurgeryId('s1')).rejects.toEqual({ message: 'DB error' });
        });
    });

    describe('uploadPhoto', () => {
        it('deve comprimir, fazer upload e criar registro', async () => {
            mockUpload.mockResolvedValue({ error: null });

            const insertedPhoto = {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-01',
                storage_path: 'p1/2026-01-01_abc.jpg',
                created_at: '2026-01-01T10:00:00',
            };

            const chain: any = {};
            chain.insert = jest.fn().mockReturnValue(chain);
            chain.select = jest.fn().mockReturnValue(chain);
            chain.single = jest.fn().mockResolvedValue({ data: insertedPhoto, error: null });
            mockFrom.mockReturnValue(chain);

            mockCreateSignedUrls.mockResolvedValue({
                data: [{ signedUrl: 'https://signed-photo-url' }],
                error: null,
            });

            const result = await service.uploadPhoto('p1', 's1', 'file:///photo.jpg');

            expect(mockUpload).toHaveBeenCalled();
            expect(result.id).toBe('photo-1');
            expect(result.signedUrl).toBe('https://signed-photo-url');
        });

        it('deve usar photoDate quando fornecido', async () => {
            mockUpload.mockResolvedValue({ error: null });

            const insertedPhoto = {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-05',
                storage_path: 'p1/2026-01-01_abc.jpg',
                created_at: '2026-01-01T10:00:00',
            };

            const chain: any = {};
            chain.insert = jest.fn().mockReturnValue(chain);
            chain.select = jest.fn().mockReturnValue(chain);
            chain.single = jest.fn().mockResolvedValue({ data: insertedPhoto, error: null });
            mockFrom.mockReturnValue(chain);

            mockCreateSignedUrls.mockResolvedValue({
                data: [{ signedUrl: 'https://signed-photo-url' }],
                error: null,
            });

            await service.uploadPhoto('p1', 's1', 'file:///photo.jpg', '2026-01-05');

            expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
                photo_date: '2026-01-05',
            }));
        });

        it('deve fazer rollback se inserção falhar', async () => {
            mockUpload.mockResolvedValue({ error: null });

            const chain: any = {};
            chain.insert = jest.fn().mockReturnValue(chain);
            chain.select = jest.fn().mockReturnValue(chain);
            chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } });
            mockFrom.mockReturnValue(chain);

            await expect(service.uploadPhoto('p1', 's1', 'file:///photo.jpg')).rejects.toEqual({ message: 'Insert error' });
            expect(mockRemove).toHaveBeenCalled();
        });
    });

    describe('replacePhoto', () => {
        it('deve comprimir, fazer upload, atualizar registro e deletar imagem antiga', async () => {
            mockUpload.mockResolvedValue({ error: null });
            mockRemove.mockResolvedValue({ error: null });

            const updatedPhoto = {
                id: 'photo-1',
                patient_id: 'p1',
                surgery_id: 's1',
                photo_date: '2026-01-01',
                storage_path: 'p1/2026-01-01_new.jpg',
                created_at: '2026-01-01T10:00:00',
            };

            const chain: any = {};
            chain.update = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.select = jest.fn().mockReturnValue(chain);
            chain.single = jest.fn().mockResolvedValue({ data: updatedPhoto, error: null });
            mockFrom.mockReturnValue(chain);

            mockCreateSignedUrls.mockResolvedValue({
                data: [{ signedUrl: 'https://signed-new-url' }],
                error: null,
            });

            const result = await service.replacePhoto('photo-1', 'p1', 'p1/old.jpg', 'file:///new.jpg');

            expect(mockUpload).toHaveBeenCalled();
            expect(chain.update).toHaveBeenCalled();
            expect(mockRemove).toHaveBeenCalledWith(['p1/old.jpg']);
            expect(result.signedUrl).toBe('https://signed-new-url');
        });

        it('deve fazer rollback se atualização falhar', async () => {
            mockUpload.mockResolvedValue({ error: null });

            const chain: any = {};
            chain.update = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.select = jest.fn().mockReturnValue(chain);
            chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'Update error' } });
            mockFrom.mockReturnValue(chain);

            await expect(
                service.replacePhoto('photo-1', 'p1', 'p1/old.jpg', 'file:///new.jpg')
            ).rejects.toEqual({ message: 'Update error' });
            // Nova imagem deve ser removida como rollback
            expect(mockRemove).toHaveBeenCalled();
        });
    });

    describe('deletePhoto', () => {
        it('deve deletar do storage e do banco', async () => {
            mockRemove.mockResolvedValue({ error: null });

            const chain: any = {};
            chain.delete = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockResolvedValue({ error: null });
            mockFrom.mockReturnValue(chain);

            await service.deletePhoto('photo-1', 'p1/photo.jpg');

            expect(mockRemove).toHaveBeenCalledWith(['p1/photo.jpg']);
            expect(chain.delete).toHaveBeenCalled();
        });

        it('deve lançar erro se storage falhar', async () => {
            mockRemove.mockResolvedValue({ error: { message: 'Storage error' } });

            await expect(service.deletePhoto('photo-1', 'p1/photo.jpg')).rejects.toEqual({ message: 'Storage error' });
        });
    });

    describe('getPhotosCountByDate', () => {
        it('deve retornar contagem de fotos', async () => {
            const chain: any = {};
            chain.select = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: (v: unknown) => void) => resolve({ count: 2, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await service.getPhotosCountByDate('p1', '2026-01-01');
            expect(result).toBe(2);
        });

        it('deve retornar 0 quando count é null', async () => {
            const chain: any = {};
            chain.select = jest.fn().mockReturnValue(chain);
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: (v: unknown) => void) => resolve({ count: null, error: null });
            mockFrom.mockReturnValue(chain);

            const result = await service.getPhotosCountByDate('p1', '2026-01-01');
            expect(result).toBe(0);
        });
    });
});

