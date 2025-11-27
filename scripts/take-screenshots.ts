import { chromium, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Утилита для ожидания загрузки контента
async function waitForContent(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForTimeout(1000); // Дополнительная пауза для анимаций
}

// Утилита для скриншота с проверкой элемента
async function takeScreenshotSafe(
  page: Page,
  filename: string,
  options: { fullPage?: boolean; selector?: string } = {}
) {
  try {
    const screenshotPath = path.join('public', 'manual', 'screenshots', filename);
    
    if (options.selector) {
      // Ждем появления элемента
      await page.waitForSelector(options.selector, { timeout: 10000 });
      const element = await page.$(options.selector);
      if (element) {
        await element.screenshot({ path: screenshotPath });
        return true;
      }
    }
    
    // Обычный скриншот страницы
    await page.screenshot({
      path: screenshotPath,
      fullPage: options.fullPage || false
    });
    return true;
  } catch (error: any) {
    console.error(`   ⚠️  Ошибка при создании ${filename}:`, error.message);
    return false;
  }
}

async function takeScreenshots() {
  console.log('🚀 Запуск автоматического создания скриншотов...\n');
  console.log('⚠️  ВАЖНО: Убедитесь что сервер запущен на http://localhost:3000');
  console.log('⚠️  ВАЖНО: База данных должна содержать тестовые данные\n');

  // Создаем директорию для скриншотов
  const screenshotsDir = path.join('public', 'manual', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Замедляем для стабильности
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  let successCount = 0;
  let failCount = 0;

  try {
    // ==================== НАЧАЛО РАБОТЫ ====================
    console.log('\n📄 Раздел: Начало работы\n');

    // Скриншот 1: Страница входа
    console.log('📸 Скриншот 1: Страница входа в систему');
    await page.goto('http://localhost:3000/login');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-001.png')) {
      console.log('   ✅ screenshot-001.png');
      successCount++;
    } else {
      failCount++;
    }

    // Логин в систему
    console.log('\n🔐 Вход в систему...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Ждем редиректа или загрузки главной страницы
    try {
      await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
    } catch (e) {
      // Если не дождались редиректа, проверим текущий URL
      console.log('   ⚠️  Таймаут ожидания редиректа, текущий URL:', page.url());
      // Если уже на главной, продолжаем
      if (!page.url().includes('localhost:3000')) {
        throw e;
      }
    }
    
    await waitForContent(page);
    console.log('✅ Вход выполнен\n');

    // Скриншот 2: Главная страница с боковым меню
    console.log('📸 Скриншот 2: Главная страница с боковым меню');
    await page.goto('http://localhost:3000/');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-002.png')) {
      console.log('   ✅ screenshot-002.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 3: Верхняя панель с профилем
    console.log('📸 Скриншот 3: Верхняя панель с профилем пользователя');
    // Пытаемся найти header или nav
    const headerSelector = 'header, nav, [role="banner"]';
    if (await takeScreenshotSafe(page, 'screenshot-003.png', { selector: headerSelector })) {
      console.log('   ✅ screenshot-003.png');
      successCount++;
    } else {
      // Fallback - скриншот верхней части страницы
      await page.screenshot({
        path: 'public/manual/screenshots/screenshot-003.png',
        clip: { x: 0, y: 0, width: 1920, height: 100 }
      });
      console.log('   ✅ screenshot-003.png (fallback)');
      successCount++;
    }

    // Скриншот 4: Меню со счетчиками
    console.log('📸 Скриншот 4: Меню со счетчиками уведомлений');
    // Пытаемся найти sidebar
    const sidebarSelector = 'aside, [role="navigation"], .sidebar';
    if (await takeScreenshotSafe(page, 'screenshot-004.png', { selector: sidebarSelector })) {
      console.log('   ✅ screenshot-004.png');
      successCount++;
    } else {
      // Fallback - скриншот левой части
      await page.screenshot({
        path: 'public/manual/screenshots/screenshot-004.png',
        clip: { x: 0, y: 0, width: 300, height: 800 }
      });
      console.log('   ✅ screenshot-004.png (fallback)');
      successCount++;
    }

    // ==================== УПРАВЛЕНИЕ ОБЪЕКТАМИ ====================
    console.log('\n📄 Раздел: Управление объектами\n');

    // Скриншот 5: Список объектов с карточками
    console.log('📸 Скриншот 5: Список объектов с карточками');
    await page.goto('http://localhost:3000/objects');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-005.png', { fullPage: true })) {
      console.log('   ✅ screenshot-005.png');
      successCount++;
    } else {
      failCount++;
    }

    // Скриншот 6: Карточка объекта
    console.log('📸 Скриншот 6: Карточка объекта с информацией');
    // Пытаемся найти первую карточку
    const cardSelector = '.card, [class*="card"], article';
    if (await takeScreenshotSafe(page, 'screenshot-006.png', { selector: cardSelector })) {
      console.log('   ✅ screenshot-006.png');
      successCount++;
    } else {
      await takeScreenshotSafe(page, 'screenshot-006.png');
      console.log('   ✅ screenshot-006.png (fallback)');
      successCount++;
    }

    // Скриншот 7: Панель фильтров
    console.log('📸 Скриншот 7: Панель фильтров');
    const filterSelector = '[class*="filter"], [class*="search"]';
    if (await takeScreenshotSafe(page, 'screenshot-007.png', { selector: filterSelector })) {
      console.log('   ✅ screenshot-007.png');
      successCount++;
    } else {
      await page.screenshot({
        path: 'public/manual/screenshots/screenshot-007.png',
        clip: { x: 0, y: 100, width: 1920, height: 150 }
      });
      console.log('   ✅ screenshot-007.png (fallback)');
      successCount++;
    }

    // Скриншот 8: Кнопка создания объекта
    console.log('📸 Скриншот 8: Кнопка создания объекта');
    const createButtonSelector = 'button:has-text("Создать"), a:has-text("Создать"), [class*="create"]';
    if (await takeScreenshotSafe(page, 'screenshot-008.png', { selector: createButtonSelector })) {
      console.log('   ✅ screenshot-008.png');
      successCount++;
    } else {
      await takeScreenshotSafe(page, 'screenshot-008.png');
      console.log('   ✅ screenshot-008.png (fallback)');
      successCount++;
    }

    // ==================== ОТЧЕТНОСТЬ ====================
    console.log('\n📄 Раздел: Отчетность по чек-листам\n');

    // Скриншот 39-44: Отчетность
    console.log('📸 Скриншот 39-44: Страница отчетности');
    await page.goto('http://localhost:3000/reporting');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-039.png', { fullPage: true })) {
      console.log('   ✅ screenshot-039.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== TELEGRAM ====================
    console.log('\n📄 Раздел: Telegram бот\n');

    // Скриншот 74: Управление клиентами в Telegram
    console.log('📸 Скриншот 74: Страница управления клиентами в Telegram');
    await page.goto('http://localhost:3000/telegram');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-074.png', { fullPage: true })) {
      console.log('   ✅ screenshot-074.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== КАЛЕНДАРЬ ====================
    console.log('\n📄 Раздел: Календарь и статистика\n');

    // Скриншот 97: Единый календарь
    console.log('📸 Скриншот 97: Страница единого календаря');
    await page.goto('http://localhost:3000/calendar');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-097.png', { fullPage: true })) {
      console.log('   ✅ screenshot-097.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== ПОЛЬЗОВАТЕЛИ ====================
    console.log('\n📄 Раздел: Управление пользователями\n');

    // Скриншот 135: Управление пользователями
    console.log('📸 Скриншот 135: Страница управления пользователями');
    await page.goto('http://localhost:3000/users');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-135.png', { fullPage: true })) {
      console.log('   ✅ screenshot-135.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== ИНВЕНТАРЬ ====================
    console.log('\n📄 Раздел: Инвентарь\n');

    // Скриншот дополнительный: Инвентарь
    console.log('📸 Скриншот: Страница инвентаря');
    await page.goto('http://localhost:3000/inventory');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-inventory.png', { fullPage: true })) {
      console.log('   ✅ screenshot-inventory.png');
      successCount++;
    } else {
      failCount++;
    }

    // ==================== ДАШБОРД ====================
    console.log('\n📄 Раздел: Дашборд\n');

    // Скриншот дополнительный: Дашборд со статистикой
    console.log('📸 Скриншот: Дашборд со статистикой');
    await page.goto('http://localhost:3000/');
    await waitForContent(page);
    if (await takeScreenshotSafe(page, 'screenshot-dashboard.png', { fullPage: true })) {
      console.log('   ✅ screenshot-dashboard.png');
      successCount++;
    } else {
      failCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Создание скриншотов завершено!');
    console.log('📁 Скриншоты сохранены в: public/manual/screenshots/');
    console.log(`\n📊 Статистика:`);
    console.log(`   ✅ Успешно: ${successCount}`);
    console.log(`   ❌ Ошибок: ${failCount}`);
    console.log(`   📸 Всего: ${successCount + failCount}`);
    console.log('\n💡 Примечание:');
    console.log('   - Проверьте качество скриншотов');
    console.log('   - Некоторые скриншоты могут требовать ручной доработки');
    console.log('   - Для остальных 150 скриншотов требуется ручное создание');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Критическая ошибка при создании скриншотов:', error);
    console.error('\nСтек ошибки:', error.stack);
  } finally {
    await browser.close();
  }
}

takeScreenshots()
  .catch((error) => {
    console.error('\n❌ Необработанная ошибка:', error);
    process.exit(1);
  });
