'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TelegramLogin } from './TelegramLogin';
import { Badge } from './Badge';

interface AuthPanelProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onRegister?: (credentials: { email: string; password: string; name: string }) => void;
 onSocialLogin?: (provider: 'telegram' | 'google' | 'facebook') => void;
  mode?: 'login' | 'register';
  title?: string;
  description?: string;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  onLogin,
  onRegister,
  onSocialLogin,
  mode = 'login',
  title = mode === 'login' ? 'Вход в аккаунт' : 'Регистрация',
  description = mode === 'login' ? 'Введите свои данные для входа' : 'Создайте новый аккаунт'
}) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(mode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (currentMode === 'login') {
        if (onLogin) {
          await onLogin({
            email: formData.email,
            password: formData.password
          });
        }
      } else {
        if (onRegister) {
          await onRegister({
            email: formData.email,
            password: formData.password,
            name: formData.name
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при аутентификации');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setCurrentMode(currentMode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentMode === 'register' && (
            <div>
              <Input
                type="text"
                name="name"
                placeholder="Ваше имя"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <Input
              type="email"
              name="email"
              placeholder="Электронная почта"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Input
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {currentMode === 'login' && (
            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Забыли пароль?
              </a>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {currentMode === 'login' ? 'Вход...' : 'Регистрация...'}
              </div>
            ) : (
              currentMode === 'login' ? 'Войти' : 'Зарегистрироваться'
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <TelegramLogin 
              onLogin={() => onSocialLogin?.('telegram')}
              disabled={loading}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {currentMode === 'login' 
                  ? 'Нет аккаунта?' 
                  : 'Уже есть аккаунт?'}
              </div>
              <Button
                type="button"
                variant="link"
                onClick={switchMode}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {currentMode === 'login' ? 'Регистрация' : 'Вход'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export { AuthPanel };