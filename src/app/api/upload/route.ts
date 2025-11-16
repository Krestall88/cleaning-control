import { NextRequest, NextResponse } from 'next/server';
import { uploadToSupabase } from '@/lib/supabase';

// POST /api/upload - Загрузка файлов в Supabase Storage
export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ message: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Разрешены только изображения' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'Файл слишком большой (максимум 10MB)' }, { status: 400 });
    }

    console.log('📤 Загрузка файла в Supabase Storage:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Загружаем файл в Supabase Storage
    const fileUrl = await uploadToSupabase(file, 'uploads', 'photos');

    console.log('✅ Файл успешно загружен:', fileUrl);

    return NextResponse.json({ 
      url: fileUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('❌ Ошибка при загрузке файла:', error);
    return NextResponse.json({ 
      message: 'Ошибка при загрузке файла: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка')
    }, { status: 500 });
  }
}
