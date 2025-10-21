'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { authApi } from '@/lib/api/auth';
import useAppStore from '@/store/useAppStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Загружаем информацию о пользователе при монтировании компонента
 useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authApi.getCurrentUser();
        
        if (currentUser) {
          // Обновляем пользователя в store с информацией из базы данных
          const profileResponse = await authApi.getProfile(currentUser.id);
          if (!profileResponse.error && profileResponse.data) {
            const profileData = profileResponse.data;
            setUser({
              id: Number(currentUser.id),
              first_name: profileData.first_name || currentUser.user_metadata?.first_name,
              last_name: profileData.last_name || currentUser.user_metadata?.last_name,
              username: profileData.username || currentUser.user_metadata?.username,
              photo_url: profileData.avatar_url || currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.avatar_url,
              phone_number: profileData.phone_number || currentUser.phone_number
            });
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError('Failed to load user information');
      } finally {
        setLoading(false);
      }
    };

    // Проверяем, нужно ли загружать пользователя
    if (!user) {
      fetchCurrentUser();
    }
  }, [user, setUser]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authApi.logout();
      
      if (result.error) {
        setError(result.error.message);
      } else {
        // Очищаем пользователя из store
        setUser(null);
      }
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // В будущем можно добавить модальное окно для входа
    console.log('Login clicked');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="text-2xl font-bold text-center flex-1">
          Good Vibe
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : user ? (
            <DropdownMenu
              trigger={
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <Avatar
                      src={user.photo_url || undefined}
                      alt={user.first_name || 'User'}
                      size="md"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name || user.username || 'User'}
                    </div>
                  </div>
                </div>
              }
            >
              <DropdownMenuItem onClick={() => console.log('Profile clicked')}>
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Settings clicked')}>
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50"
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenu>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleLogin}
            >
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
