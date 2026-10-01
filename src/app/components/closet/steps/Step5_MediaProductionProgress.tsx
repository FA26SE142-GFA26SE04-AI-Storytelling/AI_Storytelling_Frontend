'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Palette,
  Volume2,
  Play,
  Pause,
  Maximize2,
  X,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { storyService } from '../../../services/storyService';
import { MediaProgressDto } from '../../../types/aiStory';
import { StoryPageDto } from '../../../types/story';
import { normalizeStoryStatus } from '../hooks/storyGenerationFlow';
import { useStoryProgressPolling } from '../hooks/useStoryProgressPolling';

export interface Step5_MediaProductionProgressProps {
  storyId: number;
  onReadStory: (storyId: number) => void;
  onReturnToRoom: () => void;
  onBackToQuiz?: () => void;
}

const load = (id: number, signal: AbortSignal) => api.getMediaProgress(id, signal);
const waiting = (p: MediaProgressDto) =>
  !p.isReady && !['archived', 'rejected'].includes(normalizeStoryStatus(p.storyStatus));

export const Step5_MediaProductionProgress: React.FC<Step5_MediaProductionProgressProps> = ({
  storyId,
  onReadStory,
  onReturnToRoom,
  onBackToQuiz,
}) => {
  const poll = useStoryProgressPolling(storyId, load, waiting, 600_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dữ liệu các trang / cảnh của câu chuyện (để xem trước ảnh & nghe thử audio)
  const [pages, setPages] = useState<StoryPageDto[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  // Audio player state
  const [playingPageNumber, setPlayingPageNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image zoom modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controller.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const progress = poll.data;
  const ready = progress?.isReady === true && !poll.error;
  const stopped = !!progress && ['archived', 'rejected'].includes(normalizeStoryStatus(progress.storyStatus));

  // Tải thông tin các trang (hình ảnh & audio)
  const fetchStoryPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      const res = await storyService.getStoryById(storyId);
      if (res.success && res.data && res.data.pages) {
        setPages(res.data.pages);
      }
    } catch {
      // Bỏ qua lỗi nạp trang ngầm
    } finally {
      setLoadingPages(false);
    }
  }, [storyId]);

  useEffect(() => {
    void fetchStoryPages();
  }, [fetchStoryPages, progress?.readyIllustrations, progress?.readyAudio, ready]);

  // Điều khiển phát âm thanh nghe thử
  const togglePlayAudio = (pageNumber: number, audioUrl?: string | null) => {
    if (!audioUrl) return;

    if (playingPageNumber === pageNumber) {
      // Dừng lại
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingPageNumber(null);
    } else {
      // Phát audio mới
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingPageNumber(pageNumber);

      audio.play().catch(() => {
        setPlayingPageNumber(null);
      });

      audio.onended = () => {
        setPlayingPageNumber(null);
      };

      audio.onerror = () => {
        setPlayingPageNumber(null);
      };
    }
  };

  const run = async (read: boolean) => {
    if (lock.current || (read && !ready)) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const c = new AbortController();
    controller.current = c;
    try {
      if (read) {
        // Verify freshness
        const fresh = await api.getMediaProgress(storyId, c.signal);
        if (c.signal.aborted) return;
        if (!fresh.success || !fresh.data?.isReady) {
          setError(fresh.message || 'Ấn phẩm chưa sẵn sàng.');
          poll.refresh();
          return;
        }
        try {
          await api.getMediaPackage(storyId, c.signal);
        } catch {
          // getMediaPackage is optional; story content is fetched directly at desk
        }
        onReadStory(storyId);
      } else {
        const result = await api.retryMedia(storyId, c.signal);
        if (c.signal.aborted) return;
        if (!result.success) setError(result.message);
        poll.refresh();
        void fetchStoryPages();
      }
    } finally {
      if (!c.signal.aborted) {
        lock.current = false;
        setBusy(false);
      }
    }
  };

  const totalIllustrations = progress?.requiredIllustrations || progress?.sceneCount || pages.length || 0;
  const readyIllustrations = progress?.readyIllustrations ?? 0;
  const readyAudio = progress?.readyAudio ?? 0;

  return (
    <section className="dashboard-glass-panel p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-tod-border">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              ready
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                : 'bg-purple-500/20 text-purple-500 border-purple-500/30 animate-pulse'
            }`}
          >
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  ready
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                }`}
              >
                Bước 3 / 3: Kiểm tra Tranh & Âm thanh
              </span>
              {ready && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hoàn tất</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-tod-text mt-0.5">
              {ready ? 'Ấn phẩm đã hoàn tất — Mời bạn xem trước tranh & audio' : 'AI đang vẽ tranh minh họa và thu âm giọng đọc'}
            </h3>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 dashboard-card px-3 py-1.5 font-bold">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>Tranh: {readyIllustrations}/{totalIllustrations || '?'}</span>
          </span>
          <span className="flex items-center gap-1.5 dashboard-card px-3 py-1.5 font-bold">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Audio: {readyAudio}/{totalIllustrations || '?'}</span>
          </span>
        </div>
      </div>

      {(error || poll.error) && (
        <p role="alert" className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
          {error || poll.error}
        </p>
      )}
      {stopped && <p className="text-sm text-rose-500">Câu chuyện đã dừng, không thể tiếp tục.</p>}

      {/* Progress Bar (nếu chưa ready) */}
      {!ready && (
        <div className="dashboard-card p-4 rounded-2xl border border-tod-border bg-tod-card/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-tod-text">
            <span>Tiến độ sản xuất đa phương tiện</span>
            <span className="text-purple-500 animate-pulse">
              Họa sĩ AI đang vẽ & Diễn viên AI đang lồng tiếng...
            </span>
          </div>
          <div className="w-full bg-tod-surface h-2.5 rounded-full overflow-hidden border border-tod-border">
            <div
              className="bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-500 h-full rounded-full transition-all duration-700 animate-pulse"
              style={{
                width: `${Math.min(
                  100,
                  totalIllustrations > 0
                    ? Math.round(((readyIllustrations + readyAudio) / (totalIllustrations * 2)) * 100)
                    : 35
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* GALLERY XEM TRƯỚC TRANH & NGHE THỬ AUDIO TỪNG CẢNH (HUMAN CHECK) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-tod-text-muted">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Xem trước tranh vẽ và nghe thử giọng đọc từng trang</span>
          </span>
          {pages.length > 0 && <span className="text-tod-text-muted">{pages.length} trang truyện</span>}
        </div>

        {/* Lưới các trang truyện */}
        <div className="grid gap-3.5 sm:grid-cols-2 max-h-[46vh] overflow-y-auto pr-1 dashboard-scrollbar">
          {pages.map((page, idx) => {
            const hasImage = !!page.imageUrl;
            const hasAudio = !!page.audioUrl;
            const isPlaying = playingPageNumber === page.pageNumber;

            return (
              <div
                key={page.id ?? idx}
                className="dashboard-card p-3 rounded-2xl border border-tod-border bg-tod-card/60 space-y-2.5 flex flex-col justify-between hover:border-tod-border/80 transition-all shadow-sm"
              >
                {/* Phần trên: Ảnh & Header trang */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-tod-text">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-500 text-[11px] font-black">
                      Trang {page.pageNumber || idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasAudio && (
                        <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                          <Volume2 className="w-3 h-3" /> Audio sẵn sàng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Khung ảnh minh họa */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-tod-surface border border-tod-border group">
                    {hasImage ? (
                      <>
                        <img
                          src={page.imageUrl!}
                          alt={`Minh họa trang ${page.pageNumber}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setZoomedImage({
                              url: page.imageUrl!,
                              title: `Trang ${page.pageNumber}: ${page.content.slice(0, 30)}...`,
                            })
                          }
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer"
                          title="Phóng to xem tranh"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <Palette className="w-7 h-7 text-purple-400/60 animate-bounce" />
                        <span className="text-[11px] text-tod-text-muted font-medium">
                          Họa sĩ AI đang hoàn thiện bức tranh...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lời dẫn truyện */}
                  <p className="text-xs text-tod-text line-clamp-3 leading-relaxed">
                    {page.content}
                  </p>
                </div>

                {/* Phần dưới: Audio Player Bar */}
                <div className="pt-2 border-t border-tod-border/60 flex items-center justify-between gap-2">
                  {hasAudio ? (
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(page.pageNumber, page.audioUrl)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-white shadow-md animate-pulse'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500/25'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Đang phát...' : 'Nghe thử giọng đọc'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-tod-text-muted italic flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-tod-text-muted/60" />
                      <span>Đang tạo audio...</span>
                    </span>
                  )}

                  {hasImage && (
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      ✓ Tranh đã vẽ
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {pages.length === 0 && !loadingPages && (
            <div className="col-span-2 dashboard-card p-6 text-center text-xs text-tod-text-muted space-y-2">
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
              <p>Đang chuẩn bị bộ tranh minh họa và âm thanh cho các cảnh...</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ZOOM ẢNH MINH HỌA */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-tod-surface border border-tod-border rounded-3xl overflow-hidden shadow-2xl p-3 space-y-3"
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-black text-tod-text">{zoomedImage.title}</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-xl bg-tod-card text-tod-text hover:bg-tod-card/80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={zoomedImage.url}
              alt="Minh họa phóng to"
              className="w-full max-h-[70vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* ACTION BUTTONS TOOLBAR */}
      <div className="pt-4 border-t border-tod-border flex flex-wrap items-center justify-between gap-3">
        {/* Left actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onReturnToRoom}
            className="dashboard-card px-3.5 py-2 text-xs font-bold text-tod-text-muted hover:text-tod-text"
          >
            Quay lại phòng 3D
          </button>

          {onBackToQuiz && (
            <button
              type="button"
              disabled={busy}
              onClick={onBackToQuiz}
              className="dashboard-card px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-tod-text-muted hover:text-tod-text"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem lại câu đố</span>
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={poll.refresh}
            className="dashboard-card px-3.5 py-2 text-xs font-bold"
          >
            Kiểm tra trạng thái
          </button>

          {progress && normalizeStoryStatus(progress.jobStatus) === 'failed' && !stopped && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(false)}
              className="dashboard-card px-3.5 py-2 text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại media</span>
            </button>
          )}
        </div>

        {/* Right primary action: Mở sách đọc trên Bàn học 3D */}
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => void run(true)}
          className={`px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 rounded-2xl shadow-xl transition-all cursor-pointer ${
            ready
              ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-emerald-500/25 hover:scale-105 active:scale-95'
              : 'bg-tod-card text-tod-text-muted/50 border border-tod-border cursor-not-allowed opacity-60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{ready ? 'Mở sách để đọc trên bàn học' : 'Đang xử lý media...'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
