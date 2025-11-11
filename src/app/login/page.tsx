'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Ошибка аутентификации');
      }

      const { token, user } = await res.json();
      // Store token in cookie
      document.cookie = `token=${token}; path=/; max-age=86400;`; // Expires in 1 day

      // Редирект в зависимости от роли
      if (user.role === 'ACCOUNTANT') {
        router.push('/inventory'); // Бухгалтер → Инвентарь
      } else {
        router.push('/'); // Остальные → Дашборд
      }
    } catch (err: any) {
      setError(err.message);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
