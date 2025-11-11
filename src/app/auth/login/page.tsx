'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Токен теперь автоматически сохраняется в cookie на сервере
        console.log('✅ Успешный вход:', data.user.name, 'Роль:', data.user.role);
        
        // Редирект в зависимости от роли
        if (data.user.role === 'MANAGER' || data.user.role === 'SENIOR_MANAGER') {
          router.push('/objects'); // Менеджеры и старшие менеджеры → Объекты
        } else if (data.user.role === 'ACCOUNTANT') {
          router.push('/inventory'); // Бухгалтер → Инвентарь
        } else {
          router.push('/'); // Админ, зам админа и зам → Дашборд
        }
        router.refresh(); // Обновляем страницу для применения аутентификации
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Ошибка входа');
      }
    } catch (error) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  const testUsers = [
    { email: 'admin@example.com', password: 'password123', label: 'Администратор', color: 'bg-purple-500 hover:bg-purple-600' },
    { email: 'deputy@example.com', password: 'password123', label: 'Зам. администратора', color: 'bg-indigo-500 hover:bg-indigo-600' },
    { email: 'accountant@example.com', password: 'password123', label: 'Бухгалтер', color: 'bg-green-500 hover:bg-green-600' },
    { email: 'manager1@example.com', password: 'password123', label: 'Менеджер 1', color: 'bg-blue-500 hover:bg-blue-600' },
    { email: 'manager2@example.com', password: 'password123', label: 'Менеджер 2', color: 'bg-blue-500 hover:bg-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            🧹 Клининг-Контроль
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Кнопки быстрого входа */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3 text-center">Быстрый вход:</p>
            <div className="grid grid-cols-2 gap-2">
              {testUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => quickLogin(user.email, user.password)}
                  className={`px-3 py-2 text-white text-sm rounded transition-colors ${user.color}`}
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или введите данные</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
