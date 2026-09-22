import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { TimeOfDay } from '../three/RoomCanvas';
import { BookInspectorOverlay } from './BookInspectorOverlay';
import { BookshelfSelectorFrame } from './BookshelfSelectorFrame';

export interface LibraryBookshelfZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay, e?: React.MouseEvent) => void;
  selectedBookId?: string | null;
  onClearSelectedBook?: () => void;
  is2DViewAvailable?: boolean;
}

export const LibraryBookshelfZoomOverlay: React.FC<LibraryBookshelfZoomOverlayProps> = ({
  onStageChange,
  timeOfDay,
  selectedBookId,
  onClearSelectedBook,
}) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectedBookId, setInspectedBookId] = useState<string | null>('xcode');
  const containerRef = useRef<HTMLDivElement>(null);

  // Khi click vào sách 3D trên kệ, mở bảng thông tin BookInspectorOverlay nổi trên 3D
  useEffect(() => {
    if (selectedBookId) {
      setInspectedBookId(selectedBookId);
      setIsInspectorOpen(true);
    }
  }, [selectedBookId]);

  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
    if (onClearSelectedBook) {
      onClearSelectedBook();
    }
  };

  return (
    <div
      ref={containerRef}
      data-time-of-day={timeOfDay}
      className={`absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden z-20 font-sans theme-${timeOfDay}`}
    >
      {/* 1. NÚT QUAY LẠI TỔNG QUAN PHÒNG (MINIMAL FLOATING BACK BUTTON) */}
      {!isInspectorOpen && (
        <div className="absolute top-6 left-6 z-30 pointer-events-auto">
          <button
            onClick={() => onStageChange(0)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white text-xs font-bold tracking-wide shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-400/60 active:scale-95 cursor-pointer group"
            title="Quay lại phòng ngủ 3D"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span>Về Phòng</span>
          </button>
        </div>
      )}

      {/* 2. KHUNG CHỌN SÁCH & 3D CANVAS (CENTERED 5-BOOK SELECTOR FRAME & UNIFIED 3D MODEL) */}
      <div className="flex-1 w-full h-full flex items-center justify-center px-2 sm:px-8 z-30 pointer-events-auto">
        <BookshelfSelectorFrame
          selectedBookId={inspectedBookId}
          isInspectorOpen={isInspectorOpen}
          onSelectBook={(bookId) => setInspectedBookId(bookId)}
          onOpenInspector={(bookId) => {
            setInspectedBookId(bookId);
            setIsInspectorOpen(true);
          }}
        />
      </div>

      {/* 3. BẢNG THÔNG TIN ẤN BẢN SÁCH NỔI TRỰC TIẾP TRÊN NỀN 3D (BOOK INSPECTOR OVERLAY) */}
      <BookInspectorOverlay
        isOpen={isInspectorOpen}
        onClose={handleCloseInspector}
        selectedBookId={inspectedBookId}
        onSelectBookId={setInspectedBookId}
      />
    </div>
  );
};

