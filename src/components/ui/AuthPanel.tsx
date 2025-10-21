'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TelegramLogin } from './TelegramLogin';
import { Badge } from './Badge';
import { authApi } from '@/lib/api/auth';

interface AuthPanelProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
 onRegister?: (credentials: { email: string; password: string; name: string }) => void;
 onSocialLogin?: (provider: 'telegram' | 'google' | 'facebook') => void;
 onProfileUpdate?: (profileData: { username?: string; first_name?: string; last_name?: string; bio?: string; avatar_url?: string }) => void;
 mode?: 'login' | 'register' | 'profile';
  title?: string;
  description?: string;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  onLogin,
  onRegister,
  onSocialLogin,
  onProfileUpdate,
  mode = 'login',
  title = mode === 'login' ? 'Вход в аккаунт' : mode === 'register' ? 'Регистрация' : 'Обновление профиля',
  description = mode === 'login' ? 'Введите свои данные для входа' : mode === 'register' ? 'Создайте новый аккаунт' : 'Обновите информацию вашего профиля'
}) => {
 const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'profile'>(mode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    avatar_url: ''
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
        const result = await authApi.login({
          email: formData.email,
          password: formData.password
        });
        
        if (result.error) {
          throw result.error;
        }
        
        // Вызываем onLogin callback, если он предоставлен
        if (onLogin) {
          await onLogin({
            email: formData.email,
            password: formData.password
          });
        }
      } else if (currentMode === 'register') {
        const result = await authApi.register({
          email: formData.email,
          password: formData.password,
          username: formData.name // используем name как username
        });
        
        if (result.error) {
          throw result.error;
        }
        
        // Вызываем onRegister callback, если он предоставлен
        if (onRegister) {
          await onRegister({
            email: formData.email,
            password: formData.password,
            name: formData.name
          });
        }
      } else if (currentMode === 'profile') {
        // Обновляем профиль
        await handleProfileUpdate();
      }
    } catch (err) {
      // Более информативная обработка ошибок
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Произошла ошибка при обработке запроса');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    if (currentMode === 'login') {
      setCurrentMode('register');
    } else if (currentMode === 'register') {
      setCurrentMode('login');
    }
    // Режим профиля не переключается через эту функцию
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Используем прямой вызов Supabase для OAuth с Google
      const { error } = await authApi.getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin // или ваш redirect URL
        }
      });
      
      if (error) {
        throw error;
      }
      
      // onSocialLogin callback будет вызван после успешного возврата из OAuth
      if (onSocialLogin) {
        onSocialLogin('google');
      }
    } catch (err) {
      // Более информативная обработка ошибок
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Произошла ошибка при входе через Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async () => {
    // Для Telegram авторизации нужно использовать специальный подход
    // В идеале, для Telegram авторизации нужен backend endpoint
    // который будет проверять подпись, полученную от Telegram
    setLoading(true);
    setError(null);
    
    try {
      // В реальном приложении здесь нужно будет получить данные от Telegram
      // и передать их в authApi.loginWithTelegram
      // Например: const telegramData = await getTelegramAuthData();
      // const result = await authApi.loginWithTelegram(telegramData);
      
      // Пока что просто вызываем onSocialLogin
      // В дальнейшем можно использовать метод loginWithTelegram из authApi
      // когда будет реализована интеграция с Telegram Login Widget
      if (onSocialLogin) {
        onSocialLogin('telegram');
      }
    } catch (err) {
      // Более информативная обработка ошибок
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Произошла ошибка при входе через Telegram');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Пожалуйста, введите email для восстановления пароля');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await authApi.forgotPassword(formData.email);
      
      if (result.error) {
        throw result.error;
      }
      
      // Показываем сообщение пользователю о том, что письмо отправлено
      alert('На ваш email отправлено письмо с инструкциями по восстановлению пароля');
    } catch (err) {
      // Более информативная обработка ошибок
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Произошла ошибка при восстановлении пароля');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const profileData = {
        username: formData.username || undefined,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        bio: formData.bio || undefined,
        avatar_url: formData.avatar_url || undefined
      };
      
      const result = await authApi.updateProfile(profileData);
      
      if (result.error) {
        throw result.error;
      }
      
      // Вызываем callback, если он предоставлен
      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }
      
      // Показываем сообщение об успешном обновлении
      alert('Профиль успешно обновлен');
    } catch (err) {
      // Более информативная обработка ошибок
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Произошла ошибка при обновлении профиля');
      }
    } finally {
      setLoading(false);
    }
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
          {currentMode === 'profile' ? (
            // Поля для обновления профиля
            <>
              <div>
                <Input
                  type="text"
                  name="username"
                  placeholder="Имя пользователя"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="text"
                  name="first_name"
                  placeholder="Имя"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="text"
                  name="last_name"
                  placeholder="Фамилия"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="text"
                  name="bio"
                  placeholder="О себе"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="text"
                  name="avatar_url"
                  placeholder="Ссылка на аватар"
                  value={formData.avatar_url}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            // Поля для входа/регистрации
            <>
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
                  <button
                    type="button"
                    className="text-sm text-blue-60 hover:underline"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {currentMode === 'login' ? 'Вход...' : currentMode === 'register' ? 'Регистрация...' : 'Сохранение...'}
              </div>
            ) : (
              currentMode === 'login' ? 'Войти' : currentMode === 'register' ? 'Зарегистрироваться' : 'Сохранить профиль'
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
              onLogin={handleTelegramLogin}
              disabled={loading}
            />
            
            {/* Кнопка для входа через Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3"
              onClick={() => onSocialLogin?.('google')}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.64 12 18.64C9.14 18.64 6.71 16.69 5.84 14.09H2.18V16.96C4 20.53 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.04H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.96L5.84 14.09Z" fill="#FBBC05"/>
                <path d="M12 5.36C13.62 5.36 15.06 5.93 16.21 7.04L19.34 3.9C17.45 2.13 14.97 1 12 1C7.7 1 4 3.47 2.18 7.04L5.84 9.91C6.71 7.31 9.14 5.36 12 5.36Z" fill="#EA4335"/>
              </svg>
              <span>Войти через Google</span>
            </Button>
            
            {currentMode !== 'profile' && (
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
                  className="text-sm text-blue-60 hover:text-blue-800"
                >
                  {currentMode === 'login' ? 'Регистрация' : 'Вход'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export { AuthPanel };