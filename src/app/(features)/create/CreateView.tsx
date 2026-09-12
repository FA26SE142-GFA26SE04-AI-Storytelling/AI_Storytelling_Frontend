'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wand2,
  Sparkles,
  Bookmark,
  Heart,
  ChevronRight,
  Clock,
  Sparkle
} from 'lucide-react';
import { StoryItem } from '../../types/home';
import { useTranslation } from '../../context/LanguageContext';

// Import sub-components from src/app/components/create
import { CreateHeroHeader } from '../../components/create/CreateHeroHeader';
import { CreateStepper } from '../../components/create/CreateStepper';
import { CharacterSelector, CharacterOption } from '../../components/create/CharacterSelector';
import { WorldSelector, WorldOption } from '../../components/create/WorldSelector';
import { MoralOptions, MoralOption } from '../../components/create/MoralOptions';
import { VoiceSelector, VoiceOption } from '../../components/create/VoiceSelector';
import { LivePreviewPanel } from '../../components/create/LivePreviewPanel';

// Data sets matching the design
const CHARACTERS: CharacterOption[] = [
  {
    id: 'gauchandro',
    name: 'Gấu Khăn Đỏ',
    subtitle: 'Sống tình cảm, dịu dàng',
    avatar: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=400&auto=format&fit=crop',
    badge: 'Momi',
    color: 'from-rose-500/20 to-amber-500/20 border-rose-300 dark:border-rose-700',
  },
  {
    id: 'dino',
    name: 'Khủng Long Dino',
    subtitle: 'Dũng cảm, thám hiểm',
    avatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=400&auto=format&fit=crop',
    badge: 'Dino',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-300 dark:border-emerald-700',
  },
  {
    id: 'tho-huong',
    name: 'Thỏ Hường Bánh',
    subtitle: 'Nhanh trí, đáng yêu',
    avatar: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=400&auto=format&fit=crop',
    badge: 'Thỏ Bánh',
    color: 'from-pink-500/20 to-purple-500/20 border-pink-300 dark:border-pink-700',
  },
  {
    id: 'phi-hanh-gia',
    name: 'Phi Hành Gia Nhí',
    subtitle: 'Tò mò, ước mơ cao',
    avatar: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop',
    badge: 'Vũ Trụ',
    color: 'from-sky-500/20 to-indigo-500/20 border-sky-300 dark:border-sky-700',
  },
  {
    id: 'tien-buom',
    name: 'Tiên Bướm Hoa',
    subtitle: 'Yêu thiên nhiên, rực rỡ',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
    badge: 'Tiên Hoa',
    color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-300 dark:border-violet-700',
  },
  {
    id: 'robot-hat-de',
    name: 'Robot Hạt Dẻ',
    subtitle: 'Thông minh, hóm hỉnh',
    avatar: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=400&auto=format&fit=crop',
    badge: 'AI Kid',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-300 dark:border-amber-700',
  },
];

const WORLDS: WorldOption[] = [
  {
    id: 'candy-kingdom',
    name: 'Vương Quốc Bánh Kẹo',
    description: 'Dòng sông tưới sữa, suối kẹo ngọt lấp lánh và đồi bánh ngọt, kẹo gum ngào ngạt...',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    badge: 'Đang chọn',
    gradient: 'from-rose-500 to-amber-500',
  },
  {
    id: 'galaxy',
    name: 'Dải Ngân Hà Sao Băng',
    description: 'Lướt trên những dải sao băng lấp lánh và thám hiểm các hành tinh ngọt ngào bí ẩn...',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
    badge: 'Phổ biến',
    gradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'mushroom-forest',
    name: 'Rừng Nấm Khổng Lồ',
    description: 'Mái nhà nấm màu sắc tỏa phát sáng và những chú thỏ rừng nhảy múa dưới trăng...',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    badge: 'Mới rực rỡ',
    gradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'underwater-city',
    name: 'Thành Phố Đáy Biển',
    description: 'Rạn san hô phát sáng, nhà vỏ ốc tuyệt đẹp và cá heo học múa dưới làn nước biếc...',
    imageUrl: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=600&auto=format&fit=crop',
    badge: 'Kỳ diệu',
    gradient: 'from-cyan-600 to-blue-600',
  },
];

const MORALS: MoralOption[] = [
  { id: 'share', label: 'Biết chia sẻ đồ chơi', icon: '🎁' },
  { id: 'courage', label: 'Lòng dũng cảm', icon: '🛡️' },
  { id: 'family', label: 'Yêu thương gia đình', icon: '💖' },
  { id: 'sleep', label: 'Đêm ngủ đúng giờ', icon: '🌙' },
  { id: 'dark', label: 'Không sợ bóng tối', icon: '✨' },
];

