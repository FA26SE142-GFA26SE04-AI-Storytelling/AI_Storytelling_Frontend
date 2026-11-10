"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, CircleAlert, Image as ImageIcon, Images, Volume2, RefreshCw } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import { useRiseIn } from "@/app/lib/motion";
import { useStudioMediaPreview } from "@/app/features/story-workflow/useStudioMediaPreview";
import { useStudioCompletion } from "@/app/features/story-workflow/useStudioCompletion";
import { useMediaPackage } from "@/app/features/story-workflow/useMediaPackage";
import MediaIssues from "@/app/features/studio/MediaIssues";
import StudioScenePreview from "@/app/features/studio/StudioScenePreview";
import { mediaCanRetry, mediaIsGenerating } from "@/app/features/story-workflow/mediaPackage";
import { PublicationDock } from "./CreatorPublication";
import type { MediaProgressDto } from "@/app/types/aiStory";

type Props = {
  storyId: number;
  versionId: number | null;
  media: { data: MediaProgressDto | null; error: string | null; refresh: () => void };
  /** Đang bị khóa chỉnh sửa (đã gửi duyệt / đã xuất bản). */
  locked: boolean;
  busy: boolean;
  onRetry: () => void;
  onChanged: () => void;
  /** Phần phát hành (kiểm tra vùng xám, gửi duyệt) đặt cuối cột phải để không phải cuộn dọc cả trang. */
  children?: ReactNode;
};

/**
 * Bước "Tranh & giọng đọc" của Content Creator, cùng bố cục với phụ huynh (StudioMedia):
 * khung giữa là cảnh đang xem (hình trái; chữ, nút nghe và nút tạo lại phải); cột phải chia nhóm Tiến độ, Cảnh trong truyện, rồi phần phát hành.
 */
