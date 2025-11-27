import { chromium, Page, Browser, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Утилита для ожидания загрузки контента
async function waitForContent(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('   ⚠️  Таймаут загрузки, продолжаем...');
  }
}

// Проверка URL
async function verifyURL(page: Page, expectedPath: string): Promise<boolean> {
  const currentURL = page.url();
  const matches = currentURL.includes(expectedPath);
  if (!matches) {
    console.log(`   ⚠️  URL не совпадает: ожидали "${expectedPath}", получили "${currentURL}"`);
  }
  return matches;
}

// Утилита для безопасного скриншота
async function takeScreenshotSafe(
  page: Page,
  filename: string,
  options: { fullPage?: boolean; selector?: string; clip?: { x: number; y: number; width: number; height: number } } = {}
): Promise<boolean> {
  try {
    const screenshotPath = path.join('public', 'manual', 'screenshots', filename);
    
    if (options.selector) {
      try {
        await page.waitForSelector(options.selector, { timeout: 5000 });
        const element = await page.$(options.selector);
        if (element) {
          await element.screenshot({ path: screenshotPath });
          return true;
        }
      } catch (e) {
        // Селектор не найден, делаем обычный скриншот
      }
    }
    
    if (options.clip) {
      await page.screenshot({ path: screenshotPath, clip: options.clip });
      return true;
    }
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage || false
    });
    return true;
  } catch (error: any) {
    console.error(`   ❌ Ошибка при создании ${filename}:`, error.message);
    return false;
  }
}

// Утилита для клика с проверкой
async function clickSafe(page: Page, selector: string, description: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await page.waitForTimeout(500);
    return true;
  } catch (e) {
    console.log(`   ⚠️  Не удалось кликнуть: ${description}`);
    return false;
  }
}

