import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTelegram() {
  try {
    console.log('🔍 Проверка настроек Telegram...\n');

    // Проверяем переменные окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

    console.log('📋 Переменные окружения:');
    console.log(`  TELEGRAM_BOT_TOKEN: ${botToken ? '✅ установлен' : '❌ НЕ УСТАНОВЛЕН'}`);
    console.log(`  TELEGRAM_BOT_USERNAME: ${botUsername || '❌ НЕ УСТАНОВЛЕН'}`);
    console.log(`  TELEGRAM_WEBHOOK_URL: ${webhookUrl || '❌ НЕ УСТАНОВЛЕН'}`);

    if (!botToken) {
      console.log('\n❌ TELEGRAM_BOT_TOKEN не установлен!');
      console.log('Добавьте в .env файл:');
      console.log('TELEGRAM_BOT_TOKEN=your_bot_token_here');
      return;
    }

    // Проверяем информацию о боте
    console.log('\n🤖 Проверка бота...');
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botInfoResponse.json();

    if (botInfo.ok) {
      console.log('✅ Бот найден:', {
        username: botInfo.result.username,
        first_name: botInfo.result.first_name,
        id: botInfo.result.id
      });
    } else {
      console.log('❌ Ошибка получения информации о боте:', botInfo.description);
      return;
    }

    // Проверяем webhook
    console.log('\n🔗 Проверка webhook...');
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json();

    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      console.log('Webhook URL:', info.url || '❌ не установлен');
      console.log('Pending updates:', info.pending_update_count);
      console.log('Last error:', info.last_error_message || 'нет ошибок');
      console.log('Last error date:', info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString('ru-RU') : 'нет');

      if (!info.url) {
        console.log('\n⚠️ Webhook не установлен!');
        if (webhookUrl) {
          console.log(`\nУстановите webhook командой:`);
          console.log(`curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" -d "url=${webhookUrl}"`);
        } else {
          console.log('\nДобавьте TELEGRAM_WEBHOOK_URL в .env файл');
        }
      }
    }

    // Проверяем коды привязки в базе
    console.log('\n🔑 Проверка кодов привязки...');
    const bindingCodes = await prisma.telegramBindingCode.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (bindingCodes.length === 0) {
      console.log('  Нет активных кодов привязки');
    } else {
      console.log(`  Найдено кодов: ${bindingCodes.length}`);
      bindingCodes.forEach(code => {
        const isExpired = new Date() > code.expiresAt;
        console.log(`  - ${code.code} | ${code.user.email} | ${isExpired ? '⏰ истек' : '✅ активен'} | до ${code.expiresAt.toLocaleString('ru-RU')}`);
      });
    }

    // Проверяем привязанных пользователей
    console.log('\n👥 Привязанные пользователи:');
    const boundUsers = await prisma.user.findMany({
      where: {
        telegramId: { not: null }
      },
      select: {
        email: true,
        name: true,
        telegramId: true,
        telegramUsername: true
      }
    });

    if (boundUsers.length === 0) {
      console.log('  Нет привязанных пользователей');
    } else {
      boundUsers.forEach(user => {
        console.log(`  - ${user.email} | @${user.telegramUsername || 'нет username'} | ID: ${user.telegramId}`);
      });
    }

    console.log('\n✅ Проверка завершена');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTelegram();
