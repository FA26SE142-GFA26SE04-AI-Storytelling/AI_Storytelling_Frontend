'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Play, ShieldCheck, Mic, ThumbsUp, ChevronRight, Wand2, Star, Headphones } from 'lucide-react';
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
      
      {/* Decorative Animated Floating Orbs */}
      <div
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-float-blob-1 opacity-40 dark:opacity-30"
        style={{ background: 'var(--badge-gradient-1)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-float-blob-2 opacity-40 dark:opacity-30"
        style={{ background: 'var(--badge-gradient-2)' }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-pulse opacity-35 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-3)' }}
      />

      {/* Magical Twinkling Stardust Particles */}
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
            <div className="self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/80 backdrop-blur-md text-emerald-800 dark:text-emerald-300 border border-emerald-400/50 dark:border-emerald-700/60 text-xs font-extrabold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
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
                          ? 'bg-secondary-container text-on-secondary-container border-secondary-container shadow-xs font-bold scale-105'
                          : 'bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md hover:bg-surface-container-lowest text-on-surface border-outline-variant/40'
                      }`}
                    >
                      {prompt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <Link href="/create" className="relative group">
                <div className="radiant-glow-aura" />
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Wand2 className="w-5 h-5 animate-pulse" />}
                  className="w-full sm:w-auto font-black text-sm sm:text-base py-3.5 px-7 shadow-lg shadow-rose-500/25 relative z-10"
                >
                  {t('hero.btnCreate')}
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                icon={<Play className="w-4 h-4 fill-current text-amber-500" />}
                className="w-full sm:w-auto font-bold text-xs sm:text-sm py-3 px-5 bg-surface-container-lowest/90 dark:bg-[#172038]/90 backdrop-blur-md"
              >
                {t('hero.btnListenSample')}
              </Button>
            </div>

            {/* Trust Badges Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-outline-variant/30 text-xs font-semibold text-on-surface-variant opacity-90">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <ShieldCheck className="w-4 h-4" />
                {t('hero.badges.safe')}
              </span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-amber-500" />
                {t('hero.badges.voice')}
              </span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-sky-500" />
                {t('hero.badges.trusted')}
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Story Preview Card with Blur Backdrop */}
          <div className="lg:col-span-5 relative group">
            {/* Glowing Blur Backdrop Layer */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-rose-500/30 via-amber-400/25 to-teal-400/25 blur-2xl opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none animate-pulse" />

            <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-outline-variant/40 shadow-xl space-y-4 overflow-hidden">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {t('hero.cardPreview.studioBadge')}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container dark:text-amber-300">
                  {t('hero.cardPreview.livePreview')}
                </span>
              </div>

              {/* Story Title */}
              <h3 className="font-extrabold text-base sm:text-lg text-on-surface line-clamp-1">
                {t('hero.cardPreview.storyTitle')}
              </h3>

              {/* Preview Artwork */}
              <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop"
                  alt="Story art"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="450px"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-amber-300" />
                  <span>{t('hero.cardPreview.audioBadge')}</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6">
                  <p className="text-white text-xs leading-relaxed italic line-clamp-2">
                    {t('hero.cardPreview.storyExcerpt')}
                  </p>
                </div>
              </div>

              {/* Branching choices */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-extrabold text-on-surface-variant opacity-80 block">
                  Lựa chọn của bé ở trang tiếp theo:
                </span>
                <button
                  onClick={() => setSelectedChoice(1)}
                  className={`w-full p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selectedChoice === 1
                      ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-300'
                      : 'bg-surface-container/50 border-outline-variant/30 text-on-surface opacity-80'
                  }`}
                >
                  <span className="line-clamp-1">Nhánh 1: Dino gặp bạn rồng biết bay...</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  onClick={() => setSelectedChoice(2)}
                  className={`w-full p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    selectedChoice === 2
                      ? 'bg-tertiary-container/15 border-tertiary-container text-emerald-600 dark:text-teal-300'
                      : 'bg-surface-container/50 border-outline-variant/30 text-on-surface opacity-80'
                  }`}
                >
                  <span className="line-clamp-1">Nhánh 2: Dino chui vào hang núi lửa cầu vồng...</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
