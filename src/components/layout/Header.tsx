'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import useAppStore from '@/store/useAppStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAppStore((state) => state.user);

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
          {user ? (
            <div className="flex items-center gap-2">
              {user.photo_url && (
                <Avatar 
                  src={user.photo_url} 
                  alt={user.first_name || 'User'}
                  size="md"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline text-gray-700">
                {user.first_name || 'User'}
              </span>
            </div>
          ) : (
            <Button variant="primary" size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
