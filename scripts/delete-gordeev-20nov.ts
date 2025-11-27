import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteGordeevData() {
  console.log('⚠️  УДАЛЕНИЕ ДАННЫХ ГОРДЕЕВА ЗА 20.11.2025\n');
  console.log('Это действие удалит:');
  console.log('1. Все фото, загруженные Гордеевым за 20.11');
  console.log('2. Все завершенные задачи Яндекс за 20.11');
  console.log('3. Записи из AuditLog\n');

  const startDate = new Date('2025-11-20T00:00:00');
  const endDate = new Date('2025-11-20T23:59:59');

  // Найти пользователя Гордеев
  const gordeev = await prisma.user.findFirst({
    where: {
      name: { contains: 'Гордеев', mode: 'insensitive' }
    }
  });

  if (!gordeev) {
    console.error('❌ Пользователь Гордеев не найден!');
    return;
  }

  console.log(`✅ Найден пользователь: ${gordeev.name} (ID: ${gordeev.id})\n`);

  // Найти объект Яндекс
  const yandexObject = await prisma.cleaningObject.findFirst({
    where: {
      OR: [
        { name: { contains: 'Яндекс', mode: 'insensitive' } },
        { name: { contains: 'Yandex', mode: 'insensitive' } }
      ]
    }
  });

  if (!yandexObject) {
    console.error('❌ Объект Яндекс не найден!');
    return;
  }

  console.log(`✅ Найден объект: ${yandexObject.name} (ID: ${yandexObject.id})\n`);

  // ШАГИ УДАЛЕНИЯ (в транзакции для безопасности)

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Найти все фото Гордеева за 20.11
      const photosToDelete = await tx.photoReport.findMany({
        where: {
          uploaderId: gordeev.id,
          createdAt: { gte: startDate, lte: endDate },
          objectId: yandexObject.id
        }
      });

      console.log(`📸 Найдено фото для удаления: ${photosToDelete.length}`);

      // 2. Найти все завершенные задачи за 20.11 для Яндекс
      const tasksToReset = await tx.task.findMany({
        where: {
          completedAt: { gte: startDate, lte: endDate },
          objectName: { contains: 'Яндекс', mode: 'insensitive' },
          completedById: gordeev.id
        }
      });

      console.log(`📋 Найдено задач для сброса: ${tasksToReset.length}\n`);

      // Показываем что будет удалено
      console.log('🗑️  БУДЕТ УДАЛЕНО:\n');
      
      if (photosToDelete.length > 0) {
        console.log('📸 ФОТО:');
        photosToDelete.forEach((photo, i) => {
          console.log(`   ${i + 1}. ${photo.url.substring(0, 80)}...`);
        });
        console.log('');
      }

      if (tasksToReset.length > 0) {
        console.log('📋 ЗАДАЧИ:');
        tasksToReset.forEach((task, i) => {
          console.log(`   ${i + 1}. ${task.description.substring(0, 60)}...`);
          console.log(`      Завершена: ${task.completedAt?.toISOString()}`);
        });
        console.log('');
      }

      // ВНИМАНИЕ: Раскомментируйте следующие строки для реального удаления
      console.log('⚠️  ДЛЯ РЕАЛЬНОГО УДАЛЕНИЯ РАСКОММЕНТИРУЙТЕ КОД В СКРИПТЕ!\n');
      console.log('Сейчас выполняется только ПРОВЕРКА (dry-run)\n');

      /*
      // 3. Удалить фото из PhotoReport
      const deletedPhotos = await tx.photoReport.deleteMany({
        where: {
          id: { in: photosToDelete.map(p => p.id) }
        }
      });

      console.log(`✅ Удалено фото: ${deletedPhotos.count}`);

      // 4. Сбросить задачи (вернуть в AVAILABLE)
      const updatedTasks = await tx.task.updateMany({
        where: {
          id: { in: tasksToReset.map(t => t.id) }
        },
        data: {
          status: 'AVAILABLE',
          completedAt: null,
          completedById: null,
          completionComment: null,
          completionPhotos: []
        }
      });

      console.log(`✅ Сброшено задач: ${updatedTasks.count}`);

      // 5. Удалить записи из AuditLog
      const deletedLogs = await tx.auditLog.deleteMany({
        where: {
          userId: gordeev.id,
          createdAt: { gte: startDate, lte: endDate },
          action: { in: ['TASK_COMPLETED_UNIFIED', 'PHOTOS_UPLOADED', 'TASK_STATUS_CHANGED'] }
        }
      });

      console.log(`✅ Удалено записей из AuditLog: ${deletedLogs.count}`);

      console.log('\n✅ УДАЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!\n');
      */

    });

  } catch (error) {
    console.error('❌ ОШИБКА ПРИ УДАЛЕНИИ:', error);
    console.error('Транзакция отменена, данные не изменены');
    throw error;
  }
}

