'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Compass, Wand2, BookOpen, Users, Coins, Bell, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useTranslation } from '../../context/LanguageContext';

export const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 px-4 lg:px-8 py-3 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-200 dark:shadow-none group-hover:scale-105 transition-transform">
            <BookOpen className="w-5.5 h-5.5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-rose-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:to-teal-300 bg-clip-text text-transparent">
                MagicTales
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-wider text-rose-500 dark:text-amber-400 uppercase -mt-1">
              AI STORYBOOK
            </span>
          </div>
        </Link>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container p-1.5 rounded-full border border-outline-variant/30">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs shadow-xs transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('footer.home')}</span>
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-all hover:bg-surface-container-lowest"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('categories.all')}</span>
          </Link>
          <Link
            href="/create"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-all hover:bg-surface-container-lowest"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('header.createStory')}</span>
          </Link>
          <Link
            href="/library"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-all hover:bg-surface-container-lowest"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('header.library')}</span>
          </Link>
          <Link
            href="/parents"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-semibold text-xs transition-all hover:bg-surface-container-lowest"
          >
            <Users className="w-3.5 h-3.5 text-sky-500" />
            <span>{t('header.parentCorner')}</span>
          </Link>
        </nav>

        {/* Right Actions: Coins, LanguageToggle, ThemeToggle, Notifications, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Coin Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-container/30 border border-secondary-container/60 rounded-full text-on-secondary-container dark:text-amber-300 font-bold text-xs shadow-2xs cursor-pointer hover:bg-secondary-container/50 transition-colors">
            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
            <span>{t('header.coins')}</span>
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"></span>
          </button>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 dark:from-amber-400 dark:to-teal-400 p-0.5 shadow-2xs">
              <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface">
                🐻
              </div>
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-on-surface leading-tight">{t('header.userAccount')}</span>
              <span className="text-[10px] text-on-surface-variant font-medium opacity-80">{t('header.accountType')}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant opacity-70" />
          </div>
        </div>
      </div>
    </header>
  );
};
