import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TelegramLogin } from '../TelegramLogin';

interface AuthPanelProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onRegister?: (credentials: { email: string; password: string }) => void;
 onSocialLogin?: (provider: string) => void;
  mode?: 'login' | 'register';
  onModeChange?: (mode: 'login' | 'register') => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  onLogin,
  onRegister,
  onSocialLogin,
  mode = 'login',
  onModeChange
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'register' && password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    const credentials = { email, password };
    
    if (mode === 'login' && onLogin) {
      onLogin(credentials);
    } else if (mode === 'register' && onRegister) {
      onRegister(credentials);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {mode === 'register' && (
              <Input
                type="password"
                placeholder="Подтверждение пароля"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            )}
            
            <Button type="submit" className="w-full">
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
        
        {onModeChange && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login'
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        )}
        
        {onSocialLogin && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            
            <div className="mt-6 grid grid-cols-1 gap-3">
              <TelegramLogin />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AuthPanel;