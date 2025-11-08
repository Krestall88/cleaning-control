import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ru';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Хелпер для хеширования пароля
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Генерация случайной даты в диапазоне
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🚀 Начинаем создание тестовых данных для презентационной копии...\n');

  // Очищаем существующие данные (если есть)
  console.log('🧹 Очистка существующих данных...');
  await prisma.taskExecution.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskAdminComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.inventoryExpense.deleteMany();
  await prisma.expenseCategoryLimit.deleteMany();
  await prisma.inventoryLimit.deleteMany();
  await prisma.additionalTaskComment.deleteMany();
  await prisma.additionalTask.deleteMany();
  await prisma.reportingTaskAttachment.deleteMany();
  await prisma.reportingTask.deleteMany();
  await prisma.request.deleteMany();
  await prisma.photoReport.deleteMany();
  await prisma.techCard.deleteMany();
  await prisma.cleaningObjectItem.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomGroup.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.site.deleteMany();
  await prisma.deputyAdminAssignment.deleteMany();
  await prisma.excludedObject.deleteMany();
  await prisma.clientBinding.deleteMany();
  await prisma.objectStructure.deleteMany();
  await prisma.cleaningObject.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Очистка завершена\n');

  // 1. Создаем пользователей
  console.log('👥 Создание пользователей...');
  const hashedPassword = await hashPassword('password123');
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Администратор Системы',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+7 (999) 123-45-67'
    }
  });

  const deputyAdmin = await prisma.user.create({
    data: {
      email: 'deputy@example.com',
      name: 'Заместитель Администратора',
      password: hashedPassword,
      role: 'DEPUTY_ADMIN',
      phone: '+7 (999) 234-56-78'
    }
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@example.com',
      name: 'Бухгалтер Компании',
      password: hashedPassword,
      role: 'ACCOUNTANT',
      phone: '+7 (999) 345-67-89'
    }
  });

  const managersData = [
    { name: 'Козлов Дмитрий Александрович', phone: '+7 (916) 111-22-33' },
    { name: 'Смирнова Ольга Николаевна', phone: '+7 (916) 222-33-44' },
    { name: 'Новиков Сергей Владимирович', phone: '+7 (916) 333-44-55' },
    { name: 'Волкова Анна Игоревна', phone: '+7 (916) 444-55-66' },
    { name: 'Морозов Алексей Юрьевич', phone: '+7 (916) 555-66-77' }
  ];

  const managers = await Promise.all(
    managersData.map((m, i) =>
      prisma.user.create({
        data: {
          email: `manager${i + 1}@example.com`,
          name: m.name,
          password: hashedPassword,
          role: 'MANAGER',
          phone: m.phone
        }
      })
    )
  );

  console.log(`✅ Создано пользователей: ${1 + 1 + 1 + managers.length}\n`);

  // 2. Создаем категории расходов
  console.log('📊 Создание категорий расходов...');
  const categories = await Promise.all([
    prisma.expenseCategory.create({
      data: {
        name: 'Химия и моющие средства',
        description: 'Моющие средства, дезинфекция, освежители',
        isActive: true,
        sortOrder: 1
      }
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Инвентарь и расходники',
        description: 'Швабры, ведра, тряпки, мешки для мусора',
        isActive: true,
        sortOrder: 2
      }
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Зарплата персонала',
        description: 'Заработная плата уборщиков',
        isActive: true,
        sortOrder: 3
      }
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Транспортные расходы',
        description: 'Проезд, доставка материалов',
        isActive: true,
        sortOrder: 4
      }
    }),
    prisma.expenseCategory.create({
      data: {
        name: 'Прочие расходы',
        description: 'Прочие операционные расходы',
        isActive: true,
        sortOrder: 5
      }
    })
  ]);
  console.log(`✅ Создано категорий: ${categories.length}\n`);

  // 3. Создаем объекты уборки
  console.log('🏢 Создание объектов уборки...');
  
  const obj1 = await prisma.cleaningObject.create({
    data: {
      name: 'Производственный комплекс "Техмаш"',
      address: 'г. Москва, ул. Промышленная, д. 15',
      creatorId: admin.id,
      managerId: managers[0].id,
      workingDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'],
      workingHours: { start: '08:00', end: '20:00' },
      totalArea: 2500,
      autoChecklistEnabled: true,
      requirePhotoForCompletion: true,
      description: 'Машиностроительный завод с производственными цехами и административным корпусом',
      notes: 'Требуется ежедневная уборка производственных помещений. Особое внимание к чистоте в сборочном цехе.'
    }
  });

  const obj2 = await prisma.cleaningObject.create({
    data: {
      name: 'Бизнес-центр "Столичный"',
      address: 'г. Москва, Ленинский проспект, д. 45',
      creatorId: admin.id,
      managerId: managers[1].id,
      workingDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'],
      workingHours: { start: '07:00', end: '22:00' },
      totalArea: 3200,
      autoChecklistEnabled: true,
      requirePhotoForCompletion: false,
      description: 'Современный офисный центр класса B+ с арендаторами',
      notes: 'Уборка общих зон ежедневно, офисов арендаторов - по графику'
    }
  });

  const obj3 = await prisma.cleaningObject.create({
    data: {
      name: 'ЖК "Солнечный"',
      address: 'г. Москва, ул. Солнечная, д. 7',
      creatorId: admin.id,
      managerId: managers[2].id,
      workingDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
      workingHours: { start: '06:00', end: '22:00' },
      totalArea: 4500,
      autoChecklistEnabled: true,
      requirePhotoForCompletion: true,
      description: 'Жилой комплекс из 3 корпусов, 150 квартир',
      notes: 'Ежедневная уборка подъездов и придомовой территории. Генеральная уборка - еженедельно.'
    }
  });

  const obj4 = await prisma.cleaningObject.create({
    data: {
      name: 'Торговый центр "Мега Плаза"',
      address: 'г. Москва, Кутузовский проспект, д. 23',
      creatorId: admin.id,
      managerId: managers[3].id,
      workingDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
      workingHours: { start: '06:00', end: '23:00' },
      totalArea: 5000,
      autoChecklistEnabled: true,
      requirePhotoForCompletion: true,
      description: 'Крупный торговый центр с магазинами, кафе и кинотеатром',
      notes: 'Уборка в режиме работы ТЦ. Генеральная уборка после закрытия.'
    }
  });

  const obj5 = await prisma.cleaningObject.create({
    data: {
      name: 'Медицинский центр "Здоровье+"',
      address: 'г. Москва, ул. Медицинская, д. 12',
      creatorId: admin.id,
      managerId: managers[4].id,
      workingDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
      workingHours: { start: '07:00', end: '21:00' },
      totalArea: 1200,
      autoChecklistEnabled: true,
      requirePhotoForCompletion: true,
      description: 'Частная многопрофильная клиника',
      notes: 'Повышенные требования к санитарии. Использование медицинских дезинфицирующих средств обязательно.'
    }
  });

  const objects = [obj1, obj2, obj3, obj4, obj5];
  console.log(`✅ Создано объектов: ${objects.length}\n`);

  // 4. Назначаем объекты заместителю администратора
  console.log('🔗 Назначение объектов заместителю...');
  const deputyObjects = objects.slice(0, 3); // Первые 3 объекта
  await Promise.all(
    deputyObjects.map(obj =>
      prisma.deputyAdminAssignment.create({
        data: {
          deputyAdminId: deputyAdmin.id,
          objectId: obj.id,
          assignedById: admin.id
        }
      })
    )
  );
  console.log(`✅ Назначено объектов заместителю: ${deputyObjects.length}\n`);

  // 5. Создаем структуру для объектов (сайты, зоны, помещения)
  console.log('🏗️ Создание структуры объектов...');
  let totalRooms = 0;
  
  // Производственный комплекс "Техмаш" - 2 менеджера на разных участках
  const adminSite = await prisma.site.create({
    data: {
      name: 'Административный корпус',
      objectId: obj1.id,
      managerId: managers[0].id, // Козлов
      area: 600
    }
  });

  const adminZone = await prisma.zone.create({
    data: { name: 'Первый этаж', siteId: adminSite.id, area: 300 }
  });

  const officeGroup = await prisma.roomGroup.create({
    data: { name: 'Офисная зона', zoneId: adminZone.id, area: 130 }
  });

  await prisma.room.createMany({
    data: [
      { name: 'Приемная', objectId: obj1.id, roomGroupId: officeGroup.id, area: 25, description: 'Входная зона с ресепшн' },
      { name: 'Переговорная №1', objectId: obj1.id, roomGroupId: officeGroup.id, area: 30, description: 'Конференц-зал на 12 человек' },
      { name: 'Кабинет директора', objectId: obj1.id, roomGroupId: officeGroup.id, area: 35, description: 'Рабочий кабинет с зоной отдыха' },
      { name: 'Бухгалтерия', objectId: obj1.id, roomGroupId: officeGroup.id, area: 40, description: 'Открытое офисное пространство' }
    ]
  });
  totalRooms += 4;

  const prodSite = await prisma.site.create({
    data: {
      name: 'Производственный корпус',
      objectId: obj1.id,
      managerId: managers[1].id, // Смирнова - второй менеджер
      area: 1900
    }
  });

  const ceh1Zone = await prisma.zone.create({
    data: { name: 'Цех №1', siteId: prodSite.id, area: 1000 }
  });

  const assemblyGroup = await prisma.roomGroup.create({
    data: { name: 'Сборочный участок', zoneId: ceh1Zone.id, area: 440 }
  });

  await prisma.room.createMany({
    data: [
      { name: 'Линия сборки А', objectId: obj1.id, roomGroupId: assemblyGroup.id, area: 200, description: 'Основная производственная линия' },
      { name: 'Линия сборки Б', objectId: obj1.id, roomGroupId: assemblyGroup.id, area: 180, description: 'Вспомогательная линия' },
      { name: 'Склад комплектующих', objectId: obj1.id, roomGroupId: assemblyGroup.id, area: 60, description: 'Хранение деталей' }
    ]
  });
  totalRooms += 3;

  // Бизнес-центр "Столичный"
  const bcSite = await prisma.site.create({
    data: { name: 'Башня А', objectId: obj2.id, managerId: obj2.managerId, area: 800 }
  });

  const bcZone1 = await prisma.zone.create({
    data: { name: '1 этаж', siteId: bcSite.id, area: 400 }
  });

  const bcGroup1 = await prisma.roomGroup.create({
    data: { name: 'Общие зоны', zoneId: bcZone1.id, area: 330 }
  });

  await prisma.room.createMany({
    data: [
      { name: 'Главный холл', objectId: obj2.id, roomGroupId: bcGroup1.id, area: 150, description: 'Входная группа с ресепшн' },
      { name: 'Коридор', objectId: obj2.id, roomGroupId: bcGroup1.id, area: 80, description: 'Центральный коридор' },
      { name: 'Санузлы (М)', objectId: obj2.id, roomGroupId: bcGroup1.id, area: 25, description: 'Мужской санузел' },
      { name: 'Санузлы (Ж)', objectId: obj2.id, roomGroupId: bcGroup1.id, area: 25, description: 'Женский санузел' }
    ]
  });
  totalRooms += 4;

  // ЖК "Солнечный"
  const zhkSite = await prisma.site.create({
    data: { name: 'Корпус 1', objectId: obj3.id, managerId: obj3.managerId, area: 600 }
  });

  const zhkZone = await prisma.zone.create({
    data: { name: 'Подъезд 1', siteId: zhkSite.id, area: 300 }
  });

  const zhkGroup = await prisma.roomGroup.create({
    data: { name: 'Этаж 1-5', zoneId: zhkZone.id, area: 155 }
  });

  await prisma.room.createMany({
    data: [
      { name: 'Лестничная клетка 1-2 этаж', objectId: obj3.id, roomGroupId: zhkGroup.id, area: 40, description: 'Лестницы и площадки' },
      { name: 'Лестничная клетка 3-4 этаж', objectId: obj3.id, roomGroupId: zhkGroup.id, area: 40, description: 'Лестницы и площадки' },
      { name: 'Лестничная клетка 5 этаж', objectId: obj3.id, roomGroupId: zhkGroup.id, area: 20, description: 'Верхний этаж' },
      { name: 'Лифтовой холл', objectId: obj3.id, roomGroupId: zhkGroup.id, area: 15, description: 'Зона лифтов' }
    ]
  });
  totalRooms += 4;

  console.log(`✅ Создано помещений: ${totalRooms}\n`);

  // 6. Создаем техкарты
  console.log('📋 Создание техкарт...');
  
  // Техкарты для Производственного комплекса "Техмаш"
  await prisma.techCard.createMany({
    data: [
      {
        name: 'Влажная уборка производственных помещений',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj1.id,
        description: 'Влажная уборка полов, удаление производственной пыли с поверхностей',
        notes: 'Использовать промышленный пылесос. Особое внимание к углам и труднодоступным местам.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Уборка административных помещений',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj1.id,
        description: 'Влажная уборка офисов, протирка мебели, вынос мусора',
        notes: 'Уборка после окончания рабочего дня (после 18:00)',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Генеральная уборка цехов',
        workType: 'Генеральная уборка',
        frequency: 'Ежемесячно',
        objectId: obj1.id,
        description: 'Комплексная уборка производственных помещений с мытьем стен, потолков, оборудования',
        notes: 'Проводится в выходные дни. Требуется согласование с начальником производства.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 30
      }
    ]
  });

  // Техкарты для Бизнес-центра "Столичный"
  await prisma.techCard.createMany({
    data: [
      {
        name: 'Уборка офисных помещений',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj2.id,
        description: 'Влажная уборка полов, протирка столов, вынос мусора',
        notes: 'Уборка после 19:00 или по согласованию с арендатором',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Уборка общих зон (холлы, коридоры)',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj2.id,
        description: 'Влажная уборка полов, протирка перил, дверей, стеклянных поверхностей',
        notes: 'Утренняя уборка до 9:00, поддерживающая - в течение дня',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Мытье окон',
        workType: 'Периодическая уборка',
        frequency: 'Еженедельно',
        objectId: obj2.id,
        description: 'Мытье окон в офисах и общих зонах',
        notes: 'По графику, согласованному с арендаторами',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 7
      }
    ]
  });

  // Техкарты для ЖК "Солнечный"
  await prisma.techCard.createMany({
    data: [
      {
        name: 'Уборка подъездов',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj3.id,
        description: 'Влажная уборка лестничных клеток, протирка перил, мытье полов',
        notes: 'Утренняя уборка до 10:00',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Уборка придомовой территории',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj3.id,
        description: 'Подметание дорожек, уборка мусора, очистка урн',
        notes: 'Летом - полив газонов. Зимой - уборка снега.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Генеральная уборка подъездов',
        workType: 'Генеральная уборка',
        frequency: 'Еженедельно',
        objectId: obj3.id,
        description: 'Мытье стен, потолков, дверей, почтовых ящиков',
        notes: 'Проводится по субботам',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 7
      }
    ]
  });

  // Техкарты для Торгового центра "Мега Плаза"
  await prisma.techCard.createMany({
    data: [
      {
        name: 'Уборка торговых залов',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj4.id,
        description: 'Влажная уборка полов, протирка витрин, вынос мусора',
        notes: 'Поддерживающая уборка в течение дня, основная - после закрытия',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Уборка санузлов',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj4.id,
        description: 'Дезинфекция сантехники, мытье полов, пополнение расходников',
        notes: 'Проверка каждый час в часы работы ТЦ',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      }
    ]
  });

  // Техкарты для Медицинского центра "Здоровье+"
  await prisma.techCard.createMany({
    data: [
      {
        name: 'Уборка кабинетов врачей',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj5.id,
        description: 'Влажная уборка с дезинфекцией всех поверхностей',
        notes: 'Использовать только медицинские дезинфицирующие средства. Уборка после каждого приема.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Дезинфекция процедурных кабинетов',
        workType: 'Ежедневная уборка',
        frequency: 'Ежедневно',
        objectId: obj5.id,
        description: 'Тщательная дезинфекция всех поверхностей, оборудования',
        notes: 'Строгое соблюдение санитарных норм. Использовать СИЗ.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 1
      },
      {
        name: 'Генеральная уборка с дезинфекцией',
        workType: 'Генеральная уборка',
        frequency: 'Еженедельно',
        objectId: obj5.id,
        description: 'Комплексная уборка с обработкой всех поверхностей, включая стены и потолки',
        notes: 'Проводится в выходные дни. Обязательна кварцевая обработка помещений.',
        autoGenerate: true,
        isActive: true,
        frequencyDays: 7
      }
    ]
  });

  const totalTechCards = 3 + 3 + 3 + 2 + 3; // 14 техкарт
  console.log(`✅ Создано техкарт: ${totalTechCards}\n`);

  // 7. Создаем лимиты по категориям
  console.log('💰 Создание лимитов расходов...');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  let totalLimits = 0;
  for (const obj of objects) {
    // Месячные лимиты
    for (const category of categories.slice(0, 3)) {
      await prisma.expenseCategoryLimit.create({
        data: {
          amount: faker.number.int({ min: 10000, max: 50000 }),
          periodType: 'MONTHLY',
          month: currentMonth,
          year: currentYear,
          objectId: obj.id,
          categoryId: category.id,
          setById: admin.id,
          isRecurring: true
        }
      });
      totalLimits++;
    }

    // Ежедневные лимиты
    await prisma.expenseCategoryLimit.create({
      data: {
        amount: faker.number.int({ min: 500, max: 2000 }),
        periodType: 'DAILY',
        objectId: obj.id,
        categoryId: categories[1].id, // Инвентарь
        setById: admin.id
      }
    });
    totalLimits++;

    // Годовой лимит
    await prisma.expenseCategoryLimit.create({
      data: {
        amount: faker.number.int({ min: 100000, max: 500000 }),
        periodType: 'ANNUAL',
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(currentYear, 11, 31),
        objectId: obj.id,
        categoryId: categories[2].id, // Зарплата
        setById: admin.id
      }
    });
    totalLimits++;
  }
  console.log(`✅ Создано лимитов: ${totalLimits}\n`);

  // 8. Создаем расходы
  console.log('💸 Создание расходов...');
  
  const expenseDescriptions = [
    { desc: 'Моющее средство "Мистер Пропер" 5л', category: 0, amount: 850 },
    { desc: 'Дезинфицирующее средство "Domestos" 3л', category: 0, amount: 650 },
    { desc: 'Мешки для мусора 120л (рулон 20шт)', category: 1, amount: 420 },
    { desc: 'Швабра с отжимом + ведро', category: 1, amount: 1200 },
    { desc: 'Микрофибра для уборки (упаковка 10шт)', category: 1, amount: 890 },
    { desc: 'Перчатки резиновые (50 пар)', category: 1, amount: 750 },
    { desc: 'Средство для мытья окон "Clin" 2л', category: 0, amount: 380 },
    { desc: 'Освежитель воздуха (6шт)', category: 0, amount: 540 },
    { desc: 'Туалетная бумага (упаковка 24 рулона)', category: 1, amount: 680 },
    { desc: 'Жидкое мыло для рук (5л)', category: 0, amount: 720 }
  ];

  let totalExpenses = 0;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  for (const obj of objects) {
    // Расходы за текущий месяц
    for (let i = 0; i < 6; i++) {
      const expense = expenseDescriptions[i % expenseDescriptions.length];
      await prisma.inventoryExpense.create({
        data: {
          amount: expense.amount,
          description: expense.desc,
          month: currentMonth,
          year: currentYear,
          objectId: obj.id,
          categoryId: categories[expense.category].id,
          recordedById: obj.managerId || admin.id
        }
      });
      totalExpenses++;
    }

    // Расходы за прошлый месяц
    for (let i = 0; i < 5; i++) {
      const expense = expenseDescriptions[(i + 5) % expenseDescriptions.length];
      await prisma.inventoryExpense.create({
        data: {
          amount: expense.amount,
          description: expense.desc,
          month: lastMonth,
          year: lastMonthYear,
          objectId: obj.id,
          categoryId: categories[expense.category].id,
          recordedById: obj.managerId || admin.id
        }
      });
      totalExpenses++;
    }
  }
  console.log(`✅ Создано расходов: ${totalExpenses}\n`);

  // 9. Создаем чеклисты и задачи
  console.log('✅ Создание чеклистов и задач...');
  let totalChecklists = 0;
  let totalTasks = 0;
  
  for (const obj of objects.slice(0, 5)) {
    const objRooms = await prisma.room.findMany({
      where: { objectId: obj.id }
    });

    // Создаем чеклисты за последние 7 дней
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);

      const checklist = await prisma.checklist.create({
        data: {
          date: date,
          objectId: obj.id,
          roomId: objRooms[0]?.id,
          creatorId: admin.id,
          completedAt: day < 5 ? date : null,
          completedById: day < 5 ? obj.managerId : null,
          name: `Чеклист ${date.toLocaleDateString('ru-RU')}`
        }
      });
      totalChecklists++;

      // Создаем задачи для чеклиста
      const taskDescriptions = [
        'Протереть пыль с поверхностей',
        'Вымыть полы влажной шваброй',
        'Вынести мусорные корзины'
      ];
      
      for (let i = 0; i < 3; i++) {
        await prisma.task.create({
          data: {
            description: taskDescriptions[i],
            status: day < 5 ? 'COMPLETED' : 'NEW',
            checklistId: checklist.id,
            roomId: objRooms[0]?.id,
            completedById: day < 5 ? obj.managerId : null,
            completedAt: day < 5 ? date : null
          }
        });
        totalTasks++;
      }
    }
  }
  console.log(`✅ Создано чеклистов: ${totalChecklists}`);
  console.log(`✅ Создано задач: ${totalTasks}\n`);

  // 10. Создаем выполнения задач (TaskExecution)
  console.log('📅 Создание выполнений задач...');
  let totalExecutions = 0;
  
  for (const obj of objects.slice(0, 4)) {
    const objTechCards = await prisma.techCard.findMany({
      where: { objectId: obj.id },
      take: 3
    });

    for (const techCard of objTechCards) {
      // Создаем выполнения за последние 7 дней
      for (let day = 0; day < 7; day++) {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() - day);
        
        const dueDate = new Date(scheduledDate);
        dueDate.setHours(dueDate.getHours() + 2);

        await prisma.taskExecution.create({
          data: {
            techCardId: techCard.id,
            objectId: obj.id,
            managerId: obj.managerId || managers[0].id,
            scheduledFor: scheduledDate,
            dueDate: dueDate,
            executedAt: day < 5 ? scheduledDate : null,
            status: day < 5 ? 'COMPLETED' : 'PENDING',
            comment: day < 5 ? 'Выполнено' : null
          }
        });
        totalExecutions++;
      }
    }
  }
  console.log(`✅ Создано выполнений: ${totalExecutions}\n`);

  // 11. Создаем дополнительные задачи
  console.log('📝 Создание дополнительных задач...');
  
  const additionalTasksData = [
    { title: 'Заменить лампочку в коридоре', content: 'В коридоре на 2 этаже перегорела лампочка. Необходимо заменить.' },
    { title: 'Устранить протечку в санузле', content: 'В мужском санузле подтекает кран. Требуется вызов сантехника или временный ремонт.' },
    { title: 'Дополнительная уборка после мероприятия', content: 'После корпоративного мероприятия в переговорной требуется дополнительная уборка.' },
    { title: 'Закупить дополнительные расходники', content: 'Закончились мешки для мусора и туалетная бумага. Срочно нужна закупка.' },
    { title: 'Проверить работу вентиляции', content: 'Жалобы на плохую вентиляцию в офисе 201. Проверить систему.' },
    { title: 'Убрать снег у входа', content: 'После снегопада необходимо расчистить входную группу и дорожки.' }
  ];

  let totalAdditionalTasks = 0;
  
  for (const obj of objects.slice(0, 3)) {
    for (let i = 0; i < 2; i++) {
      const taskData = additionalTasksData[(totalAdditionalTasks + i) % additionalTasksData.length];
      await prisma.additionalTask.create({
        data: {
          title: taskData.title,
          content: taskData.content,
          source: 'Telegram',
          sourceDetails: {
            chatId: 123456789,
            messageId: 100 + totalAdditionalTasks + i
          },
          status: i === 0 ? 'NEW' : 'IN_PROGRESS',
          objectId: obj.id,
          assignedToId: obj.managerId || managers[0].id,
          completedById: null,
          completedAt: null,
          receivedAt: new Date()
        }
      });
      totalAdditionalTasks++;
    }
  }
  console.log(`✅ Создано дополнительных задач: ${totalAdditionalTasks}\n`);

  // Итоговая статистика
  console.log('\n═══════════════════════════════════════');
  console.log('✅ РЕАЛИСТИЧНЫЕ ДАННЫЕ УСПЕШНО СОЗДАНЫ!');
  console.log('═══════════════════════════════════════');
  console.log(`\n📊 СТАТИСТИКА:`);
  console.log(`   👥 Пользователей: ${3 + managers.length}`);
  console.log(`   📊 Категорий расходов: ${categories.length}`);
  console.log(`   🏢 Объектов уборки: ${objects.length}`);
  console.log(`   🏗️ Помещений: ${totalRooms}`);
  console.log(`   📋 Техкарт: ${totalTechCards}`);
  console.log(`   💰 Лимитов: ${totalLimits}`);
  console.log(`   💸 Расходов: ${totalExpenses}`);
  console.log(`   ✅ Чеклистов: ${totalChecklists}`);
  console.log(`   📝 Задач: ${totalTasks}`);
  console.log(`   📅 Выполнений: ${totalExecutions}`);
  console.log(`   📝 Доп. задач: ${totalAdditionalTasks}`);
  console.log(`\n🔑 УЧЕТНЫЕ ЗАПИСИ:`);
  console.log(`   Администратор: admin@example.com / password123`);
  console.log(`   Заместитель: deputy@example.com / password123`);
  console.log(`   Бухгалтер: accountant@example.com / password123`);
  console.log(`   Менеджеры: manager1-5@example.com / password123`);
  console.log(`\n🏢 ОБЪЕКТЫ:`);
  console.log(`   1. Производственный комплекс "Техмаш" (2 менеджера)`);
  console.log(`   2. Бизнес-центр "Столичный"`);
  console.log(`   3. ЖК "Солнечный"`);
  console.log(`   4. Торговый центр "Мега Плаза"`);
  console.log(`   5. Медицинский центр "Здоровье+"`);
  console.log(`\n🎉 Готово! Можете запускать проект: npm run dev`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ОШИБКА при создании данных:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
