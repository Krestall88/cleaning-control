import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Проверка подключения к базе данных...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telegramId: true,
        telegramUsername: true
      },
      take: 10
    });

    console.log(`\n✅ Найдено пользователей: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️ В базе данных нет пользователей!');
      console.log('Создайте пользователей через Supabase SQL Editor или скрипт seed.');
    } else {
      console.log('📋 Список пользователей:');
      users.forEach(user => {
        console.log(`  - ${user.email} | ${user.name} | ${user.role} | Telegram: ${user.telegramId || 'не привязан'}`);
      });
    }

    // Проверяем конкретного пользователя
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    console.log('\n🔍 Проверка admin@example.com:');
    if (admin) {
      console.log('✅ Пользователь найден:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        hasPassword: !!admin.password,
        passwordLength: admin.password?.length
      });
    } else {
      console.log('❌ Пользователь admin@example.com не найден в базе!');
    }

    // Проверяем таблицы мануала
    console.log('\n🔍 Проверка таблиц мануала...');
    
    try {
      // @ts-ignore - модели могут быть не сгенерированы
      const sectionsCount = await prisma.manualSection?.count() || 0;
      // @ts-ignore
      const screenshotsCount = await prisma.manualScreenshot?.count() || 0;
      
      console.log(`  - ManualSection: ${sectionsCount} записей`);
      console.log(`  - ManualScreenshot: ${screenshotsCount} записей`);

      if (sectionsCount === 0) {
        console.log('\n⚠️ Таблица ManualSection пуста! Добавьте разделы через SQL.');
      }
    } catch (e) {
      console.log('  ⚠️ Таблицы мануала не доступны (возможно не мигрированы)');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
