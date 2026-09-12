'use client';

import React from 'react';
import { Volume2, Play } from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  subtitle: string;
  avatar: string;
  sampleText: string;
  tag: string;
}

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  setSelectedVoice: (id: string) => void;
  isTestingVoice: string | null;
  handleTestVoice: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  setSelectedVoice,
  isTestingVoice,
  handleTestVoice,
}) => {
  return (
    <div className="relative group">
      {/* Glowing Blur Backdrop Layer */}
      <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-sky-500/20 to-purple-500/20 blur-xl opacity-70 group-hover:opacity-90 transition-opacity pointer-events-none" />

      <div className="relative bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/40 shadow-xs space-y-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 flex items-center justify-center text-xs font-extrabold">
            4
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-on-surface">
            Giọng Đọc Kể Chuyện AI
          </h2>
        </div>

        {/* Voice Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {voices.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isTesting = isTestingVoice === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/30 shadow-xs'
                    : 'bg-surface-container-low/30 dark:bg-[#181B25]/40 border-outline-variant/30 hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center text-base shrink-0">
                    {voice.avatar}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-on-surface block truncate">
                      {voice.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant opacity-75 block truncate">
                      {voice.subtitle}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestVoice(voice.id);
                  }}
                  className={`w-full py-1 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    isTesting
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isTesting ? (
                    <>
                      <Volume2 className="w-3 h-3 animate-bounce" />
                      <span>Đang nghe thử...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Nghe thử</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
