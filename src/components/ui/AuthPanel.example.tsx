import React from 'react';
import { AuthPanel } from './AuthPanel';

// Пример использования компонента AuthPanel
const AuthPanelExample: React.FC = () => {
  const handleLogin = (credentials: { email: string; password: string }) => {
    console.log('Вход с credentials:', credentials);
    // Здесь будет вызов вашей функции входа
  };

 const handleRegister = (credentials: { email: string; password: string; name: string }) => {
    console.log('Регистрация с credentials:', credentials);
    // Здесь будет вызов вашей функции регистрации
  };

  const handleSocialLogin = (provider: 'telegram' | 'google' | 'facebook') => {
    console.log('Социальный вход через:', provider);
    // Здесь будет вызов вашей функции социального входа
  };

  const handleProfileUpdate = (profileData: { username?: string; first_name?: string; last_name?: string; bio?: string; avatar_url?: string }) => {
    console.log('Обновление профиля:', profileData);
    // Здесь будет вызов вашей функции обновления профиля
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">Тестирование AuthPanel</h1>
        
        {/* Режим входа */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Режим входа</h2>
          <AuthPanel 
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSocialLogin={handleSocialLogin}
            onProfileUpdate={handleProfileUpdate}
            mode="login"
          />
        </div>
        
        {/* Режим регистрации */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Режим регистрации</h2>
          <AuthPanel 
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSocialLogin={handleSocialLogin}
            onProfileUpdate={handleProfileUpdate}
            mode="register"
          />
        </div>
        
        {/* Режим профиля */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Режим обновления профиля</h2>
          <AuthPanel 
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSocialLogin={handleSocialLogin}
            onProfileUpdate={handleProfileUpdate}
            mode="profile"
          />
        </div>
      </div>
    </div>
  );
};

export default AuthPanelExample;