const VOICES: VoiceOption[] = [
  {
    id: 'co-hoa-mi',
    name: 'Cô Họa Mi',
    subtitle: 'Ấm áp, truyền cảm',
    avatar: '👩‍🏫',
    sampleText: 'Giọng đọc miền Bắc dịu dàng...',
    tag: 'Khuyên dùng',
  },
  {
    id: 'bac-gau-tre',
    name: 'Bác Gấu Trẻ',
    subtitle: 'Trầm ấm, vui tươi',
    avatar: '🐻',
    sampleText: 'Giọng đọc kể chuyện hài hước...',
    tag: 'Ấm áp',
  },
  {
    id: 'chi-tho-trang',
    name: 'Chị Thỏ Trắng',
    subtitle: 'Trong trẻo, nhí nhảnh',
    avatar: '🐰',
    sampleText: 'Giọng đọc líu lo sinh động...',
    tag: 'Vui vẻ',
  },
];

const RECENT_COMMUNITY_STORIES: StoryItem[] = [
  {
    id: 'c1',
    title: 'Chú Gấu Bông Biết Bay Và Ngôi Sao Bị Lạc',
    description: 'Bé An và chú gấu bông 1 cánh giúp ngôi sao nhỏ bị rơi trở về bầu trời đêm đầy hy vọng...',
    duration: '10 phút',
    tag: 'Lồng tiếng • Bài học biết ơn',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    listens: '4.8k',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=600&auto=format&fit=crop',
    actionText: 'Đọc ngay',
    actionType: 'read',
    isFavorite: true,
  },
  {
    id: 'c2',
    title: 'Robot Hạt Dẻ Và Bí Mật Đồng Hồ Cổ Cùng Anh',
    description: 'Một chuyến phiêu lưu lắp ráp bánh răng đồng hồ rèn luyện tính kiên trì và ngăn nắp cho bé...',
    duration: '15 phút',
    tag: 'Truyện chữ • Rèn luyện kiên trì',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    listens: '3.2k',
    rating: 5.0,
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop',
    actionText: 'Đọc ngay',
    actionType: 'read',
    isFavorite: false,
  },
  {
    id: 'c3',
    title: 'Chiếc Bánh Kem Khổng Lồ Của Thỏ Trắng',
    description: 'Chiếc bánh kem khổng lồ nhiều tầng, bạn Thỏ mang đến chia sẻ cho cả khu rừng cùng vui hội...',
    duration: '8 phút',
    tag: 'Audiobook • Bài học chia sẻ',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    listens: '2.9k',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=600&auto=format&fit=crop',
    actionText: 'Đọc ngay',
    actionType: 'play',
    isFavorite: true,
  },
];

