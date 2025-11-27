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

// GET /api/client-bindings - Получить список привязок (для админа) или объектов (для клиента)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const telegramId = url.searchParams.get('telegramId');
    const user = await getUserFromToken(req);

    // Если есть telegramId - это запрос от клиента через бота
    if (telegramId && !user) {
      // Получаем все объекты для выбора
      const objects = await prisma.cleaningObject.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          manager: {
            select: { name: true, email: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Проверяем, есть ли уже привязка
      const existingBinding = await prisma.clientBinding.findFirst({
        where: { telegramId },
        include: {
          object: {
            select: { id: true, name: true, address: true }
          }
        }
      });

      return NextResponse.json({
        objects,
        existingBinding,
        hasBinding: !!existingBinding
      });
    }

    // Если нет telegramId - это запрос от админа/менеджера для просмотра всех привязок
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Получаем все привязки с информацией об объектах
    const bindings = await prisma.clientBinding.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(bindings);

  } catch (error) {
    console.error('Ошибка получения данных:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/client-bindings - Создать привязку клиента к объекту
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telegramId, objectId, telegramUsername, firstName, lastName } = body;

    if (!objectId) {
      return NextResponse.json({ 
        message: 'Требуется objectId' 
      }, { status: 400 });
    }

    if (!telegramId) {
      return NextResponse.json({ 
        message: 'Требуется telegramId' 
      }, { status: 400 });
    }

    // Проверяем существование объекта
    const object = await prisma.cleaningObject.findUnique({
      where: { id: objectId },
      select: { 
        id: true, 
        name: true, 
        address: true,
        manager: {
          select: { name: true, email: true }
        }
      }
    });

    if (!object) {
      return NextResponse.json({ message: 'Объект не найден' }, { status: 404 });
    }

    // Создаем или обновляем привязку
    const bindingData = { 
      objectId,
      telegramId,
      telegramUsername: telegramUsername || null,
      firstName: firstName || null,
      lastName: lastName || null
    };

    const binding = await prisma.clientBinding.upsert({
      where: { telegramId_objectId: { telegramId, objectId } },
      update: bindingData,
      create: bindingData,
      include: {
        object: {
          select: { id: true, name: true, address: true }
        }
      }
    });

    console.log('✅ Клиент привязан к объекту:', {
      telegramId,
      objectName: object.name
    });

    // Отправляем уведомление клиенту в Telegram
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const message = `✅ Вы успешно привязаны к объекту!

🏢 Объект: ${object.name}
📍 ${object.address || 'Адрес не указан'}${object.manager ? `\n👤 Менеджер: ${object.manager.name}` : ''}

Теперь вы можете отправлять сообщения, фото, голосовые сообщения или документы - они автоматически будут переданы менеджеру как дополнительные задания.

💬 Просто напишите ваше сообщение!`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: message,
            parse_mode: 'HTML'
          })
        });

        console.log('📱 Уведомление отправлено клиенту в Telegram');
      }
    } catch (notifyError) {
      console.error('⚠️  Ошибка отправки уведомления:', notifyError);
      // Не прерываем выполнение, если уведомление не отправилось
    }

    return NextResponse.json({
      success: true,
      binding,
      message: `Вы успешно привязаны к объекту "${object.name}"`
    });

  } catch (error) {
    console.error('Ошибка создания привязки:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
