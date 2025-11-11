import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверка структуры техкарт...\n');

  // 1. Получаем все техкарты
  const allTechCards = await prisma.techCard.findMany({
    include: {
      object: {
        select: { id: true, name: true }
      },
      room: {
        select: { id: true, name: true }
      },
      cleaningObjectItem: {
        select: { 
          id: true, 
          name: true,
          room: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  console.log(`📊 Всего техкарт: ${allTechCards.length}\n`);

  // 2. Разделяем техкарты на привязанные и непривязанные
  const techCardsWithStructure = allTechCards.filter(tc => 
    tc.roomId || tc.cleaningObjectItemId
  );
  
  const techCardsWithoutStructure = allTechCards.filter(tc => 
    !tc.roomId && !tc.cleaningObjectItemId
  );

  console.log(`✅ Техкарты с привязкой к структуре: ${techCardsWithStructure.length}`);
  console.log(`❌ Техкарты БЕЗ привязки к структуре: ${techCardsWithoutStructure.length}\n`);

  if (techCardsWithoutStructure.length > 0) {
    console.log('📋 Техкарты без привязки к структуре:');
    for (const tc of techCardsWithoutStructure) {
      console.log(`  - ID: ${tc.id}, Название: ${tc.name}, Объект: ${tc.object.name}`);
    }
    console.log('');
  }

  // 3. Для каждого объекта проверяем структуру
  const objects = await prisma.cleaningObject.findMany({
    include: {
      sites: {
        include: {
          zones: {
            include: {
              roomGroups: {
                include: {
                  rooms: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log('🏢 Анализ структуры объектов:\n');
  
  for (const obj of objects) {
    console.log(`📍 Объект: ${obj.name}`);
    console.log(`   Участков: ${obj.sites.length}`);
    
    let totalZones = 0;
    let totalRoomGroups = 0;
    let totalRooms = 0;
    
    for (const site of obj.sites) {
      totalZones += site.zones.length;
      for (const zone of site.zones) {
        totalRoomGroups += zone.roomGroups.length;
        for (const roomGroup of zone.roomGroups) {
          totalRooms += roomGroup.rooms.length;
        }
      }
    }
    
    console.log(`   Зон: ${totalZones}`);
    console.log(`   Групп помещений: ${totalRoomGroups}`);
    console.log(`   Помещений: ${totalRooms}`);
    
    // Проверяем техкарты для этого объекта
    const objTechCards = allTechCards.filter(tc => tc.objectId === obj.id);
    const objTechCardsWithStructure = objTechCards.filter(tc => 
      tc.roomId || tc.cleaningObjectItemId
    );
    const objTechCardsWithoutStructure = objTechCards.filter(tc => 
      !tc.roomId && !tc.cleaningObjectItemId
    );
    
    console.log(`   Техкарт всего: ${objTechCards.length}`);
    console.log(`   Техкарт с привязкой: ${objTechCardsWithStructure.length}`);
    console.log(`   Техкарт БЕЗ привязки: ${objTechCardsWithoutStructure.length}\n`);
  }

  // 4. Предлагаем решение
  if (techCardsWithoutStructure.length > 0) {
    console.log('🔧 ПЛАН ИСПРАВЛЕНИЯ:\n');
    console.log('Вариант 1: Привязать техкарты к существующей структуре');
    console.log('Вариант 2: Удалить техкарты без привязки\n');
    
    console.log('❓ Хотите удалить техкарты без привязки? (y/n)');
    console.log('   Для автоматического удаления запустите скрипт с параметром --delete\n');
    
    // Проверяем аргументы командной строки
    const shouldDelete = process.argv.includes('--delete');
    
    if (shouldDelete) {
      console.log('🗑️ Удаление техкарт без привязки...\n');
      
      for (const tc of techCardsWithoutStructure) {
        // Сначала удаляем связанные выполнения задач
        const executions = await prisma.taskExecution.deleteMany({
          where: { techCardId: tc.id }
        });
        
        console.log(`  - Удалено выполнений для техкарты "${tc.name}": ${executions.count}`);
        
        // Затем удаляем саму техкарту
        await prisma.techCard.delete({
          where: { id: tc.id }
        });
        
        console.log(`  ✅ Удалена техкарта: ${tc.name} (ID: ${tc.id})`);
      }
      
      console.log(`\n✅ Удалено техкарт: ${techCardsWithoutStructure.length}`);
    } else {
      console.log('ℹ️ Для удаления техкарт без привязки запустите:');
      console.log('   npm run fix-techcards -- --delete');
    }
  } else {
    console.log('✅ Все техкарты привязаны к структуре!');
  }

  console.log('\n✅ Проверка завершена!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
