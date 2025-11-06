'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TelegramSetupPage() {
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkWebhook();
  }, []);

  const checkWebhook = async () => {
    try {
      const response = await fetch('/api/setup-webhook');
      const data = await response.json();
      
      if (data.success) {
        setWebhookInfo(data.webhookInfo.result);
      } else {
        setError(data.error || 'Ошибка проверки webhook');
      }
    } catch (err) {
      setError('Ошибка соединения');
    }
  };

  const setupWebhook = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const appUrl = window.location.origin;
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || prompt('Введите токен бота:');

      if (!botToken) {
        setError('Токен бота не указан');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, appUrl })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Webhook установлен успешно!\n\nURL: ${data.webhookUrl}`);
        await checkWebhook();
      } else {
        setError(data.error || 'Ошибка установки webhook');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || prompt('Введите токен бота:');

      if (!botToken) {
        setError('Токен бота не указан');
        setLoading(false);
        return;
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      const data = await response.json();

      if (data.ok) {
        setMessage('✅ Webhook удален успешно!');
        await checkWebhook();
      } else {
        setError('Ошибка удаления webhook');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🤖 Настройка Telegram Бота</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Текущий статус */}
            <div>
              <h3 className="font-semibold mb-2">Текущий статус webhook:</h3>
              {webhookInfo ? (
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div>
                    <span className="font-medium">URL:</span>{' '}
                    <span className={webhookInfo.url ? 'text-green-600' : 'text-red-600'}>
                      {webhookInfo.url || 'Не установлен'}
                    </span>
                  </div>
                  {webhookInfo.url && (
                    <>
                      <div>
                        <span className="font-medium">Последнее обновление:</span>{' '}
                        {new Date(webhookInfo.last_error_date * 1000).toLocaleString('ru-RU')}
                      </div>
                      {webhookInfo.last_error_message && (
                        <div>
                          <span className="font-medium text-red-600">Последняя ошибка:</span>{' '}
                          <span className="text-red-600">{webhookInfo.last_error_message}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Ожидающих обновлений:</span>{' '}
                        {webhookInfo.pending_update_count || 0}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Загрузка...</div>
              )}
            </div>

            {/* Сообщения */}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md whitespace-pre-line">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                {error}
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-4">
              <Button onClick={setupWebhook} disabled={loading}>
                {loading ? 'Настройка...' : '🔧 Установить Webhook'}
              </Button>
              
              <Button onClick={deleteWebhook} variant="outline" disabled={loading}>
                🗑️ Удалить Webhook
              </Button>
              
              <Button onClick={checkWebhook} variant="outline" disabled={loading}>
                🔄 Обновить статус
              </Button>
            </div>

            {/* Инструкция */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">📖 Инструкция:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Убедитесь что переменная <code className="bg-gray-100 px-1">TELEGRAM_BOT_TOKEN</code> установлена в <code className="bg-gray-100 px-1">.env</code></li>
                <li>Нажмите кнопку "Установить Webhook"</li>
                <li>Webhook будет автоматически настроен на текущий URL приложения</li>
                <li>Проверьте статус - URL должен быть установлен</li>
                <li>Откройте бота в Telegram и отправьте команду <code className="bg-gray-100 px-1">/start</code></li>
              </ol>
            </div>

            {/* Тестирование */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">🧪 Тестирование:</h3>
              <div className="bg-blue-50 p-4 rounded-md space-y-2 text-sm">
                <p>После установки webhook:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Найдите вашего бота в Telegram</li>
                  <li>Отправьте команду <code className="bg-white px-1">/start</code></li>
                  <li>Бот должен ответить приветственным сообщением</li>
                  <li>Если бот не отвечает - проверьте логи сервера</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
