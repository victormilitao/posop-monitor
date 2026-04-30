import { supabase } from '../../lib/supabase';
import { compressImage, generateStoragePath, getLocalDateString } from '../../lib/imageUtils';
import { IPhotoService, PatientPhoto } from '../types';

const BUCKET_NAME = 'patient-photos';
const SIGNED_URL_EXPIRY = 3600; // 1 hora

export class SupabasePhotoService implements IPhotoService {
    /**
     * Busca fotos de uma cirurgia ordenadas da mais antiga para a mais recente.
     */
    async getPhotosBySurgeryId(surgeryId: string): Promise<PatientPhoto[]> {
        const { data, error } = await supabase
            .from('patient_photos')
            .select('*')
            .eq('surgery_id', surgeryId)
            .order('photo_date', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return this.attachSignedUrls(data);
    }

    /**
     * Faz upload de uma foto comprimida e cria o registro no banco.
     */
    async uploadPhoto(
        patientId: string,
        surgeryId: string,
        imageUri: string,
        photoDate?: string
    ): Promise<PatientPhoto> {
        // 1. Comprimir imagem
        const compressedUri = await compressImage(imageUri);

        // 2. Gerar path de armazenamento
        const storagePath = generateStoragePath(patientId);

        // 3. Preparar arquivo para upload (React Native)
        // Em React Native, fetch(fileUri).blob() retorna blob vazio.
        // Usamos FormData que o RN resolve nativamente com multipart/form-data.
        const formData = new FormData();
        formData.append('', {
            uri: compressedUri,
            name: storagePath.split('/').pop() || 'photo.jpg',
            type: 'image/jpeg',
        } as unknown as Blob);

        // 4. Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, formData, {
                contentType: 'multipart/form-data',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // 5. Criar registro na tabela
        const dateToUse = photoDate || getLocalDateString();
        const { data, error: insertError } = await supabase
            .from('patient_photos')
            .insert({
                patient_id: patientId,
                surgery_id: surgeryId,
                storage_path: storagePath,
                photo_date: dateToUse,
            })
            .select()
            .single();

        if (insertError) {
            // Rollback: deletar do storage se insert falhar
            await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
            throw insertError;
        }

        // 6. Retornar com signed URL
        const photos = await this.attachSignedUrls([data]);
        return photos[0];
    }

    /**
     * Substitui a imagem de uma foto existente.
     * Mantém o registro original, atualizando apenas o storage_path.
     */
    async replacePhoto(
        photoId: string,
        patientId: string,
        oldStoragePath: string,
        imageUri: string
    ): Promise<PatientPhoto> {
        // 1. Comprimir nova imagem
        const compressedUri = await compressImage(imageUri);

        // 2. Gerar novo path de armazenamento
        const newStoragePath = generateStoragePath(patientId);

        // 3. Upload da nova imagem
        const formData = new FormData();
        formData.append('', {
            uri: compressedUri,
            name: newStoragePath.split('/').pop() || 'photo.jpg',
            type: 'image/jpeg',
        } as unknown as Blob);

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(newStoragePath, formData, {
                contentType: 'multipart/form-data',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        // 4. Atualizar registro no banco com novo path
        const { data, error: updateError } = await supabase
            .from('patient_photos')
            .update({ storage_path: newStoragePath })
            .eq('id', photoId)
            .select()
            .single();

        if (updateError) {
            // Rollback: deletar nova imagem do storage
            await supabase.storage.from(BUCKET_NAME).remove([newStoragePath]);
            throw updateError;
        }

        // 5. Deletar imagem antiga do storage (best-effort)
        await supabase.storage.from(BUCKET_NAME).remove([oldStoragePath]);

        // 6. Retornar com signed URL
        const photos = await this.attachSignedUrls([data]);
        return photos[0];
    }

    /**
     * Deleta uma foto do storage e do banco de dados.
     */
    async deletePhoto(photoId: string, storagePath: string): Promise<void> {
        // 1. Deletar do storage
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([storagePath]);

        if (storageError) throw storageError;

        // 2. Deletar registro
        const { error: dbError } = await supabase
            .from('patient_photos')
            .delete()
            .eq('id', photoId);

        if (dbError) throw dbError;
    }

    /**
     * Conta quantas fotos o paciente tem em uma data específica.
     */
    async getPhotosCountByDate(patientId: string, date: string): Promise<number> {
        const { count, error } = await supabase
            .from('patient_photos')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patientId)
            .eq('photo_date', date);

        if (error) throw error;
        return count || 0;
    }

    /**
     * Gera signed URLs em batch para uma lista de fotos.
     */
    private async attachSignedUrls(photos: PatientPhoto[]): Promise<PatientPhoto[]> {
        if (photos.length === 0) return [];

        const paths = photos.map(p => p.storage_path);
        const { data: signedData, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrls(paths, SIGNED_URL_EXPIRY);

        if (error || !signedData) {
            // Se falhar, retorna fotos sem URL
            return photos;
        }

        return photos.map((photo, index) => ({
            ...photo,
            signedUrl: signedData[index]?.signedUrl || undefined,
        }));
    }
}

export const photoService = new SupabasePhotoService();
