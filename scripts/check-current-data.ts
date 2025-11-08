import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Проверка текущих данных в базе...\n');

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
      },
      techCards: true
    }
  });

  console.log(`\n🏢 Найдено объектов: ${objects.length}\n`);

  for (const obj of objects) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 ${obj.name}`);
    console.log(`   Адрес: ${obj.address}`);
    console.log(`   Описание: ${obj.description || 'нет'}`);
    console.log(`   Примечания: ${obj.notes || 'нет'}`);
    console.log(`   Площадь: ${obj.totalArea || 'не указана'} м²`);
    
    console.log(`\n   🏗️ Структура:`);
    console.log(`   - Участков: ${obj.sites.length}`);
    
    for (const site of obj.sites) {
      console.log(`\n     📦 ${site.name}`);
      console.log(`        Зон: ${site.zones.length}`);
      
      for (const zone of site.zones) {
        console.log(`        └─ ${zone.name}`);
        console.log(`           Групп помещений: ${zone.roomGroups.length}`);
        
        for (const group of zone.roomGroups) {
          console.log(`           └─ ${group.name}`);
          console.log(`              Помещений: ${group.rooms.length}`);
          
          for (const room of group.rooms) {
            console.log(`              └─ ${room.name} (${room.area || '?'} м²)`);
            if (room.description) {
              console.log(`                 ${room.description}`);
            }
          }
        }
      }
    }
    
    console.log(`\n   📋 Техкарт: ${obj.techCards.length}`);
    for (const tc of obj.techCards.slice(0, 5)) {
      console.log(`      - ${tc.name} (${tc.frequency})`);
      if (tc.description) {
        console.log(`        ${tc.description}`);
      }
    }
    if (obj.techCards.length > 5) {
      console.log(`      ... и еще ${obj.techCards.length - 5}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
