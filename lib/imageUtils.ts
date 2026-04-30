import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Configuração de compressão de imagem.
 * Valores inspirados no WhatsApp para economia de espaço.
 */
export const PHOTO_CONFIG = {
    maxWidth: 1280,
    quality: 0.7,
} as const;

/**
 * Comprime e redimensiona uma imagem para upload.
 * 
 * - Redimensiona para largura máxima de 1280px, mantendo aspect ratio original
 * - Converte para JPEG com 70% de qualidade
 * - Resultado típico: ~100-300KB (vs 3-8MB original)
 * 
 * @param uri URI local da imagem (câmera ou galeria)
 * @returns URI da imagem comprimida
 */
export async function compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: PHOTO_CONFIG.maxWidth } }],
        {
            compress: PHOTO_CONFIG.quality,
            format: ImageManipulator.SaveFormat.JPEG,
        }
    );
    return result.uri;
}

/**
 * Gera o path de armazenamento para uma foto do paciente.
 * Formato: {patientId}/{date}_{uuid}.jpg
 */
export function generateStoragePath(patientId: string): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = generateSimpleId();
    return `${patientId}/${dateStr}_${uuid}.jpg`;
}

/**
 * Gera um ID simples baseado em timestamp + random.
 */
function generateSimpleId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Retorna a data local no formato YYYY-MM-DD.
 */
export function getLocalDateString(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
}
