'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Compass, Wand2, BookOpen, Users, Coins, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useTranslation } from '../../context/LanguageContext';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  const navItems = [
    { href: '/', label: t('footer.home'), icon: Home },
    { href: '/explore', label: t('categories.all'), icon: Compass },
    { href: '/create', label: t('header.createStory'), icon: Wand2, iconColor: 'text-amber-500' },
    { href: '/library', label: t('header.library'), icon: BookOpen },
    { href: '/parents', label: t('header.parentCorner'), icon: Users, iconColor: 'text-sky-500' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 px-3 sm:px-6 lg:px-8 py-3 shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-200 dark:shadow-none group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-rose-600 via-amber-500 to-amber-400 dark:from-amber-300 dark:to-teal-300 bg-clip-text text-transparent">
                MagicTales
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-rose-500 dark:text-amber-400 uppercase -mt-1">
              AI STORYBOOK
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container p-1.5 rounded-full border border-outline-variant/30">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full font-bold text-xs transition-colors duration-200 ${
                  active
                    ? 'text-on-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest/50'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-primary-container rounded-full shadow-xs -z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`relative z-10 w-3.5 h-3.5 ${!active && item.iconColor ? item.iconColor : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Coins, LanguageToggle, ThemeToggle, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Coin Badge */}
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-secondary-container/30 border border-secondary-container/60 rounded-full text-on-secondary-container dark:text-amber-300 font-bold text-[11px] sm:text-xs shadow-2xs cursor-pointer hover:bg-secondary-container/50 transition-colors">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
            <span>{t('header.coins')}</span>
          </div>

          {/* Language Switcher */}
          <LanguageToggle />

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="hidden sm:flex relative p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"></span>
          </button>

          {/* Auth Action Buttons: Sign In & Sign Up (Hidden on mobile, available in Mobile Menu) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-outline-variant/30">
            <Link
              href="/signin"
              className="px-3 py-1.5 rounded-full text-xs font-bold text-on-surface hover:text-primary-container border border-outline-variant/40 hover:border-primary-container/60 transition-all cursor-pointer whitespace-nowrap"
            >
              Đăng nhập
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary-container hover:brightness-105 text-on-primary-container shadow-2xs hover:scale-102 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Đăng ký
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl bg-surface-container/80 text-on-surface hover:bg-surface-container active:scale-95 transition-all cursor-pointer ml-1"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-outline-variant/30 flex flex-col gap-2 bg-surface-container-lowest/95 dark:bg-[#0F1626]/95 rounded-2xl p-4 shadow-xl transition-all duration-300">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary-container shadow-xs'
                    : 'text-on-surface hover:bg-surface-container font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 ${!active && item.iconColor ? item.iconColor : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile Auth Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-outline-variant/30">
            <Link
              href="/signin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl border border-outline-variant/40 text-center font-bold text-xs text-on-surface hover:bg-surface-container transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl bg-primary-container text-on-primary-container text-center font-bold text-xs shadow-xs hover:brightness-105 transition-all"
            >
              Đăng ký
            </Link>
          </div>

          {/* Mobile Coins Badge inside Drawer */}
          <div className="pt-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="text-xs font-bold text-on-surface">{t('header.coins')}</span>
            </div>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-300">120 Xu</span>
          </div>
        </div>
      )}
    </header>
  );
};



