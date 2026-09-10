'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Play, ShieldCheck, Mic, ThumbsUp, ChevronRight, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../context/LanguageContext';

export const HeroBanner: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [selectedChoice, setSelectedChoice] = useState<number>(1);

  const quickPrompts = [
    { label: t('hero.prompts.dino'), text: t('hero.prompts.dino') },
    { label: t('hero.prompts.cat'), text: t('hero.prompts.cat') },
    { label: t('hero.prompts.princess'), text: t('hero.prompts.princess') },
  ];

  return (
    <section className="relative w-full hero-animated-bg border-b border-outline-variant/30 dark:border-[#283556] shadow-sm overflow-hidden mb-8 md:mb-12 transition-colors duration-300">
      {/* Decorative Animated Floating Orbs mapped to --badge-gradient-1, 2, 3 */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-float-blob-1 opacity-35 dark:opacity-30"
        style={{ background: 'var(--badge-gradient-1)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-float-blob-2 opacity-35 dark:opacity-30"
        style={{ background: 'var(--badge-gradient-2)' }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-pulse opacity-30 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-3)' }}
      />

      {/* Magical Twinkling Stardust Particles mapped to --badge-gradient-1, 2, 3 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-8 left-[12%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute top-1/2 left-[45%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-2)' }}>
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
        <div className="absolute bottom-12 left-[20%] animate-twinkle-3 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute top-12 right-[18%] animate-twinkle-2 drop-shadow-xs" style={{ color: 'var(--badge-gradient-1)' }}>
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <div className="absolute bottom-8 right-[32%] animate-twinkle-1 drop-shadow-xs" style={{ color: 'var(--badge-gradient-3)' }}>
          <Sparkles className="w-4 h-4 fill-current" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left Column: Headline & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
          {/* Top Announcement Pill */}
          <div className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-container/20 text-on-tertiary-container dark:text-emerald-300 text-xs font-bold border border-tertiary-container/30 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
            <span>{t('hero.announcement')}</span>
          </div>

          {/* Main Title */}
          <h1 className="heading-hero">
            {t('hero.titleMain')}{' '}
            <span className="text-primary-container inline-block relative font-black">
              {t('hero.titleHighlight')}
              <svg className="absolute left-0 -bottom-1 w-full h-3 text-secondary-container" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" />
              </svg>
            </span>{' '}
            {t('hero.titleEnd')}
          </h1>

          {/* Subtitle */}
          <p className="text-subtitle max-w-xl">
            {t('hero.subtitle')}
          </p>

          {/* Quick Prompts Selection */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="badge-eyebrow-label text-on-surface-variant flex items-center gap-1 opacity-80">
              {t('hero.promptPromptLabel')}
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => {
                const animClass = idx % 3 === 0 ? 'animate-float-subtle-1' : idx % 3 === 1 ? 'animate-float-subtle-2' : 'animate-float-subtle-3';
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedPrompt(prompt.text)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${animClass} ${
                      selectedPrompt === prompt.text
                        ? 'bg-secondary-container text-on-secondary-container border-secondary-container shadow-xs font-bold'
                        : 'bg-surface-container-lowest/80 dark:bg-[#172038] hover:bg-surface-container-lowest text-on-surface border-outline-variant/40'
                    }`}
                  >
                    {prompt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA Buttons - Full width on mobile for easy tap */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<Sparkles className="w-5 h-5 text-secondary-container fill-current" />}
              className="animate-float-subtle-1 hover:scale-102 w-full sm:w-auto justify-center"
            >
              {t('hero.btnCreate')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={<Play className="w-4 h-4 fill-current" />}
              className="animate-float-subtle-2 hover:scale-102 w-full sm:w-auto justify-center"
            >
              {t('hero.btnListenSample')}
            </Button>
          </div>

          {/* Trust Badges (Responsive Pill for Mobile & Desktop) */}
          <div
            className="badge-gradient-pill mt-2 py-2 px-3 sm:py-2.5 sm:px-4 rounded-2xl sm:rounded-full text-white shadow-md shadow-rose-500/20 dark:shadow-black/40 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between gap-2 sm:gap-2 text-[11px] sm:text-xs font-bold"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-white shrink-0 drop-shadow-xs" />
              <span className="drop-shadow-xs">{t('hero.badges.safe')}</span>
            </div>
            <span className="hidden sm:inline opacity-60 text-white shrink-0">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Mic className="w-4 h-4 text-white shrink-0 drop-shadow-xs" />
              <span className="drop-shadow-xs">{t('hero.badges.voice')}</span>
            </div>
            <span className="hidden sm:inline opacity-60 text-white shrink-0">•</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <ThumbsUp className="w-4 h-4 text-white shrink-0 drop-shadow-xs" />
              <span className="drop-shadow-xs">{t('hero.badges.trusted')}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Story Card Preview with Ambient Radiant Glow */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-md group">
            {/* Outer Radiant Glow Aura (Tỏa sáng xung quanh) */}
            <div className="radiant-glow-aura" />

            {/* Inner Content Card */}
            <div className="relative w-full bg-surface-container-lowest dark:bg-[#0F1626] rounded-3xl p-4 shadow-2xl border border-outline-variant/50 dark:border-[#283556] flex flex-col gap-3">
            {/* Top Studio Bar */}
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-secondary-container/30 text-on-secondary-container">
                  <Wand2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-extrabold tracking-tight text-on-surface">
                  XƯỞNG SÁNG TẠO AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-on-surface-variant opacity-70">Tập 01 - Đang tạo</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                  Cổ tích sống động
                </span>
              </div>
            </div>

            {/* Story Book Cover Preview */}
            <div className="relative w-full h-52 rounded-2xl overflow-hidden shadow-inner group">
              <Image
                src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop"
                alt="Lâu Đài Kẹo Ngọt Trên Mây"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Floating Play Button */}
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              </button>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="font-black text-base sm:text-lg leading-tight drop-shadow-sm">
                  Lâu Đài Kẹo Ngọt Trên Mây
                </h4>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  Ý tưởng bởi Bé An (6 tuổi) & Chị Thu Thông Thái
                </p>
              </div>
            </div>

            {/* Interactive Decision Box */}
            <div className="bg-secondary-container/20 border border-secondary-container/40 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                <span>LỰA CHỌN TIẾP THEO:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold">
                  Bước 2 / 4
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedChoice(1)}
                  className={`p-2.5 rounded-xl text-xs text-left font-semibold border transition-all flex items-center justify-between cursor-pointer ${selectedChoice === 1
                      ? 'bg-secondary-container text-on-secondary-container border-secondary-container font-bold shadow-xs'
                      : 'bg-surface-container-lowest dark:bg-[#172038] border-outline-variant/30 text-on-surface hover:border-secondary-container'
                    }`}
                >
                  <span>1. Bay trên cầu vồng - Tìm quả cầu thần</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-current" />
                </button>
                <button
                  onClick={() => setSelectedChoice(2)}
                  className={`p-2.5 rounded-xl text-xs text-left font-semibold border transition-all flex items-center justify-between cursor-pointer ${selectedChoice === 2
                      ? 'bg-secondary-container text-on-secondary-container border-secondary-container font-bold shadow-xs'
                      : 'bg-surface-container-lowest dark:bg-[#172038] border-outline-variant/30 text-on-surface hover:border-secondary-container'
                    }`}
                >
                  <span>2. Gặp Vua Sóc bông - Xin phép qua rừng</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  );
};
