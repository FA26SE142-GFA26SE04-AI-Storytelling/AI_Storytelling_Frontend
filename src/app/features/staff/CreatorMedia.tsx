"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, Image as ImageIcon, Images, Volume2 } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import Frog from "@/app/components/brand/Frog";
import { useRiseIn } from "@/app/lib/motion";
import { useStudioMediaPreview } from "@/app/features/story-workflow/useStudioMediaPreview";
import { useStudioCompletion } from "@/app/features/story-workflow/useStudioCompletion";
import MediaAssets from "@/app/features/studio/MediaAssets";
import MediaIssues from "@/app/features/studio/MediaIssues";
import StudioScenePreview from "@/app/features/studio/StudioScenePreview";
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
 * khung giữa là cảnh đang xem (hình trái, chữ và nút nghe phải) + thanh trạng thái; cột phải là khung "Chuẩn bị" cuộn riêng.
 */
export default function CreatorMedia({ storyId, versionId, media, locked, busy, onRetry, onChanged, children }: Props) {
  const m = media.data;
  const preview = useStudioMediaPreview(storyId, versionId ?? m?.approvedStoryVersionId ?? null, m);
  const scenes = useMemo(() => preview.pack?.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex) ?? [], [preview.pack]);
  const [active, setActive] = useState(0);
  const index = Math.min(active, Math.max(0, scenes.length - 1));
  const scene = scenes[index];
  const sideRef = useRiseIn<HTMLDivElement>(".ck, .scene-list button", [scenes.length ? 1 : 0], { delay: 35, distance: 10 });
  const reload = () => { preview.refresh(); media.refresh(); };
  const c = useStudioCompletion(preview.pack, m, onChanged);
  const total = m ? m.requiredIllustrations || m.sceneCount : 0;
  const step = (done: boolean, label: string, detail: string, Icon: typeof Check) => (
    <div className="ck"><span className={`st ${done ? "ok" : "warn"}`}>{done ? <Check /> : <Icon />}</span>{label}<small>{detail}</small></div>
  );
  const status = m
    ? m.isReady ? "Đã xác nhận media. Bạn có thể gửi duyệt công khai ở khung bên phải."
      : m.isAwaitingConfirmation ? "Xem tranh, nghe giọng đọc rồi tick ô xác nhận và bấm nút bên cạnh."
      : "Đang tạo, bạn có thể rời màn hình này."
    : media.error ?? "Đang kiểm tra…";

  return (
    <>
      <div className="center">
        <div className="board">
          {scenes.length > 0 ? (
            <div className="artwrap">
              <div className="artlabel"><span>Cảnh {index + 1} / {scenes.length}</span><em>Bản media từ backend</em></div>
              {preview.error && <p className="notice err" role="alert">{preview.error}</p>}
              <StudioScenePreview key={`${storyId}:${preview.pack?.packageRevision}:${scene?.sceneId}:${scene?.illustrations.map((x) => x.url).join("|")}`}
                scene={scene} text={scene?.text ?? ""} loading={preview.loading} onReload={reload} />
            </div>
          ) : (
            // Chưa có cảnh: khối chờ ở giữa (không dùng khung cảnh vì nó co hẹp và nhãn bị chồng lên chữ).
            <div className="empty" role="status" aria-busy={preview.loading}>
              <Frog size={96} mood="think" />
              <b className="display">{preview.loading ? "Đang tải tranh và giọng đọc…" : "Chưa có cảnh nào trong gói media"}</b>
              <span>{preview.error ?? (preview.loading ? "Vài giây là xong." : "Gói media chưa có ảnh hoặc giọng đọc để hiển thị.")}</span>
              {!preview.loading && <button className="btn btn-s" onClick={reload}>Tải lại</button>}
            </div>
          )}
        </div>
        <div className="media-bar">
          <b>Minh hoạ và giọng đọc</b>
          <span className="grow">{status}</span>
          {m?.errorCode && <button className="btn btn-s" disabled={busy} onClick={onRetry}>Thử lại</button>}
          {/* Nút xác nhận nằm ngay thanh dưới như phụ huynh (trước đây chỉ có trong mục thu gọn ở cột phải nên không thấy). */}
          <div className="studio-completion">
            {c.note && <p className="notice" role="status">{c.note}</p>}
            {c.canConfirm && <>
              <label className="row"><input type="checkbox" checked={c.reviewed} disabled={c.busy || c.blocked} onChange={(e) => c.setReviewed(e.target.checked)} />Tôi đã xem tranh và nghe giọng đọc của gói media này</label>
              <button className="btn btn-p" disabled={!c.reviewed || c.busy || c.blocked || locked} onClick={() => void c.confirm()}>{c.busy ? "Đang xác nhận…" : "Xác nhận gói media"}</button>
            </>}
            {c.blocked && <button className="btn btn-s" onClick={reload}>Tải lại trạng thái hoàn tất</button>}
          </div>
        </div>
      </div>

      <AsidePane title="Chuẩn bị media" icon={Images} bodyRef={sideRef}>
        <MediaAssets key={storyId} storyId={storyId} versionId={m?.approvedStoryVersionId ?? versionId} disabled={locked} onChanged={onChanged} />
        <div className="sec">
          {step(true, "Đã duyệt nội dung", "", Check)}
          {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
          {step(!!m?.isGenerated, "Giọng đọc", m ? `${m.readyAudio} đoạn` : "…", Volume2)}
          {step(!!m?.isConfirmed, m?.isConfirmed ? "Đã xác nhận gói media" : "Chờ xác nhận gói media", "", Check)}
          <MediaIssues progress={m} pack={preview.pack} onSelectScene={(id, i) => {
            const position = scenes.findIndex((s) => s.sceneId === id);
            if (position >= 0) setActive(position);
            else if (i >= 0 && i < scenes.length) setActive(i);
          }} />
        </div>
        {scenes.length > 0 && (
          <div className="sec">
            <div className="sec-h"><span>Cảnh trong truyện</span><span className="pill ai">{scenes.length} cảnh</span></div>
            <div className="scene-list">
              {scenes.map((s, i) => (
                <button key={s.sceneId} className={index === i ? "on" : ""} onClick={() => setActive(i)}>
                  <b>Cảnh {i + 1}{m?.issues?.some((issue) => issue.sceneIndex === s.sceneIndex) ? " · Cần kiểm tra" : ""}</b>
                  <small>{(s.text ?? "").slice(0, 60)}…</small>
                </button>
              ))}
            </div>
          </div>
        )}
        {children}
      </AsidePane>
    </>
  );
}
