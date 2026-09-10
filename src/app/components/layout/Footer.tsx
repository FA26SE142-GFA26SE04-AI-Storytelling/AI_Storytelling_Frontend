'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface-container-lowest dark:bg-[#0F1626] border-t border-outline-variant/30 dark:border-[#283556] py-6 px-4 lg:px-8 mt-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        {/* Left Info */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-1.5 font-bold text-on-surface">
            <span className="text-primary-container font-extrabold text-sm">MagicTales</span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container/20 text-on-tertiary-container text-[10px] font-extrabold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-tertiary-container" />
              KID-SAFE AI
            </span>
          </div>
          <span className="hidden sm:inline opacity-30">•</span>
          <p className="text-on-surface-variant opacity-80 text-[11px]">
            {t('footer.copyright')}
          </p>
        </div>

        {/* Right Links */}
        <div className="flex flex-wrap justify-center items-center gap-4 text-[11px] font-medium text-on-surface-variant">
          <Link href="/privacy" className="hover:text-primary-container transition-colors">
            {t('footer.privacy')}
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/parents" className="hover:text-primary-container transition-colors">
            {t('header.parentCorner')}
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/terms" className="hover:text-primary-container transition-colors">
            {t('footer.terms')}
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/support" className="hover:text-primary-container transition-colors">
            {t('footer.contact')}
          </Link>
        </div>
      </div>
    </footer>
  );
};
