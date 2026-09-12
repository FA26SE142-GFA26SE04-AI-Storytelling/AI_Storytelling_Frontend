'use client';

import React from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface LibraryFilterToolbarProps {
  activeTab: 'all' | 'reading' | 'created';
  setActiveTab: (tab: 'all' | 'reading' | 'created') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const LibraryFilterToolbar: React.FC<LibraryFilterToolbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
      {/* Left Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === 'all'
              ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
              : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
          }`}
        >
          <span>⚡ Tất cả truyện (24)</span>
        </button>

        <button
          onClick={() => setActiveTab('reading')}
          className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === 'reading'
              ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
              : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
          }`}
        >
          <span>📖 Đang đọc dở (3)</span>
        </button>

        <button
          onClick={() => setActiveTab('created')}
          className={`px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            activeTab === 'created'
              ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
              : 'bg-surface-container-lowest dark:bg-[#0F1626] text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
          }`}
        >
          <span>🎨 Bé tự tạo cùng AI (6)</span>
        </button>
      </div>

      {/* Right Search Input & Sort Dropdown */}
      <div className="flex items-center gap-2">
        {/* Search Box */}
        <div className="relative flex-1 md:w-64">
          <Search className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên truyện trong tủ của bé..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 text-on-surface text-xs font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative shrink-0">
          <select className="appearance-none bg-surface-container-lowest dark:bg-[#0F1626] border border-outline-variant/40 rounded-full px-3.5 py-2 pr-8 font-bold text-on-surface text-xs cursor-pointer focus:outline-none focus:border-primary-container">
            <option value="recent">📌 Mới nghe gần đây</option>
            <option value="favorite">❤️ Yêu thích nhất</option>
            <option value="name">🔤 Theo tên A-Z</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};
