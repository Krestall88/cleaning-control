import { createClient } from '@supabase/supabase-js';

// Supabase клиент для работы с Storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Создаем клиент только если переменные настроены
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL или Service Role Key не настроены в .env');
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
}

export { getSupabaseClient as supabase };

/**
 * Загружает файл в Supabase Storage
 * @param file - Файл для загрузки
 * @param bucket - Название bucket (по умолчанию 'uploads')
 * @param folder - Папка внутри bucket (опционально)
 * @returns URL загруженного файла
 */
export async function uploadToSupabase(
  file: File | Buffer,
  bucket: string = 'uploads',
  folder?: string
): Promise<string> {
  try {
    const client = getSupabaseClient();
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    
    let fileName: string;
    let fileBuffer: Buffer;
    let contentType: string;

    if (file instanceof Buffer) {
      // Если передан Buffer, нужно указать расширение
      fileName = `${timestamp}-${randomString}.jpg`;
      fileBuffer = file;
      contentType = 'image/jpeg';
    } else {
      // Если передан File
      const extension = file.name.split('.').pop() || 'jpg';
      fileName = `${timestamp}-${randomString}.${extension}`;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      contentType = file.type || 'image/jpeg';
    }

    // Формируем путь к файлу
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('📤 Загрузка файла в Supabase:', {
      bucket,
      filePath,
      size: fileBuffer.length,
      contentType
    });

    // Загружаем файл в Supabase Storage
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('❌ Ошибка загрузки в Supabase:', error);
      throw new Error(`Ошибка загрузки файла: ${error.message}`);
    }

    // Получаем публичный URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('✅ Файл успешно загружен в Supabase:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Ошибка при загрузке в Supabase:', error);
    throw error;
  }
}

/**
 * Удаляет файл из Supabase Storage
 * @param fileUrl - URL файла для удаления
 * @param bucket - Название bucket (по умолчанию 'uploads')
 */
export async function deleteFromSupabase(
  fileUrl: string,
  bucket: string = 'uploads'
): Promise<void> {
  try {
    const client = getSupabaseClient();
    
    // Извлекаем путь к файлу из URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(bucket);
    
    if (bucketIndex === -1) {
      throw new Error('Неверный URL файла');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    console.log('🗑️ Удаление файла из Supabase:', {
      bucket,
      filePath
    });

    const { error } = await client.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('❌ Ошибка удаления из Supabase:', error);
      throw new Error(`Ошибка удаления файла: ${error.message}`);
    }

    console.log('✅ Файл успешно удален из Supabase');
  } catch (error) {
    console.error('❌ Ошибка при удалении из Supabase:', error);
    throw error;
  }
}
