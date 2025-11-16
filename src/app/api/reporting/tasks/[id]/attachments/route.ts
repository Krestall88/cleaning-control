import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth-middleware';
import { uploadToSupabase } from '@/lib/supabase';

// GET /api/reporting/tasks/[id]/attachments - Получить вложения задачи
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    const taskId = params.id;

    const attachments = await prisma.reportingTaskAttachment.findMany({
      where: { taskId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Ошибка при получении вложений:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/reporting/tasks/[id]/attachments - Добавить вложение к задаче
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    const taskId = params.id;

    // Проверяем, что задача существует
    const task = await prisma.reportingTask.findUnique({
      where: { id: taskId },
      include: { object: true }
    });

    if (!task) {
      return NextResponse.json({ message: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа
    const canAddAttachment = user.role === 'ADMIN' || 
                           user.role === 'DEPUTY_ADMIN' || 
                           task.assignedToId === user.id ||
                           task.object.managerId === user.id;

    if (!canAddAttachment) {
      return NextResponse.json({ message: 'Недостаточно прав' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const comment = formData.get('comment') as string;

    if (!file) {
      return NextResponse.json({ message: 'Файл не найден' }, { status: 400 });
    }

    // Проверяем тип файла (только изображения)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Разрешены только изображения' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'Файл слишком большой (максимум 10MB)' }, { status: 400 });
    }

    console.log('📤 Загрузка вложения в Supabase Storage:', {
      taskId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    // Загружаем файл в Supabase Storage
    const fileUrl = await uploadToSupabase(file, 'uploads', 'reporting-tasks');

    console.log('✅ Вложение успешно загружено:', fileUrl);

    // Создаем запись в базе данных
    const attachment = await prisma.reportingTaskAttachment.create({
      data: {
        taskId,
        fileName: file.name,
        originalName: file.name,
        filePath: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedById: user.id
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Ошибка при загрузке вложения:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
