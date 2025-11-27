import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detailedAnalysis() {
  console.log('🔍 ДЕТАЛЬНЫЙ АНАЛИЗ ФОТО И ЗАДАЧ ЗА 20.11.2025\n');

  const startDate = new Date('2025-11-20T00:00:00');
  const endDate = new Date('2025-11-20T23:59:59');

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

  // Все фото из PhotoReport
  const photoReports = await prisma.photoReport.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      objectId: yandexObject.id
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`📸 Фото в PhotoReport: ${photoReports.length}\n`);

  // Группируем по taskId
  const photosByTask = new Map<string, any[]>();
  photoReports.forEach(photo => {
    const taskId = photo.taskId || 'NO_TASK';
    if (!photosByTask.has(taskId)) {
      photosByTask.set(taskId, []);
    }
    photosByTask.get(taskId)!.push(photo);
  });

  console.log(`📋 Фото распределены по ${photosByTask.size} задачам:\n`);

  // Все завершенные задачи
  const tasks = await prisma.task.findMany({
    where: {
      completedAt: { gte: startDate, lte: endDate },
      objectName: { contains: 'Яндекс', mode: 'insensitive' },
      status: { in: ['COMPLETED', 'CLOSED_WITH_PHOTO'] }
    },
    orderBy: { completedAt: 'asc' }
  });

  console.log(`✅ Завершенных задач: ${tasks.length}\n`);

  // Анализируем каждую задачу
  for (const task of tasks) {
    const photosInReport = photosByTask.get(task.id) || [];
    const photosInTask = task.completionPhotos || [];

    console.log(`\n📌 Задача: ${task.id}`);
    console.log(`   Описание: ${task.description.substring(0, 60)}...`);
    console.log(`   Завершена: ${task.completedAt?.toISOString()}`);
    console.log(`   Фото в PhotoReport: ${photosInReport.length}`);
    console.log(`   Фото в completionPhotos: ${photosInTask.length}`);

    if (photosInReport.length !== photosInTask.length) {
      console.log(`   ⚠️  РАСХОЖДЕНИЕ!`);
      
      // Сравниваем URL
      const reportUrls = new Set(photosInReport.map(p => p.url));
      const taskUrls = new Set(photosInTask);
      
      const onlyInReport = Array.from(reportUrls).filter(url => !taskUrls.has(url));
      const onlyInTask = Array.from(taskUrls).filter(url => !reportUrls.has(url));
      
      if (onlyInReport.length > 0) {
        console.log(`   📸 Только в PhotoReport (${onlyInReport.length}):`);
        onlyInReport.forEach(url => console.log(`      - ${url.substring(0, 80)}...`));
      }
      
      if (onlyInTask.length > 0) {
        console.log(`   📸 Только в completionPhotos (${onlyInTask.length}):`);
        onlyInTask.forEach(url => console.log(`      - ${url.substring(0, 80)}...`));
      }
    }
  }

  // Фото без задачи
  const photosWithoutTask = photosByTask.get('NO_TASK') || [];
  if (photosWithoutTask.length > 0) {
    console.log(`\n\n⚠️  ФОТО БЕЗ ЗАДАЧИ (${photosWithoutTask.length}):\n`);
    photosWithoutTask.forEach(photo => {
      console.log(`   📸 ${photo.id}`);
      console.log(`      URL: ${photo.url}`);
      console.log(`      Создано: ${photo.createdAt.toISOString()}`);
      console.log('');
    });
  }

  // Итоговая статистика
  console.log('\n\n📊 ИТОГОВАЯ СТАТИСТИКА:\n');
  console.log(`Фото в PhotoReport: ${photoReports.length}`);
  console.log(`Завершенных задач: ${tasks.length}`);
  console.log(`Задач с фото в completionPhotos: ${tasks.filter(t => t.completionPhotos && t.completionPhotos.length > 0).length}`);
  console.log(`Задач без фото: ${tasks.filter(t => !t.completionPhotos || t.completionPhotos.length === 0).length}`);
  
  const totalPhotosInTasks = tasks.reduce((sum, t) => sum + (t.completionPhotos?.length || 0), 0);
  console.log(`Всего фото в completionPhotos: ${totalPhotosInTasks}`);
  
  const difference = photoReports.length - totalPhotosInTasks;
  console.log(`\nРазница: ${difference} фото`);
  
  if (difference > 0) {
    console.log(`\n💡 ВОЗМОЖНЫЕ ПРИЧИНЫ РАСХОЖДЕНИЯ:`);
    console.log(`   1. Фото загружались отдельно (не через завершение задачи)`);
    console.log(`   2. Задача завершалась несколько раз с разными фото`);
    console.log(`   3. Фото добавлялись к уже завершенной задаче`);
    console.log(`   4. Дубликаты из-за бага (который мы исправили)`);
  }
}

async function main() {
  try {
    await detailedAnalysis();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
