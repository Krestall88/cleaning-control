import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Попытка входа в систему...');
    
    const body = await req.json();
    const { email, password } = body;

    console.log(`📧 Email: ${email}`);

    // Простая валидация
    if (!email || !password) {
      console.log('❌ Отсутствуют email или пароль');
      return NextResponse.json(
        { message: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    console.log('🔍 Поиск пользователя в базе данных...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ Пользователь с email ${email} не найден`);
      return NextResponse.json(
        { message: 'Пользователь с таким email не найден' },
        { status: 404 }
      );
    }

    console.log(`✅ Пользователь найден: ${user.name} (${user.role})`);
    console.log('🔐 Проверка пароля...');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Неверный пароль');
      return NextResponse.json({ message: 'Неверный пароль' }, { status: 401 });
    }

    console.log('✅ Пароль верный, создание токена...');

    // Проверяем JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET не настроен');
      return NextResponse.json(
        { message: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    console.log('✅ Токен создан, вход успешен');

    // Создаем ответ с токеном в cookie
    const response = NextResponse.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });

    // Устанавливаем cookie с токеном
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 1 день
    });

    return response;

  } catch (error) {
    console.error('❌ Ошибка в API логина:', error);
    
    let errorMessage = 'Внутренняя ошибка сервера';
    let errorDetails = 'Неизвестная ошибка';
    
    if (error instanceof Error) {
      console.error('Детали ошибки:', error.message);
      console.error('Стек ошибки:', error.stack);
      errorDetails = error.message;
      
      // Проверяем ошибки подключения к БД
      if (error.message.includes('Can\'t reach database server')) {
        errorMessage = 'Ошибка подключения к базе данных';
        errorDetails = 'Не удается подключиться к базе данных. Проверьте DATABASE_URL в переменных окружения.';
      } else if (error.message.includes('prisma')) {
        errorMessage = 'Ошибка базы данных';
      }
    }
    
    return NextResponse.json(
      { 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
