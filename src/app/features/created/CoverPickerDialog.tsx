"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageOff, Save, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import SafeImage from "@/app/components/SafeImage";
import Frog from "@/app/components/brand/Frog";
import CoverCropper from "./CoverCropper";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { coverFor, joinCover, type CoverCrop } from "@/app/lib/storyView";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { storyService } from "@/app/services/storyService";

type Pic = { assetId: number; url: string; label: string };

/**
 * Danh sách tranh của truyện lấy từ gói media (backend dựng gói và ký lại link nên chậm). Giữ tạm trong bộ nhớ để mở lại tức thì,
 * hạn ngắn hơn thời gian sống của link ký (10 phút). Chỉ lưu khi tải thành công; nhiều nơi cùng gọi thì dùng chung một yêu cầu.
 */
const PICS_TTL_MS = 4 * 60_000;
const picsCache = new Map<number, { at: number; pics: Pic[] }>();
const picsRunning = new Map<number, Promise<{ pics: Pic[]; error: string | null }>>();
const freshPics = (storyId: number) => {
  const hit = picsCache.get(storyId);
  return hit && Date.now() - hit.at < PICS_TTL_MS ? hit.pics : null;
};
function fetchPics(storyId: number): Promise<{ pics: Pic[]; error: string | null }> {
  const cached = freshPics(storyId);
  if (cached) return Promise.resolve({ pics: cached, error: null });
  const running = picsRunning.get(storyId);
  if (running) return running;
  const request = aiStoryCreationService.getMediaPackage(storyId).then((r) => {
    if (!r.success) return { pics: [] as Pic[], error: r.message || "Không tải được tranh của truyện." };
    const pics: Pic[] = [];
    for (const scene of (r.data?.scenes ?? []).slice().sort((a, b) => a.sceneIndex - b.sceneIndex))
      for (const beat of scene.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder))
        if (beat.status === "Ready" && beat.url && beat.assetId) pics.push({ assetId: beat.assetId, url: beat.url, label: `Cảnh ${scene.sceneIndex + 1}` });
    picsCache.set(storyId, { at: Date.now(), pics });
    return { pics, error: null };
  }).catch(() => ({ pics: [] as Pic[], error: "Không tải được tranh của truyện." })).finally(() => { picsRunning.delete(storyId); });
  picsRunning.set(storyId, request);
  return request;
}
/** Tải sẵn danh sách tranh (gọi khi rê chuột vào nút chọn ảnh bìa) để bộ chọn mở ra là có ngay. */
export function prefetchCoverPictures(storyId: number) { void fetchPics(storyId); }

/** Backend trả 409 khi truyện Creator đã gửi duyệt hoặc đang công khai: phải yêu cầu gỡ trước khi đổi ảnh bìa. */
const LOCKED_MESSAGE = "Truyện đang công khai hoặc đang chờ duyệt nên chưa đổi được ảnh bìa. Hãy yêu cầu gỡ truyện trước.";

type PickerProps = {
  storyId: number;
  /** Ảnh bìa hiện tại (đã ký), để xem trước và quyết định có hiện nút gỡ. */
  cover: string | null | undefined;
  onClose: () => void;
  /** `newCover`: ảnh bìa vừa lưu (đã kèm vùng cắt) hoặc null khi gỡ, để cập nhật giao diện ngay không chờ tải lại. */
  onSaved: (newCover?: string | null) => void;
};

/** Popup chọn ảnh bìa (phụ huynh); Content Creator dùng thẳng CoverPickerPanel đặt trong khung giữa. */
export default function CoverPickerDialog(props: PickerProps) {
  return <Dialog title="Chọn ảnh bìa" onClose={props.onClose}><CoverPickerPanel {...props} /></Dialog>;
}

/**
 * Chọn ảnh bìa từ chính các tranh minh họa của truyện, rồi kéo khung để chọn vị trí hiển thị.
 * Dùng chung cho phụ huynh và Content Creator. Nút Lưu chỉ hiện khi đã chọn ảnh.
 * `inline`: đặt thẳng trong khung giữa (có tiêu đề và nút đóng riêng, tranh bên trái, khung chọn vị trí bên phải) thay vì trong popup.
 */