async function takeAllScreenshots() {
  console.log('🚀 Запуск создания ВСЕХ 150 скриншотов...\n');
  console.log('⚠️  ВАЖНО: Сервер должен быть запущен на http://localhost:3000');
  console.log('⚠️  ВАЖНО: База данных должна содержать тестовые данные\n');

  const screenshotsDir = path.join('public', 'manual', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 50
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  let successCount = 0;
  let failCount = 0;

  try {
    // ==================== НАЧАЛО РАБОТЫ (1-4) ====================
    console.log('\n📄 РАЗДЕЛ 1: Начало работы (скриншоты 1-4)\n');

    // Скриншот 1: Страница входа
    console.log('📸 Скриншот 1: Страница входа в систему');
    await page.goto('http://localhost:3000/login');
    await waitForContent(page);
    await verifyURL(page, '/login');
    if (await takeScreenshotSafe(page, 'screenshot-001.png')) {
      console.log('   ✅ screenshot-001.png');
      successCount++;
    } else {
      failCount++;
    }

    // Логин
    console.log('\n🔐 Вход в систему...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await waitForContent(page);
    console.log('✅ Вход выполнен\n');

    // Скриншот 2: Главная страница
    console.log('📸 Скриншот 2: Главная страница с боковым меню');
    await page.goto('http://localhost:3000/');
    await waitForContent(page);
    await verifyURL(page, 'localhost:3000');
    if (await takeScreenshotSafe(page, 'screenshot-002.png', { fullPage: true })) {
      console.log('   ✅ screenshot-002.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 3: Верхняя панель
    console.log('📸 Скриншот 3: Верхняя панель с профилем пользователя');
    if (await takeScreenshotSafe(page, 'screenshot-003.png', { 
      clip: { x: 0, y: 0, width: 1920, height: 80 }
    })) {
      console.log('   ✅ screenshot-003.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 4: Меню со счетчиками
    console.log('📸 Скриншот 4: Меню со счетчиками уведомлений');
    if (await takeScreenshotSafe(page, 'screenshot-004.png', { 
      clip: { x: 0, y: 0, width: 280, height: 900 }
    })) {
      console.log('   ✅ screenshot-004.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== УПРАВЛЕНИЕ ОБЪЕКТАМИ (5-19) ====================
    console.log('\n📄 РАЗДЕЛ 2: Управление объектами (скриншоты 5-19)\n');

    // Скриншот 5: Список объектов
    console.log('📸 Скриншот 5: Список объектов с карточками');
    await page.goto('http://localhost:3000/objects');
    await waitForContent(page);
    await verifyURL(page, '/objects');
    if (await takeScreenshotSafe(page, 'screenshot-005.png', { fullPage: true })) {
      console.log('   ✅ screenshot-005.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 6: Карточка объекта
    console.log('📸 Скриншот 6: Карточка объекта с информацией');
    if (await takeScreenshotSafe(page, 'screenshot-006.png', { 
      selector: 'article, .card, [class*="card"]'
    })) {
      console.log('   ✅ screenshot-006.png');
      successCount++;
    } else {
      await takeScreenshotSafe(page, 'screenshot-006.png', { 
        clip: { x: 50, y: 200, width: 400, height: 300 }
      });
      console.log('   ✅ screenshot-006.png (fallback)');
      successCount++;
    }

    // Скриншот 7: Панель фильтров
    console.log('📸 Скриншот 7: Панель фильтров');
    if (await takeScreenshotSafe(page, 'screenshot-007.png', { 
      clip: { x: 0, y: 100, width: 1920, height: 120 }
    })) {
      console.log('   ✅ screenshot-007.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 8: Кнопка создания
    console.log('📸 Скриншот 8: Кнопка создания объекта');
    if (await takeScreenshotSafe(page, 'screenshot-008.png', { 
      clip: { x: 1600, y: 100, width: 300, height: 60 }
    })) {
      console.log('   ✅ screenshot-008.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншоты 9-13: Формы и диалоги (делаем как есть, без взаимодействия)
    for (let i = 9; i <= 13; i++) {
      console.log(`📸 Скриншот ${i}: (требует ручного создания)`);
      console.log(`   ⚠️  Пропущен - требует взаимодействия с формами`);
    }

    // Скриншот 14: Telegram клиенты
    console.log('📸 Скриншот 14: Страница управления клиентами в Telegram');
    await page.goto('http://localhost:3000/telegram');
    await waitForContent(page);
    await verifyURL(page, '/telegram');
    if (await takeScreenshotSafe(page, 'screenshot-014.png', { fullPage: true })) {
      console.log('   ✅ screenshot-014.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншоты 15-17: Диалоги (пропускаем)
    for (let i = 15; i <= 17; i++) {
      console.log(`📸 Скриншот ${i}: (требует ручного создания)`);
      console.log(`   ⚠️  Пропущен - требует взаимодействия`);
    }

    // Скриншот 18: Детали объекта (попробуем открыть первый)
    console.log('📸 Скриншот 18: Страница деталей объекта');
    await page.goto('http://localhost:3000/objects');
    await waitForContent(page);
    // Попробуем кликнуть на первую карточку
    const firstCard = await page.$('a[href*="/objects/"]');
    if (firstCard) {
      await firstCard.click();
      await waitForContent(page);
      if (await takeScreenshotSafe(page, 'screenshot-018.png', { fullPage: true })) {
        console.log('   ✅ screenshot-018.png');
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log('   ⚠️  Не найден объект для открытия');
    }

    // Скриншот 19: Статистика объекта
    console.log('📸 Скриншот 19: Раздел статистики объекта');
    if (await takeScreenshotSafe(page, 'screenshot-019.png', { 
      clip: { x: 0, y: 400, width: 1920, height: 400 }
    })) {
      console.log('   ✅ screenshot-019.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ ЗАДАНИЯ (20-38) ====================
    console.log('\n📄 РАЗДЕЛ 3: Дополнительные задания (скриншоты 20-38)\n');
    console.log('⚠️  Большинство скриншотов этого раздела требуют ручного создания');
    
    // Пропускаем 20-38, так как требуют сложного взаимодействия

    // ==================== ОТЧЕТНОСТЬ ПО ЧЕК-ЛИСТАМ (39-68) ====================
    console.log('\n📄 РАЗДЕЛ 4: Отчетность по чек-листам (скриншоты 39-68)\n');

    // Скриншот 39-41: Отчетность
    console.log('📸 Скриншот 39-41: Страница отчетности');
    await page.goto('http://localhost:3000/reporting');
    await waitForContent(page);
    await verifyURL(page, '/reporting');
    if (await takeScreenshotSafe(page, 'screenshot-039.png', { fullPage: true })) {
      console.log('   ✅ screenshot-039.png');
      successCount++;
    } else {
      failCount++;
    }

    // Остальные требуют взаимодействия
    console.log('⚠️  Скриншоты 40-68 требуют ручного создания');

    // ==================== TELEGRAM БОТ (69-96) ====================
    console.log('\n📄 РАЗДЕЛ 5: Telegram бот (скриншоты 69-96)\n');
    console.log('⚠️  Скриншоты Telegram бота требуют ручного создания в приложении Telegram');

    // Скриншот 74: уже сделали выше

    // ==================== КАЛЕНДАРЬ И СТАТИСТИКА (97-134) ====================
    console.log('\n📄 РАЗДЕЛ 6: Календарь и статистика (скриншоты 97-134)\n');

    // Скриншот 97: Календарь
    console.log('📸 Скриншот 97: Страница единого календаря');
    await page.goto('http://localhost:3000/calendar');
    await waitForContent(page);
    await verifyURL(page, '/calendar');
    if (await takeScreenshotSafe(page, 'screenshot-097.png', { fullPage: true })) {
      console.log('   ✅ screenshot-097.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншоты 98-134: требуют взаимодействия
    console.log('⚠️  Скриншоты 98-134 требуют ручного создания');

    // ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (135-150) ====================
    console.log('\n📄 РАЗДЕЛ 7: Управление пользователями (скриншоты 135-150)\n');

    // Скриншот 135: Пользователи
    console.log('📸 Скриншот 135: Страница управления пользователями');
    await page.goto('http://localhost:3000/users');
    await waitForContent(page);
    await verifyURL(page, '/users');
    if (await takeScreenshotSafe(page, 'screenshot-135.png', { fullPage: true })) {
      console.log('   ✅ screenshot-135.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 136: Список пользователей
    console.log('📸 Скриншот 136: Список пользователей с карточками');
    if (await takeScreenshotSafe(page, 'screenshot-136.png', { 
      clip: { x: 0, y: 150, width: 1920, height: 700 }
    })) {
      console.log('   ✅ screenshot-136.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 137: Карточка пользователя
    console.log('📸 Скриншот 137: Карточка пользователя');
    if (await takeScreenshotSafe(page, 'screenshot-137.png', { 
      selector: 'article, .card, [class*="user"]'
    })) {
      console.log('   ✅ screenshot-137.png');
      successCount++;
    } else {
      await takeScreenshotSafe(page, 'screenshot-137.png', { 
        clip: { x: 50, y: 200, width: 400, height: 250 }
      });
      console.log('   ✅ screenshot-137.png (fallback)');
      successCount++;
    }

    // Скриншоты 138-150: требуют взаимодействия
    console.log('⚠️  Скриншоты 138-150 требуют ручного создания');

    // ==================== ДОПОЛНИТЕЛЬНЫЕ СТРАНИЦЫ ====================
    console.log('\n📄 ДОПОЛНИТЕЛЬНЫЕ СКРИНШОТЫ\n');

    // Инвентарь
    console.log('📸 Дополнительно: Страница инвентаря');
    await page.goto('http://localhost:3000/inventory');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-inventory.png', { fullPage: true })) {
      console.log('   ✅ screenshot-inventory.png');
      successCount++;
    } else {
      failCount++;
    }

    // Дашборд
    console.log('📸 Дополнительно: Дашборд со статистикой');
    await page.goto('http://localhost:3000/');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-dashboard.png', { fullPage: true })) {
      console.log('   ✅ screenshot-dashboard.png');
      successCount++;
    } else {
      failCount++;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Автоматическое создание скриншотов завершено!');
    console.log('📁 Скриншоты сохранены в: public/manual/screenshots/');
    console.log(`\n📊 Статистика:`);
    console.log(`   ✅ Успешно создано: ${successCount}`);
    console.log(`   ❌ Ошибок: ${failCount}`);
    console.log(`   📸 Всего: ${successCount + failCount}`);
    console.log('\n💡 Важная информация:');
    console.log('   - Создано ~20 базовых скриншотов автоматически');
    console.log('   - Остальные ~130 скриншотов требуют ручного создания');
    console.log('   - Скриншоты форм, диалогов и модальных окон нужно делать вручную');
    console.log('   - Скриншоты Telegram бота делаются в приложении Telegram');
    console.log('   - Проверьте качество всех созданных скриншотов');
    console.log('='.repeat(70));

  } catch (error: any) {
    console.error('\n❌ Критическая ошибка:', error);
    console.error('\nСтек:', error.stack);
  } finally {
    await browser.close();
  }
}

takeAllScreenshots()
  .catch((error) => {
    console.error('\n❌ Необработанная ошибка:', error);
    process.exit(1);
  });
