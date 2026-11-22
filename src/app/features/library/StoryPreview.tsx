"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { storyService } from "@/app/services/storyService";
import { splitScenes, type StoryCard } from "@/app/lib/storyView";
import type { StoryDto } from "@/app/types/story";
import AudioRing from "./AudioRing";

/** Một trang khi đọc: chữ của cảnh, các tranh và đoạn giọng đọc (đã sẵn sàng, có URL) của cảnh đó. */
type PreviewPage = { text: string; images: string[]; audio: { url: string; label: string }[] };

/**
 * Xem trước truyện như bé thấy — không ghi nhận lượt đọc, không cộng điểm.
 * Truyện AI lấy từng cảnh từ gói media của backend (GET /stories/{id}/media/package: chữ, tranh, giọng đọc);
 * chưa có gói media (hoặc truyện thủ công) thì chỉ hiện chữ, chia đoạn theo nội dung truyện.
 */
export type PreviewStory = Pick<StoryCard, "id" | "title" | "cover"> & { family?: boolean; creator?: boolean; raw?: Pick<StoryDto, "content"> };

/**
 * Bộ nhớ tạm của hộp xem trước (sống đến khi tải lại trang): đóng rồi mở lại cùng truyện thì dùng ngay, không gọi API nữa.
 * Đường dẫn ảnh/giọng đọc là URL có chữ ký nên chỉ giữ ngắn; ảnh lỗi thì xoá mục tương ứng để lần sau lấy đường dẫn mới.
 */
const PREVIEW_CACHE = new Map<string, { pages: PreviewPage[]; at: number }>();
const PREVIEW_TTL_MS = 5 * 60_000;