export const CreateView: React.FC = () => {
  const { t } = useTranslation();

  // Active step state (1 to 4)
  const [activeStep, setActiveStep] = useState<number>(2);

  // Form selections
  const [selectedCharacter, setSelectedCharacter] = useState<string>('gauchandro');
  const [customPrompt, setCustomPrompt] = useState<string>('Sâu Momi (Khăn Đỏ)');
  const [selectedWorld, setSelectedWorld] = useState<string>('candy-kingdom');
  const [selectedMorals, setSelectedMorals] = useState<string[]>(['share']);
  const [isInteractiveBranching, setIsInteractiveBranching] = useState<boolean>(true);
  const [isBedtimeMode, setIsBedtimeMode] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('co-hoa-mi');

  // Preview & audio states
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isTestingVoice, setIsTestingVoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);

  // Voice test simulation handler
  const handleTestVoice = (voiceId: string) => {
    if (isTestingVoice === voiceId) {
      setIsTestingVoice(null);
    } else {
      setIsTestingVoice(voiceId);
      setTimeout(() => {
        setIsTestingVoice(null);
      }, 3000);
    }
  };

  // Toggle moral selection
  const toggleMoral = (moralId: string) => {
    if (selectedMorals.includes(moralId)) {
      setSelectedMorals(selectedMorals.filter((m) => m !== moralId));
    } else {
      setSelectedMorals([...selectedMorals, moralId]);
    }
  };

  // Handle Generate Story button click
  const handleStartGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsGenerating(false), 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Save Draft handler
  const handleSaveDraft = () => {
    setIsDraftSaved(true);
    setTimeout(() => setIsDraftSaved(false), 3000);
  };

  // Selected objects
  const currentCharacterObj = CHARACTERS.find((c) => c.id === selectedCharacter) || CHARACTERS[0];
  const currentWorldObj = WORLDS.find((w) => w.id === selectedWorld) || WORLDS[0];

  return (
    <div className="min-h-screen bg-background text-on-background py-6 px-3 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* HERO HEADER */}
        <CreateHeroHeader />

        {/* STEPPER BAR */}
        <CreateStepper
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          characterName={currentCharacterObj.name}
          characterBadge={currentCharacterObj.badge}
          worldName={currentWorldObj.name}
        />

        {/* MAIN WORKSPACE GRID (FORM CONTROLS + LIVE PREVIEW) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: FORM CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            <CharacterSelector
              characters={CHARACTERS}
              selectedCharacter={selectedCharacter}
              setSelectedCharacter={setSelectedCharacter}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              onSuggestVoice={handleTestVoice}
            />

            <WorldSelector
              worlds={WORLDS}
              selectedWorld={selectedWorld}
              setSelectedWorld={setSelectedWorld}
            />

            <MoralOptions
              morals={MORALS}
              selectedMorals={selectedMorals}
              toggleMoral={toggleMoral}
              isInteractiveBranching={isInteractiveBranching}
              setIsInteractiveBranching={setIsInteractiveBranching}
              isBedtimeMode={isBedtimeMode}
              setIsBedtimeMode={setIsBedtimeMode}
            />

            <VoiceSelector
              voices={VOICES}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              isTestingVoice={isTestingVoice}
              handleTestVoice={handleTestVoice}
            />

            {/* ACTION BUTTONS ROW */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleStartGeneration}
                disabled={isGenerating}
                className="relative w-full sm:flex-1 py-3.5 px-6 rounded-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:brightness-105 active:scale-98 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all cursor-pointer overflow-hidden group"
              >
                <div className="radiant-glow-aura" />
                
                {isGenerating ? (
                  <div className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Đang Hóa Phép Câu Chuyện... ({generationProgress}%)</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    <span>Bắt Đầu Hóa Phép Câu Chuyện (15 Star)</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </button>

              <button
                onClick={handleSaveDraft}
                className="w-full sm:w-auto py-3.5 px-5 rounded-full border border-outline-variant/60 bg-surface-container-lowest dark:bg-[#0F1626] hover:bg-surface-container text-on-surface font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Bookmark className={`w-4 h-4 ${isDraftSaved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                <span>{isDraftSaved ? 'Đã lưu nháp!' : 'Lưu bản nháp'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY LIVE PREVIEW PANEL */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <LivePreviewPanel
              currentCharacter={currentCharacterObj}
              currentWorld={currentWorldObj}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              isPlayingAudio={isPlayingAudio}
              setIsPlayingAudio={setIsPlayingAudio}
            />
          </div>

        </div>

        {/* BOTTOM SECTION: RECENT COMMUNITY STORIES */}
        <section className="relative pt-8 space-y-6 border-t border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <Sparkle className="w-3.5 h-3.5 fill-current" />
                <span>NHANH CẬP NHẬT TẠI XƯỞNG</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">
                Tác Phẩm Vừa Ra Lò Cùng Phụ Huynh
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group transition-colors"
            >
              <span>Xem tất cả từ cộng đồng</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RECENT_COMMUNITY_STORIES.map((story) => (
              <div key={story.id} className="relative group">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-rose-500/15 via-amber-400/15 to-emerald-400/15 blur-lg opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none" />

                <div className="relative group bg-surface-container-lowest/90 dark:bg-[#0F1626]/90 backdrop-blur-md rounded-3xl p-3 border border-outline-variant/30 dark:border-[#283556] shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer">
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 bg-surface-container">
                    <Image
                      src={story.imageUrl}
                      alt={story.title}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                      sizes="400px"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-300" />
                      <span>{story.duration}</span>
                    </div>
                    <button className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/80 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-rose-500 transition-colors shadow-sm">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </button>
                  </div>

                  <div className="flex flex-col flex-1 px-1 space-y-2">
                    <span className={`self-start text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${story.tagColor}`}>
                      {story.tag}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-on-surface line-clamp-1 group-hover:text-primary-container transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed opacity-80">
                      {story.description}
                    </p>

                    <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        {story.listens} lượt thích
                      </span>
                      <button className="px-4 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer">
                        Đọc ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
