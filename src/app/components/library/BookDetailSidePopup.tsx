'use client';

import React, { useRef } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  Compass,
  ArrowRight,
  User,
  Calendar,
  Globe,
  Award,
  CheckCircle2,
  BookmarkCheck,
  FileText,
  Clock,
  Sparkle,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { WorkingVolumeBook } from '../three/room/textures/workingVolumesBooks';

export interface BookDetailSidePopupProps {
  book: WorkingVolumeBook;
  isOpen: boolean;
  onClose: () => void;
  onReadBook?: (bookId: string) => void;
}

function formatAgeBand(raw?: string): string {
  if (!raw) return 'Mọi độ tuổi';
  const cleaned = raw.replace(/^Age_/i, '').replace(/_/g, ' - ');
  return cleaned.includes('tuổi') ? cleaned : `Độ tuổi ${cleaned}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Mới cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatLanguage(lang?: string): string {
  if (!lang) return 'Tiếng Việt';
  const l = lang.toLowerCase();
  if (l === 'vi' || l === 'vie' || l.includes('viet')) return 'Tiếng Việt (vi)';
  if (l === 'en' || l === 'eng' || l.includes('english')) return 'English (en)';
  return lang;
}

export const BookDetailSidePopup: React.FC<BookDetailSidePopupProps> = ({
  book,
  isOpen,
  onClose,
  onReadBook,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen && popupRef.current) {
      gsap.fromTo(
        popupRef.current,
        { opacity: 0, x: 60, yPercent: -50, scale: 0.96 },
        { opacity: 1, x: 0, yPercent: -50, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen, book.id]);

  if (!isOpen) return null;

  const genre = book.genre || book.discipline || 'Truyện Thiếu Nhi';
  const moralLesson = book.moralLesson || book.note;
  const description = book.description || book.deck;
  const author = book.authorName || 'MagicTales Studio';
  const language = formatLanguage(book.language);
  const ageDisplay = formatAgeBand(book.ageBand);
  const source = book.source || 'AI Sáng Tạo';
  const isPublished = book.isPublished !== undefined ? book.isPublished : !book.isEmptyPlaceholder;
  const status = book.status || (isPublished ? 'Đã phát hành' : 'Bản nháp');
  const createdDate = formatDate(book.createdAt);
  const updatedDate = book.updatedAt ? formatDate(book.updatedAt) : null;

  return (
    <div
      ref={popupRef}
      className="pointer-events-auto fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:ml-5 md:ml-8 lg:ml-10 top-1/2 w-auto sm:w-[400px] lg:w-[440px] max-h-[85vh] overflow-y-auto rounded-3xl bg-tod-surface/95 backdrop-blur-2xl border border-tod-border shadow-[0_20px_60px_rgba(0,0,0,0.4)] text-tod-text p-5 sm:p-6 z-50 font-sans transition-all duration-300 custom-scrollbar"
      style={{
        boxShadow: `0 25px 60px -15px ${book.color}33, 0 0 0 1px ${book.color}40`,
      }}
    >
      {/* 1. Header Bar: Volume Tag, Genre, Status Badge & Close Button */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center flex-wrap gap-1.5">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-sm"
            style={{
              backgroundColor: `${book.color}22`,
              color: book.color,
              borderColor: `${book.color}44`,
              borderWidth: 1,
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            {book.isEmptyPlaceholder ? 'Trống' : `Tập ${book.volume} · ${book.roman}`}
          </span>

          <span className="text-[11px] font-bold text-tod-text-muted px-2.5 py-1 rounded-full bg-tod-card border border-tod-border">
            {genre}
          </span>

          {!book.isEmptyPlaceholder && (
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isPublished
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {status}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border text-tod-text-muted hover:text-tod-text transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm shrink-0"
          title="Đóng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Cover Image Banner (if available) */}
      {book.coverImageUrl && (
        <div className="mb-3.5 relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden border border-tod-border shadow-md group">
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
            <span className="text-[11px] font-bold text-white/90 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
              <Sparkle className="w-3 h-3 text-amber-400" />
              Ấn bản minh họa AI
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Title & Meta Row */}
      <div className="mb-3">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-tod-text flex items-center gap-2">
          <span>{book.title}</span>
          {!book.isEmptyPlaceholder && <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />}
        </h2>
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-tod-text-muted mt-1">
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <Compass className="w-3.5 h-3.5" />
            {genre}
          </span>
          <span>•</span>
          <span className="text-tod-text-muted">{ageDisplay}</span>
          {author && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-tod-text">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                {author}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 4. Story Description / Tóm tắt truyện */}
      {description && (
        <div className="mb-3 p-3.5 rounded-2xl bg-tod-card/80 border border-tod-border text-xs sm:text-sm leading-relaxed text-tod-text font-medium shadow-inner">
          <div className="flex items-center gap-1 text-[11px] font-bold text-tod-text-muted uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            Tóm tắt câu chuyện
          </div>
          <p className="line-clamp-4">{description}</p>
        </div>
      )}

      {/* 5. Moral Lesson / Bài học đạo đức ý nghĩa */}
      {!book.isEmptyPlaceholder && moralLesson && (
        <div
          className="mb-3.5 p-3 rounded-2xl border-l-4 relative overflow-hidden shadow-sm"
          style={{
            borderLeftColor: book.color,
            backgroundColor: `${book.color}10`,
          }}
        >
          <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-500 mb-0.5">
            <Award className="w-3.5 h-3.5" />
            Bài học rút ra
          </div>
          <p className="text-xs italic font-semibold text-tod-text">
            "{moralLesson}"
          </p>
        </div>
      )}

      {/* 6. Comprehensive Story DTO Metadata Grid (6 Ô thông số đầy đủ) */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        {/* Author / Tác giả */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <User className="w-3 h-3 text-indigo-400" />
            Tác giả
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs" title={author}>
            {author}
          </p>
        </div>

        {/* AgeBand / Độ tuổi */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <BookmarkCheck className="w-3 h-3 text-amber-500" />
            Độ tuổi phù hợp
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">
            {ageDisplay}
          </p>
        </div>

        {/* Language / Ngôn ngữ */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Globe className="w-3 h-3 text-cyan-400" />
            Ngôn ngữ
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">
            {language}
          </p>
        </div>

        {/* Source / Nguồn gốc */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Nguồn gốc
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs" title={source}>
            {source}
          </p>
        </div>

        {/* CreatedAt / Ngày tạo */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Calendar className="w-3 h-3 text-emerald-400" />
            Ngày phát hành
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">
            {createdDate}
          </p>
        </div>

        {/* UpdatedAt or Status */}
        <div className="p-2.5 rounded-xl bg-tod-card border border-tod-border">
          <span className="text-[10px] font-bold uppercase text-tod-text-muted flex items-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-pink-400" />
            Cập nhật
          </span>
          <p className="font-extrabold text-tod-text truncate text-xs">
            {updatedDate || 'Bản gốc'}
          </p>
        </div>
      </div>

      {/* 7. Action Button */}
      <div className="flex items-center gap-2">
        {!book.isEmptyPlaceholder && onReadBook && (
          <button
            onClick={() => onReadBook(book.id)}
            className="flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            style={{
              background: `linear-gradient(135deg, ${book.color}, #f59e0b)`,
              boxShadow: `0 10px 25px -5px ${book.color}66`,
            }}
          >
            <BookOpen className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Đọc Truyện Ngay</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        <button
          onClick={onClose}
          className={`${
            book.isEmptyPlaceholder ? 'w-full' : ''
          } py-3 px-4 rounded-2xl bg-tod-card hover:bg-tod-surface border border-tod-border font-bold text-xs text-tod-text transition-all cursor-pointer hover:scale-105 active:scale-95`}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