export default function CreatorMedia({ storyId, versionId, media, locked, busy, onRetry, onChanged, children }: Props) {
  const m = media.data;
  const preview = useStudioMediaPreview(storyId, versionId ?? m?.approvedStoryVersionId ?? null, m);
  const scenes = useMemo(() => preview.pack?.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex) ?? [], [preview.pack]);
  const [active, setActive] = useState(0);
  /** Ngăn cuối khung giữa để phần Phát hành vẽ khung Ảnh bìa và Nhãn nội dung vào đó. */
  const [dock, setDock] = useState<HTMLElement | null>(null);
  const index = Math.min(active, Math.max(0, scenes.length - 1));
  const scene = scenes[index];
  const sideRef = useRiseIn<HTMLDivElement>(".ck, .prep-scene", [scenes.length ? 1 : 0], { delay: 35, distance: 10 });
  const reload = () => { preview.refresh(); media.refresh(); };
  const c = useStudioCompletion(preview.pack, m, onChanged);
  // Tạo lại tranh / giọng đọc và giữ bản cũ dùng luôn gói media đang xem (không cần bấm tải gói riêng).
  const mp = useMediaPackage({ storyId, versionId: m?.approvedStoryVersionId ?? versionId, disabled: locked, onChanged: () => { reload(); onChanged(); }, source: preview.pack });
  // Gói media đã xác nhận / truyện sẵn sàng thì ẩn nút tạo lại: gói đã chốt.
  const sceneActions = preview.pack && !m?.isConfirmed && !m?.isReady ? {
    busy: mp.busy, locked: locked || mp.uncertain, replacements: preview.pack.replacements ?? [],
    regenerate: (k: "illustration" | "audio", id: number) => void mp.regenerate(k, id),
    keepCurrent: (id: number) => void mp.keepCurrent(id),
  } : undefined;
  // Tải sẵn tranh và giọng đọc của cảnh đang xem và cảnh kế để đổi cảnh không phải chờ.
  const warm = useRef<(HTMLImageElement | HTMLAudioElement)[]>([]);
  useEffect(() => {
    const items: (HTMLImageElement | HTMLAudioElement)[] = [];
    for (const s of [scenes[index], scenes[index + 1]]) {
      if (!s) continue;
      for (const x of s.illustrations) { if (x.status === "Ready" && x.url) { const im = new Image(); im.src = x.url; items.push(im); } }
      const au = s.audio?.find((a) => a.status === "Ready" && a.url);
      if (au?.url) { const el = new Audio(); el.preload = "auto"; el.src = au.url; items.push(el); }
    }
    warm.current = items;
  }, [scenes, index]);
  const total = m ? m.requiredIllustrations || m.sceneCount : 0;
  const step = (done: boolean, label: string, detail: string, Icon: typeof Check) => (
    <div className="ck"><span className={`st ${done ? "ok" : "warn"}`}>{done ? <Check /> : <Icon />}</span>{label}<small>{detail}</small></div>
  );
  const statusText = m
    ? m.isReady ? ""
      : m.isAwaitingConfirmation ? "Xem tranh, nghe giọng đọc rồi tick ô xác nhận và bấm nút bên dưới."
      : mediaCanRetry(m) ? ""
      : "Đang tạo, bạn có thể rời màn hình này."
    : media.error ?? "Đang kiểm tra…";

  return (
    <>
      <div className="center">
        {m && mediaCanRetry(m) && <button className="btn btn-p studio-retry-corner" disabled={busy} onClick={onRetry}><RefreshCw className="ic" />Thử lại</button>}
        <div className="board">
          <div className="board-stack">
          {scenes.length > 0 ? (
            <div className="artwrap">
              {preview.error && <p className="notice err" role="alert">{preview.error}</p>}
              <StudioScenePreview key={`${storyId}:${preview.pack?.packageRevision}:${scene?.sceneId}:${scene?.illustrations.map((x) => x.url).join("|")}`}
                scene={scene} text={scene?.text ?? ""} loading={preview.loading} onReload={reload} actions={sceneActions} generating={!!m && mediaIsGenerating(m)} />
            </div>
          ) : (
            // Chưa có cảnh: khối chờ ở giữa (không dùng khung cảnh vì nó co hẹp và nhãn bị chồng lên chữ).
            <div className="empty" role="status" aria-busy={preview.loading}>
              <Frog size={96} mood="think" />
              <b className="display">{preview.loading ? "Đang tải tranh và giọng đọc…" : "Chưa có cảnh nào trong gói media"}</b>
              <span>{preview.error ?? (preview.loading ? "Vài giây là xong." : "Gói media chưa có ảnh hoặc giọng đọc để hiển thị.")}</span>
              {!preview.loading && <button className="btn btn-s" onClick={reload}><RefreshCw className="ic" />Tải lại</button>}
            </div>
          )}
          {/* Khung Ảnh bìa và Nhãn nội dung của phần Phát hành nằm ngay dưới cảnh, cùng kiểu khung với chữ truyện (rỗng thì ẩn). */}
          <div className="center-dock" ref={setDock} />
          </div>
        </div>
      </div>

      <AsidePane title="Chuẩn bị media" icon={Images} bodyRef={sideRef}>
        <div className="studio-actions">
          {statusText && <p role="status">{statusText}</p>}
          {mp.note && <p className="notice" role="status">{mp.note}</p>}
          {mp.uncertain && <p className="notice warn" role="status">Chưa rõ kết quả thao tác. Hãy tải lại ảnh và giọng đọc rồi mới thử lại.</p>}
          <div className="studio-completion">
            {c.note && <p className="notice" role="status">{c.note}</p>}
            {c.canConfirm && <>
              <label className="row"><input type="checkbox" checked={c.reviewed} disabled={c.busy || c.blocked} onChange={(e) => c.setReviewed(e.target.checked)} />Tôi đã xem tranh và nghe giọng đọc của gói media này</label>
              <button className="btn btn-p" disabled={!c.reviewed || c.busy || c.blocked || locked} onClick={() => void c.confirm()}>{c.busy ? "Đang xác nhận…" : "Xác nhận gói media"}</button>
            </>}
            {c.blocked && <button className="btn btn-s" onClick={reload}>Tải lại</button>}
          </div>
        </div>
        <section className="prep-group" aria-label="Tiến độ">
          <div className="sec-h"><span>Tiến độ</span></div>
          <div className="prep-list">
            {step(true, "Đã duyệt nội dung", "", Check)}
            {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
            {step(!!m?.isGenerated, "Giọng đọc", m ? `${m.readyAudio} đoạn` : "…", Volume2)}
            {step(!!m?.isConfirmed, m?.isConfirmed ? "Đã xác nhận gói media" : "Chờ xác nhận gói media", "", Check)}
          </div>
          <MediaIssues progress={m} pack={preview.pack} onSelectScene={(id, i) => {
            const position = scenes.findIndex((s) => s.sceneId === id);
            if (position >= 0) setActive(position);
            else if (i >= 0 && i < scenes.length) setActive(i);
          }} />
        </section>
        {scenes.length > 0 && (
          <section className="prep-group" aria-label="Cảnh trong truyện">
            <div className="sec-h"><span>Cảnh trong truyện</span><span className="pill ai">{scenes.length} cảnh</span></div>
            <div className="prep-scenes">
              {scenes.map((s, i) => {
                const flagged = m?.issues?.some((issue) => issue.sceneIndex === s.sceneIndex);
                return (
                  <button key={s.sceneId} className={`prep-scene${index === i ? " on" : ""}`} aria-pressed={index === i} aria-label={`Cảnh ${i + 1}${flagged ? ", cần kiểm tra" : ""}`} onClick={() => setActive(i)}>
                    <span className="num">{i + 1}</span>
                    <span className="txt">{s.text ?? ""}</span>
                    {flagged && <CircleAlert className="flag" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}
        <PublicationDock.Provider value={dock}>{children}</PublicationDock.Provider>
      </AsidePane>
    </>
  );
}
