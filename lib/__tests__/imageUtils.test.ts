import { compressImage, generateStoragePath, getLocalDateString, PHOTO_CONFIG } from '../imageUtils';
import * as ImageManipulator from 'expo-image-manipulator';

describe('imageUtils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PHOTO_CONFIG', () => {
        it('deve ter configurações corretas de compressão', () => {
            expect(PHOTO_CONFIG.maxWidth).toBe(1280);
            expect(PHOTO_CONFIG.quality).toBe(0.7);
        });
    });

    describe('compressImage', () => {
        it('deve comprimir imagem com configurações corretas', async () => {
            const inputUri = 'file:///test/photo.jpg';
            const result = await compressImage(inputUri);

            expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
                inputUri,
                [{ resize: { width: 1280 } }],
                {
                    compress: 0.7,
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );
            expect(result).toBe(`${inputUri}_compressed`);
        });
    });

    describe('generateStoragePath', () => {
        it('deve gerar path no formato correto', () => {
            const patientId = 'patient-123';
            const path = generateStoragePath(patientId);

            expect(path).toMatch(/^patient-123\/\d{4}-\d{2}-\d{2}_\d+_[a-z0-9]+\.jpg$/);
        });

        it('deve conter o patientId no path', () => {
            const path = generateStoragePath('abc-def');
            expect(path.startsWith('abc-def/')).toBe(true);
        });
    });

    describe('getLocalDateString', () => {
        it('deve retornar data no formato YYYY-MM-DD', () => {
            const date = getLocalDateString();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});