export function CoverPickerPanel({ storyId, cover, onClose, onSaved, inline = false }: PickerProps & { inline?: boolean }) {
  const [pics, setPics] = useState<Pic[] | null>(() => freshPics(storyId));
  const [picked, setPicked] = useState<Pic | null>(null);
  const [crop, setCrop] = useState<CoverCrop | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pics !== null) return;
    let alive = true;
    void fetchPics(storyId).then(({ pics: list, error }) => {
      if (!alive) return;
      if (error) showToast(error, "err");
      setPics(list);
    });
    return () => { alive = false; };
  }, [storyId, pics]);

  const preview = useMemo(() => (picked ? coverFor(joinCover(picked.url, crop)) : coverFor(cover)), [picked, crop, cover]);

  const save = async () => {
    if (!picked || saving) return;
    setSaving(true);
    const r = await storyService.setCover(storyId, picked.assetId, crop);
    setSaving(false);
    if (!r.success) { showToast(r.status === 409 ? LOCKED_MESSAGE : r.message || "Không lưu được ảnh bìa.", "err"); return; }
    showToast("Đã lưu ảnh bìa.");
    onSaved(joinCover(picked.url, crop)); onClose();
  };

  const remove = async () => {
    if (saving || !(await confirmDialog("Gỡ ảnh bìa của truyện này? Truyện sẽ dùng ảnh bìa mặc định."))) return;
    setSaving(true);
    const r = await storyService.setCover(storyId, null);
    setSaving(false);
    if (!r.success) { showToast(r.status === 409 ? LOCKED_MESSAGE : r.message || "Không gỡ được ảnh bìa.", "err"); return; }
    showToast("Đã gỡ ảnh bìa.");
    onSaved(null); onClose();
  };

  return (
      <div className={`edit-story cover-picker${inline ? " inline" : ""}`}>
        {inline && <div className="row">
          <b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>Chọn ảnh bìa</b>
          <button type="button" className="btn btn-g" aria-label="Đóng" title="Đóng" onClick={onClose}><X className="ic" /></button>
        </div>}
        <div className="cover-picker-pics">
        {pics === null && <div className="cover-pick-wait" role="status"><Frog size={56} mood="think" /><b>Đang tải tranh của truyện…</b></div>}
        {pics !== null && pics.length === 0 && <p className="sub">Truyện chưa có tranh minh họa nào để làm ảnh bìa.</p>}
        {!!pics?.length && (
          <div className="cover-pick-grid" role="listbox" aria-label="Tranh trong truyện">
            {pics.map((p) => (
              <button key={p.assetId} type="button" role="option" aria-selected={picked?.assetId === p.assetId} aria-label={p.label}
                className={`cover-pick${picked?.assetId === p.assetId ? " on" : ""}`}
                onClick={() => { setPicked(p); setCrop(null); }}>
                <SafeImage src={p.url} alt={p.label} />
              </button>
            ))}
          </div>
        )}
        </div>
        <div className="cover-picker-edit">
        {(picked || !!cover) && (
          <div className="edit-story-cover">
            {picked && <CoverCropper key={picked.assetId} src={picked.url} value={crop} onChange={setCrop} onBroken={() => setPicked(null)} />}
            <div className="edit-story-cover-preview" role="img" aria-label="Xem trước bìa" style={{ background: preview }} />
          </div>
        )}
        <div className="row edit-story-actions">
          {!!cover && !picked && <button type="button" className="btn btn-no" disabled={saving} onClick={() => void remove()}><ImageOff className="ic" />Gỡ ảnh bìa</button>}
          <button type="button" className="btn btn-s" onClick={onClose}>Hủy</button>
          {picked && <button type="button" className="btn btn-p" disabled={saving} onClick={() => void save()}><Save className="ic" />{saving ? "Đang lưu…" : "Lưu"}</button>}
        </div>
        </div>
      </div>
  );
}
