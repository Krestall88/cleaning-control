import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

async function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    return payload;
  } catch (error) {
    return null;
  }
}

// PUT /api/client-bindings/[id] - Обновить привязку
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { telegramId, telegramUsername, firstName, lastName, objectId } = body;

    // Проверяем существование привязки
    const existingBinding = await prisma.clientBinding.findUnique({
      where: { id }
    });

    if (!existingBinding) {
      return NextResponse.json({ message: 'Привязка не найдена' }, { status: 404 });
    }

    // Обновляем привязку
    const updatedBinding = await prisma.clientBinding.update({
      where: { id },
      data: {
        telegramId,
        telegramUsername: telegramUsername || null,
        firstName: firstName || null,
        lastName: lastName || null,
        objectId
      },
      include: {
        object: {
          select: {
            id: true,
            name: true,
            address: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Привязка обновлена:', id);

    return NextResponse.json(updatedBinding);

  } catch (error) {
    console.error('Ошибка обновления привязки:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/client-bindings/[id] - Удалить привязку
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем существование привязки
    const existingBinding = await prisma.clientBinding.findUnique({
      where: { id }
    });

    if (!existingBinding) {
      return NextResponse.json({ message: 'Привязка не найдена' }, { status: 404 });
    }

    // Удаляем привязку
    await prisma.clientBinding.delete({
      where: { id }
    });

    console.log('✅ Привязка удалена:', id);

    return NextResponse.json({ message: 'Привязка успешно удалена' });

  } catch (error) {
    console.error('Ошибка удаления привязки:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
