import React from 'react';
import { Sparkles, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { PageSpread } from './deskSpreadsGenerator';

export interface DeskReadingBottomToolbarProps {
  activeSpread: PageSpread | undefined;
  bookTitle: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isFocusDimmer: boolean;
  onToggleFocusDimmer: () => void;
  currentPageIndex: number;
  totalPages: number;
}

export const DeskReadingBottomToolbar = React.forwardRef<
  HTMLDivElement,
  DeskReadingBottomToolbarProps
>(({
  activeSpread,
  bookTitle,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isFocusDimmer,
  onToggleFocusDimmer,
  currentPageIndex,
  totalPages,
}, ref) => {
  return (
    <div
      ref={ref}
      className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-between gap-3 sm:gap-4 w-auto max-w-[94vw] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-tod-surface/90 border border-tod-border/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-40 text-tod-text transition-all hover:bg-tod-surface/98"
    >
      {/* Left: Book Spread Title */}
      <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-[320px]">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-extrabold text-xs text-tod-text truncate">
            {activeSpread?.title || bookTitle}
          </span>
          <span className="text-[10px] font-semibold text-tod-text-muted truncate hidden sm:inline">
            {activeSpread?.subtitle || 'Lật trang bằng kéo chuột hoặc phím ← →'}
          </span>
        </div>
      </div>

      <div className="h-4 w-px bg-tod-border/80" />

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.85}
          className="p-1 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="px-1.5 py-0.5 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-[10px] font-extrabold text-amber-500 min-w-[40px] text-center transition-all cursor-pointer hover:scale-105"
          title="Đặt lại mức phóng to mặc định"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          disabled={zoomLevel >= 1.45}
          className="p-1 rounded-lg bg-tod-card/80 hover:bg-tod-card border border-tod-border/60 text-tod-text disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Phóng to (+)"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>

      <div className="h-4 w-px bg-tod-border/80" />

      {/* Right: Dimmer & Page Counter */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleFocusDimmer}
          className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
            isFocusDimmer
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-500'
              : 'bg-tod-card/80 hover:bg-tod-card border-tod-border/60 text-tod-text-muted hover:text-tod-text'
          }`}
          title="Bật/tắt làm tối nền phòng (Phím F)"
        >
          {isFocusDimmer ? (
            <Eye className="w-3 h-3 text-amber-500" />
          ) : (
            <EyeOff className="w-3 h-3 text-tod-text-muted" />
          )}
          <span className="hidden md:inline">Tập trung</span>
        </button>

        {totalPages > 0 && (
          <span className="text-[10px] font-bold text-tod-text-muted px-2 py-0.5 rounded-full bg-tod-card/80 border border-tod-border/60">
            {currentPageIndex + 1}/{totalPages}
          </span>
        )}
      </div>
    </div>
  );
});

DeskReadingBottomToolbar.displayName = 'DeskReadingBottomToolbar';