async function deleteGordeevDataReal() {
  console.log('⚠️⚠️⚠️  РЕАЛЬНОЕ УДАЛЕНИЕ ДАННЫХ ГОРДЕЕВА ЗА 20.11.2025 ⚠️⚠️⚠️\n');
  console.log('Это действие НЕОБРАТИМО!\n');

  const startDate = new Date('2025-11-20T00:00:00');
  const endDate = new Date('2025-11-20T23:59:59');

  // Найти пользователя Гордеев
  const gordeev = await prisma.user.findFirst({
    where: {
      name: { contains: 'Гордеев', mode: 'insensitive' }
    }
  });

  if (!gordeev) {
    console.error('❌ Пользователь Гордеев не найден!');
    return;
  }

  console.log(`✅ Найден пользователь: ${gordeev.name} (ID: ${gordeev.id})\n`);

  // Найти объект Яндекс
  const yandexObject = await prisma.cleaningObject.findFirst({
    where: {
      OR: [
        { name: { contains: 'Яндекс', mode: 'insensitive' } },
        { name: { contains: 'Yandex', mode: 'insensitive' } }
      ]
    }
  });

  if (!yandexObject) {
    console.error('❌ Объект Яндекс не найден!');
    return;
  }

  console.log(`✅ Найден объект: ${yandexObject.name} (ID: ${yandexObject.id})\n`);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Удалить фото из PhotoReport
      const deletedPhotos = await tx.photoReport.deleteMany({
        where: {
          uploaderId: gordeev.id,
          createdAt: { gte: startDate, lte: endDate },
          objectId: yandexObject.id
        }
      });

      console.log(`✅ Удалено фото: ${deletedPhotos.count}`);

      // 2. Сбросить задачи (вернуть в AVAILABLE)
      const updatedTasks = await tx.task.updateMany({
        where: {
          completedAt: { gte: startDate, lte: endDate },
          objectName: { contains: 'Яндекс', mode: 'insensitive' },
          completedById: gordeev.id
        },
        data: {
          status: 'AVAILABLE',
          completedAt: null,
          completedById: null,
          completionComment: null,
          completionPhotos: []
        }
      });

      console.log(`✅ Сброшено задач: ${updatedTasks.count}`);

      // 3. Удалить записи из AuditLog
      const deletedLogs = await tx.auditLog.deleteMany({
        where: {
          userId: gordeev.id,
          createdAt: { gte: startDate, lte: endDate },
          action: { in: ['TASK_COMPLETED_UNIFIED', 'PHOTOS_UPLOADED', 'TASK_STATUS_CHANGED', 'COMPLETE_TASK'] }
        }
      });

      console.log(`✅ Удалено записей из AuditLog: ${deletedLogs.count}`);

      console.log('\n✅ УДАЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!\n');
    });

  } catch (error) {
    console.error('❌ ОШИБКА ПРИ УДАЛЕНИИ:', error);
    console.error('Транзакция отменена, данные не изменены');
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'real') {
      console.log('⚠️  Запущено РЕАЛЬНОЕ удаление...\n');
      await deleteGordeevDataReal();
    } else {
      console.log('ℹ️  Запущен режим ПРОВЕРКИ (dry-run)\n');
      console.log('Для реального удаления используйте: npm run delete-gordeev real\n');
      await deleteGordeevData();
    }
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
