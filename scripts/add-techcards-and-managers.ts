import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Добавление техкарт и настройка менеджеров...\n');

  // Получаем всех менеджеров
  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    orderBy: { email: 'asc' }
  });

  console.log(`👥 Найдено менеджеров: ${managers.length}\n`);

  // Получаем все объекты
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

  console.log(`🏢 Найдено объектов: ${objects.length}\n`);

  // 1. Производственный комплекс "Техмаш"
  const techmash = objects.find(o => o.name.includes('Техмаш'));
  if (techmash) {
    console.log('📍 Настройка объекта: Производственный комплекс "Техмаш"');
    
    // Назначаем главного менеджера на объект
    await prisma.cleaningObject.update({
      where: { id: techmash.id },
      data: { managerId: managers[0]?.id }
    });
    console.log(`   ✅ Главный менеджер: ${managers[0]?.name}`);

    // Назначаем менеджеров на участки
    if (techmash.sites.length >= 2) {
      // Участок 1 - менеджер 1
      await prisma.site.update({
        where: { id: techmash.sites[0].id },
        data: { 
          managerId: managers[0]?.id,
          seniorManagerId: null
        }
      });
      console.log(`   ✅ Участок "${techmash.sites[0].name}": ${managers[0]?.name}`);

      // Участок 2 - менеджер 2 (старший)
      await prisma.site.update({
        where: { id: techmash.sites[1].id },
        data: { 
          managerId: managers[1]?.id,
          seniorManagerId: managers[1]?.id
        }
      });
      console.log(`   ✅ Участок "${techmash.sites[1].name}": ${managers[1]?.name} (старший)`);
    }

    // Создаем техкарты для помещений
    const rooms = techmash.sites.flatMap(s => 
      s.zones.flatMap(z => 
        z.roomGroups.flatMap(rg => rg.rooms)
      )
    );

    if (rooms.length > 0) {
      // Техкарта 1: Влажная уборка производственных помещений
      await prisma.techCard.create({
        data: {
          name: 'Влажная уборка производственных помещений',
          workType: 'Ежедневная уборка',
          frequency: 'Ежедневно',
          description: 'Влажная уборка полов, протирка поверхностей, вынос мусора',
          objectId: techmash.id,
          roomId: rooms[0].id,
          notes: 'Использовать специальные моющие средства для производственных помещений',
          frequencyDays: 1,
          maxDelayHours: 2,
          preferredTime: '08:00',
          autoGenerate: true,
          isActive: true
        }
      });

      // Техкарта 2: Уборка административных помещений
      if (rooms.length > 1) {
        await prisma.techCard.create({
          data: {
            name: 'Уборка административных помещений',
            workType: 'Ежедневная уборка',
            frequency: 'Ежедневно',
            description: 'Уборка офисов, кабинетов, протирка мебели',
            objectId: techmash.id,
            roomId: rooms[1].id,
            notes: 'Особое внимание к рабочим местам',
            frequencyDays: 1,
            maxDelayHours: 2,
            preferredTime: '09:00',
            autoGenerate: true,
            isActive: true
          }
        });
      }

      // Техкарта 3: Генеральная уборка цехов
      await prisma.techCard.create({
        data: {
          name: 'Генеральная уборка цехов',
          workType: 'Генеральная уборка',
          frequency: 'Еженедельно',
          description: 'Полная уборка производственных помещений, мытье окон, уборка высоких поверхностей',
          objectId: techmash.id,
          roomId: rooms[0].id,
          notes: 'Проводится в выходные дни',
          frequencyDays: 7,
          maxDelayHours: 24,
          preferredTime: '10:00',
          autoGenerate: true,
          isActive: true
        }
      });

      console.log(`   ✅ Создано техкарт: 3\n`);
    }
  }

  // 2. Бизнес-центр "Столичный"
  const stolichniy = objects.find(o => o.name.includes('Столичный'));
  if (stolichniy) {
    console.log('📍 Настройка объекта: Бизнес-центр "Столичный"');
    
    // Назначаем менеджера 2 на объект
    await prisma.cleaningObject.update({
      where: { id: stolichniy.id },
      data: { managerId: managers[1]?.id }
    });
    console.log(`   ✅ Главный менеджер: ${managers[1]?.name}`);

    // Назначаем на участок
    if (stolichniy.sites.length > 0) {
      await prisma.site.update({
        where: { id: stolichniy.sites[0].id },
        data: { 
          managerId: managers[1]?.id,
          seniorManagerId: null
        }
      });
      console.log(`   ✅ Участок "${stolichniy.sites[0].name}": ${managers[1]?.name}`);
    }

    const rooms = stolichniy.sites.flatMap(s => 
      s.zones.flatMap(z => 
        z.roomGroups.flatMap(rg => rg.rooms)
      )
    );

    if (rooms.length > 0) {
      await prisma.techCard.create({
        data: {
          name: 'Уборка офисных помещений',
          workType: 'Ежедневная уборка',
          frequency: 'Ежедневно',
          description: 'Уборка офисов, протирка мебели, вынос мусора',
          objectId: stolichniy.id,
          roomId: rooms[0].id,
          frequencyDays: 1,
          maxDelayHours: 2,
          preferredTime: '08:00',
          autoGenerate: true,
          isActive: true
        }
      });

      if (rooms.length > 1) {
        await prisma.techCard.create({
          data: {
            name: 'Уборка общих зон (холлы, коридоры)',
            workType: 'Ежедневная уборка',
            frequency: 'Ежедневно',
            description: 'Уборка холлов, коридоров, лестниц',
            objectId: stolichniy.id,
            roomId: rooms[1].id,
            frequencyDays: 1,
            maxDelayHours: 2,
            preferredTime: '07:00',
            autoGenerate: true,
            isActive: true
          }
        });
      }

      await prisma.techCard.create({
        data: {
          name: 'Мытье окон',
          workType: 'Периодическая уборка',
          frequency: 'Ежемесячно',
          description: 'Мытье окон внутри и снаружи',
          objectId: stolichniy.id,
          roomId: rooms[0].id,
          frequencyDays: 30,
          maxDelayHours: 48,
          preferredTime: '10:00',
          autoGenerate: true,
          isActive: true
        }
      });

      console.log(`   ✅ Создано техкарт: 3\n`);
    }
  }

  // 3. ЖК "Солнечный"
  const solnechniy = objects.find(o => o.name.includes('Солнечный'));
  if (solnechniy) {
    console.log('📍 Настройка объекта: ЖК "Солнечный"');
    
    // Назначаем менеджера 3 на объект (старший)
    await prisma.cleaningObject.update({
      where: { id: solnechniy.id },
      data: { managerId: managers[2]?.id }
    });
    console.log(`   ✅ Главный менеджер: ${managers[2]?.name} (старший)`);

    if (solnechniy.sites.length > 0) {
      await prisma.site.update({
        where: { id: solnechniy.sites[0].id },
        data: { 
          managerId: managers[2]?.id,
          seniorManagerId: managers[2]?.id
        }
      });
      console.log(`   ✅ Участок "${solnechniy.sites[0].name}": ${managers[2]?.name} (старший)`);
    }

    const rooms = solnechniy.sites.flatMap(s => 
      s.zones.flatMap(z => 
        z.roomGroups.flatMap(rg => rg.rooms)
      )
    );

    if (rooms.length > 0) {
      await prisma.techCard.create({
        data: {
          name: 'Уборка подъездов',
          workType: 'Ежедневная уборка',
          frequency: 'Ежедневно',
          description: 'Уборка подъездов, лестниц, лифтов',
          objectId: solnechniy.id,
          roomId: rooms[0].id,
          frequencyDays: 1,
          maxDelayHours: 2,
          preferredTime: '07:00',
          autoGenerate: true,
          isActive: true
        }
      });

      if (rooms.length > 1) {
        await prisma.techCard.create({
          data: {
            name: 'Уборка придомовой территории',
            workType: 'Ежедневная уборка',
            frequency: 'Ежедневно',
            description: 'Уборка двора, детских площадок, парковки',
            objectId: solnechniy.id,
            roomId: rooms[1].id,
            frequencyDays: 1,
            maxDelayHours: 2,
            preferredTime: '08:00',
            autoGenerate: true,
            isActive: true
          }
        });
      }

      await prisma.techCard.create({
        data: {
          name: 'Генеральная уборка подъездов',
          workType: 'Генеральная уборка',
          frequency: 'Еженедельно',
          description: 'Полная уборка подъездов с мытьем стен и окон',
          objectId: solnechniy.id,
          roomId: rooms[0].id,
          frequencyDays: 7,
          maxDelayHours: 24,
          preferredTime: '10:00',
          autoGenerate: true,
          isActive: true
        }
      });

      console.log(`   ✅ Создано техкарт: 3\n`);
    }
  }

  // 4. Торговый центр "Мега Плаза"
  const megaplaza = objects.find(o => o.name.includes('Мега Плаза'));
  if (megaplaza) {
    console.log('📍 Настройка объекта: Торговый центр "Мега Плаза"');
    
    // Назначаем менеджера 3 на объект
    await prisma.cleaningObject.update({
      where: { id: megaplaza.id },
      data: { managerId: managers[2]?.id }
    });
    console.log(`   ✅ Главный менеджер: ${managers[2]?.name}`);

    // Если нет структуры, создаем базовую
    let rooms = megaplaza.sites.flatMap(s => 
      s.zones.flatMap(z => 
        z.roomGroups.flatMap(rg => rg.rooms)
      )
    );

    if (rooms.length === 0) {
      // Создаем минимальную структуру
      const site = await prisma.site.create({
        data: {
          name: 'Основное здание',
          objectId: megaplaza.id,
          managerId: managers[2]?.id
        }
      });

      const zone = await prisma.zone.create({
        data: {
          name: 'Торговая зона',
          siteId: site.id
        }
      });

      const roomGroup = await prisma.roomGroup.create({
        data: {
          name: 'Торговые залы',
          zoneId: zone.id
        }
      });

      const room1 = await prisma.room.create({
        data: {
          name: 'Торговый зал 1',
          roomGroupId: roomGroup.id,
          objectId: megaplaza.id
        }
      });

      const room2 = await prisma.room.create({
        data: {
          name: 'Санузлы',
          roomGroupId: roomGroup.id,
          objectId: megaplaza.id
        }
      });

      rooms = [room1, room2];
      console.log(`   ✅ Создана базовая структура`);
    }

    await prisma.techCard.create({
      data: {
        name: 'Уборка торговых залов',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        description: 'Уборка торговых залов, протирка витрин',
        objectId: megaplaza.id,
        roomId: rooms[0].id,
        frequencyDays: 1,
        maxDelayHours: 2,
        preferredTime: '08:00',
        autoGenerate: true,
        isActive: true
      }
    });

    if (rooms.length > 1) {
      await prisma.techCard.create({
        data: {
          name: 'Уборка санузлов',
          workType: 'Ежедневная уборка',
          frequency: 'Каждые 2 часа',
          description: 'Уборка и дезинфекция санузлов',
          objectId: megaplaza.id,
          roomId: rooms[1].id,
          frequencyDays: 1,
          maxDelayHours: 1,
          preferredTime: '08:00',
          autoGenerate: true,
          isActive: true
        }
      });
    }

    console.log(`   ✅ Создано техкарт: 2\n`);
  }

  // 5. Медицинский центр "Здоровье+"
  const zdorovie = objects.find(o => o.name.includes('Здоровье'));
  if (zdorovie) {
    console.log('📍 Настройка объекта: Медицинский центр "Здоровье+"');
    
    // Назначаем менеджера 4 на объект (старший)
    await prisma.cleaningObject.update({
      where: { id: zdorovie.id },
      data: { managerId: managers[3]?.id }
    });
    console.log(`   ✅ Главный менеджер: ${managers[3]?.name} (старший)`);

    // Если нет структуры, создаем базовую
    let rooms = zdorovie.sites.flatMap(s => 
      s.zones.flatMap(z => 
        z.roomGroups.flatMap(rg => rg.rooms)
      )
    );

    if (rooms.length === 0) {
      const site = await prisma.site.create({
        data: {
          name: 'Основное здание',
          objectId: zdorovie.id,
          managerId: managers[3]?.id,
          seniorManagerId: managers[3]?.id
        }
      });

      const zone = await prisma.zone.create({
        data: {
          name: 'Медицинская зона',
          siteId: site.id
        }
      });

      const roomGroup = await prisma.roomGroup.create({
        data: {
          name: 'Кабинеты',
          zoneId: zone.id
        }
      });

      const room1 = await prisma.room.create({
        data: {
          name: 'Кабинеты врачей',
          roomGroupId: roomGroup.id,
          objectId: zdorovie.id
        }
      });

      const room2 = await prisma.room.create({
        data: {
          name: 'Процедурные кабинеты',
          roomGroupId: roomGroup.id,
          objectId: zdorovie.id
        }
      });

      rooms = [room1, room2];
      console.log(`   ✅ Создана базовая структура`);
    }

    await prisma.techCard.create({
      data: {
        name: 'Уборка кабинетов врачей',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        description: 'Влажная уборка, дезинфекция поверхностей',
        objectId: zdorovie.id,
        roomId: rooms[0].id,
        frequencyDays: 1,
        maxDelayHours: 2,
        preferredTime: '07:00',
        autoGenerate: true,
        isActive: true
      }
    });

    if (rooms.length > 1) {
      await prisma.techCard.create({
        data: {
          name: 'Дезинфекция процедурных кабинетов',
          workType: 'Ежедневная уборка',
          frequency: 'Каждые 4 часа',
          description: 'Дезинфекция всех поверхностей, уборка',
          objectId: zdorovie.id,
          roomId: rooms[1].id,
          frequencyDays: 1,
          maxDelayHours: 1,
          preferredTime: '07:00',
          autoGenerate: true,
          isActive: true
        }
      });
    }

    await prisma.techCard.create({
      data: {
        name: 'Генеральная уборка с дезинфекцией',
        workType: 'Генеральная уборка',
        frequency: 'Еженедельно',
        description: 'Полная дезинфекция всех помещений',
        objectId: zdorovie.id,
        roomId: rooms[0].id,
        frequencyDays: 7,
        maxDelayHours: 24,
        preferredTime: '18:00',
        autoGenerate: true,
        isActive: true
      }
    });

    console.log(`   ✅ Создано техкарт: 3\n`);
  }

  console.log('✅ Все данные успешно добавлены!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
