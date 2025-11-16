import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!admin) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log('🔍 Проверка пароля для admin@example.com');
    console.log('Хэш в БД:', admin.password);
    
    const passwords = ['password123', 'admin123', 'admin', 'password'];
    
    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, admin.password);
      console.log(`  ${pwd}: ${isValid ? '✅ ВЕРНЫЙ' : '❌ неверный'}`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