/** `loadContent`: nguồn chữ riêng (Content Creator đọc qua /creator/stories); không truyền thì dùng API của phụ huynh. */
export function Preview({ story, onClose, loadContent }: { story: PreviewStory; onClose: () => void; loadContent?: () => Promise<string> }) {
  const [pages, setPages] = useState<PreviewPage[] | null>(null);
  const [page, setPage] = useState(0);
  const [shot, setShot] = useState(0);
  const [broken, setBroken] = useState<string | null>(null);
  /** Ảnh đã tải xong; chưa khớp ảnh đang chọn thì hiện vòng tải thay vì ảnh cũ. */
  const [loaded, setLoaded] = useState<string | null>(null);
  const cacheKey = `${story.id}:${story.family ? "f" : story.creator ? "r" : "s"}:${loadContent ? "c" : "p"}:${story.raw?.content?.length ?? 0}`;
  useEffect(() => {
    // Creator sửa nội dung liên tục và nguồn chữ riêng không có dấu hiệu đổi, nên không dùng bộ nhớ tạm cho họ.
    const hit = loadContent ? undefined : PREVIEW_CACHE.get(cacheKey);
    if (hit && Date.now() - hit.at < PREVIEW_TTL_MS) { setPages(hit.pages); return; }
    const c = new AbortController();
    const textOnly = (content: string): PreviewPage[] => splitScenes(content).map((text) => ({ text, images: [], audio: [] }));
    const load = async (): Promise<PreviewPage[]> => {
      // Bản nháp thủ công của phụ huynh không nằm trong GET /Story và không có gói media: chỉ hiện chữ.
      if (story.family && !loadContent) {
        const d = await parentAuthoringService.get(story.id);
        const versionId = d.data?.story.selectedVersionId;
        const v = versionId ? await parentAuthoringService.version(story.id, versionId) : null;
        return textOnly(v?.data?.content ?? "");
      }
      const [content, pack] = await Promise.all([
        loadContent ? loadContent() : storyService.getStoryById(story.id).then((r) => r.data?.content ?? story.raw?.content ?? ""),
        // Truyện Creator đã công khai: ảnh/giọng đọc lấy qua API thư viện chung (API tạo media chỉ cho đúng tác giả).
        (story.creator && !loadContent ? storyService.getCommunityStoryMedia(story.id, c.signal) : aiStoryCreationService.getMediaPackage(story.id, c.signal)).then((r) => (r.success ? r.data : null)).catch(() => null),
      ]);
      const texts = splitScenes(content);
      const scenes = pack?.scenes?.slice().sort((a, b) => a.sceneIndex - b.sceneIndex) ?? [];
      if (!scenes.length) return textOnly(content);
      return scenes.map((scene, i) => {
        const audio = (scene.audio ?? []).slice().sort((a, b) => a.segmentOrder - b.segmentOrder);
        return {
          text: scene.text?.trim() || audio.map((a) => a.text).join(" ").trim() || texts[i] || "",
          images: scene.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder)
            .flatMap((x) => (x.status === "Ready" && x.url ? [x.url] : [])),
          audio: audio.flatMap((a) => (a.status === "Ready" && a.url ? [{ url: a.url, label: `Đoạn ${a.segmentOrder + 1}` }] : [])),
        };
      });
    };
    void load().then((p) => { if (c.signal.aborted) return; if (!loadContent) PREVIEW_CACHE.set(cacheKey, { pages: p, at: Date.now() }); setPages(p); }).catch(() => { if (!c.signal.aborted) setPages([]); });
    return () => c.abort();
  }, [story]); // eslint-disable-line react-hooks/exhaustive-deps -- loadContent đổi theo từng lần vẽ; chỉ tải lại khi đổi truyện
  const go =(to: number) => { setPage(to); setShot(0); setBroken(null); };
  // Tải sẵn tranh và giọng đọc của trang hiện tại và trang kế để lật trang không phải chờ.
  const warm = useRef<(HTMLImageElement | HTMLAudioElement)[]>([]);
  useEffect(() => {
    if (!pages) return;
    const items: (HTMLImageElement | HTMLAudioElement)[] = [];
    for (const p of [pages[page], pages[page + 1]]) {
      if (!p) continue;
      p.images.forEach((u) => { const im = new Image(); im.src = u; items.push(im); });
      if (p.audio[0]) { const au = new Audio(); au.preload = "auto"; au.src = p.audio[0].url; items.push(au); }
    }
    warm.current = items;
  }, [pages, page]);
  const current = pages?.[page];
  const image = current?.images[shot];
  const shown = image && broken !== image ? image : null;
  // Phát qua portal ra <body>: nếu để trong vùng nội dung, thanh điều hướng trên cùng sẽ đè lên hộp thoại.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={`Xem trước ${story.title}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg wide preview">
        <div className="row"><b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>{story.title}</b><span className="pill draft">Xem trước — không tính lượt đọc</span><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        <div className="preview-body">
          <div className="preview-media">
            {shown
              // Ảnh là URL có chữ ký của backend, nên dùng thẻ img thường.
              // eslint-disable-next-line @next/next/no-img-element
              ? <img key={shown} className={`preview-img${loaded === shown ? "" : " loading"}`} src={shown} alt={`Tranh minh hoạ trang ${page + 1}`} ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLoaded(shown); }} onLoad={() => setLoaded(shown)} onError={() => { PREVIEW_CACHE.delete(cacheKey); setBroken(shown); }} />
              : <div className="cover" style={{ aspectRatio: "16/9", borderRadius: 16, background: story.cover }} role="img" aria-label="Chưa có tranh minh hoạ cho trang này" />}
            {shown && loaded !== shown && <div className="preview-loading" role="status" aria-label="Đang tải tranh"><span className="preview-spin" aria-hidden="true" /></div>}
            {/* Nút nghe tròn ở góc phải trên của hình; key theo trang để đổi trang thì dừng tiếng và chạy lại từ đầu. */}
            {current && current.audio.length > 0 && <AudioRing key={page} urls={current.audio.map((a) => a.url)} label={`Nghe giọng đọc trang ${page + 1}`} />}
          </div>
          {current && current.images.length > 1 && (
            <div className="row preview-shots" aria-label="Chọn tranh trong trang">
              {current.images.map((u, i) => <button key={u} className="btn btn-s" aria-pressed={i === shot} onClick={() => { setShot(i); setBroken(null); }}>Tranh {i + 1}</button>)}
            </div>
          )}
          <p className="display preview-text">{pages === null ? "Đang mở truyện…" : current?.text || "Truyện chưa có nội dung."}</p>
        </div>
        <div className="row">
          <button className="btn btn-s" disabled={page === 0} onClick={() => go(page - 1)} aria-label="Trang trước"><ChevronLeft className="ic" /></button>
          <span className="grow sub" style={{ textAlign: "center" }}>{pages?.length ? `Trang ${page + 1} / ${pages.length}` : ""}</span>
          <button className="btn btn-s" disabled={!pages || page >= pages.length - 1} onClick={() => go(page + 1)} aria-label="Trang sau"><ChevronRight className="ic" /></button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
