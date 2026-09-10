'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { ChevronDown, Check, Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container/60 hover:bg-surface-container-high text-on-surface text-xs font-bold border border-outline-variant/40 shadow-2xs transition-all cursor-pointer"
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLanguageOption.flag}</span>
        <span className="uppercase tracking-wider font-extrabold text-[11px]">
          {currentLanguageOption.code}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-surface-container-lowest/95 dark:bg-[#172038]/95 backdrop-blur-md border border-outline-variant/50 dark:border-[#283556] shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant/70 border-b border-outline-variant/30 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Ngôn ngữ / Language</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {supportedLanguages.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container/15 text-primary-container font-bold'
                      : 'text-on-surface hover:bg-surface-container/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.flag}</span>
                    <span>{item.nativeName}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-container" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
