'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-7 p-1 rounded-full transition-colors duration-300 cursor-pointer shadow-inner ${
        theme === 'dark'
          ? 'bg-slate-800 border border-slate-700 text-amber-300'
          : 'bg-amber-100 border border-amber-300 text-amber-700'
      }`}
      title={theme === 'dark' ? 'Đang ở Chế độ Ru ngủ / Ban đêm. Click để chuyển Sáng' : 'Đang ở Chế độ Sáng. Click để chuyển Ban đêm'}
      aria-label="Toggle Theme"
    >
      {/* Sliding Knob */}
      <span
        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-xs ${
          theme === 'dark' ? 'translate-x-7 bg-indigo-900 text-amber-300' : 'translate-x-0 bg-white text-amber-500'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
        ) : (
          <Sun className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
        )}
      </span>

      {/* Background Icons */}
      <span className={`text-[10px] font-bold pr-1 select-none ${theme === 'dark' ? 'opacity-100' : 'opacity-40'}`}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
};
