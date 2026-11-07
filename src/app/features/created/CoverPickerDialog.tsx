"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageOff, Save } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import SafeImage from "@/app/components/SafeImage";
import CoverCropper from "./CoverCropper";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { coverFor, joinCover, type CoverCrop } from "@/app/lib/storyView";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import { storyService } from "@/app/services/storyService";

type Pic = { assetId: number; url: string; label: string };

/** Backend trả 409 khi truyện Creator đã gửi duyệt hoặc đang công khai: phải yêu cầu gỡ trước khi đổi ảnh bìa. */
const LOCKED_MESSAGE = "Truyện đang công khai hoặc đang chờ duyệt nên chưa đổi được ảnh bìa. Hãy yêu cầu gỡ truyện trước.";

/**
 * Popup chọn ảnh bìa từ chính các tranh minh họa của truyện, rồi kéo khung để chọn vị trí hiển thị.
 * Dùng chung cho phụ huynh và Content Creator. Nút Lưu chỉ hiện khi đã chọn ảnh.
 */
export default function CoverPickerDialog({ storyId, cover, onClose, onSaved }: {
  storyId: number;
  /** Ảnh bìa hiện tại (đã ký), để xem trước và quyết định có hiện nút gỡ. */
  cover: string | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pics, setPics] = useState<Pic[] | null>(null);
  const [picked, setPicked] = useState<Pic | null>(null);
  const [crop, setCrop] = useState<CoverCrop | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    void aiStoryCreationService.getMediaPackage(storyId, c.signal).then((r) => {
      if (c.signal.aborted) return;
      if (!r.success) { showToast(r.message || "Không tải được tranh của truyện.", "err"); setPics([]); return; }
      const list: Pic[] = [];
      for (const scene of (r.data?.scenes ?? []).slice().sort((a, b) => a.sceneIndex - b.sceneIndex))
        for (const beat of scene.illustrations.slice().sort((a, b) => a.beatOrder - b.beatOrder))
          if (beat.status === "Ready" && beat.url && beat.assetId) list.push({ assetId: beat.assetId, url: beat.url, label: `Cảnh ${scene.sceneIndex + 1}` });
      setPics(list);
    }).catch(() => { if (!c.signal.aborted) setPics([]); });
    return () => c.abort();
  }, [storyId]);

  const preview = useMemo(() => (picked ? coverFor(joinCover(picked.url, crop)) : coverFor(cover)), [picked, crop, cover]);

  const save = async () => {
    if (!picked || saving) return;
    setSaving(true);
    const r = await storyService.setCover(storyId, picked.assetId, crop);
    setSaving(false);
    if (!r.success) { showToast(r.status === 409 ? LOCKED_MESSAGE : r.message || "Không lưu được ảnh bìa.", "err"); return; }
    showToast("Đã lưu ảnh bìa.");
    onSaved(); onClose();
  };

  const remove = async () => {
    if (saving || !(await confirmDialog("Gỡ ảnh bìa của truyện này? Truyện sẽ dùng ảnh bìa mặc định."))) return;
    setSaving(true);
    const r = await storyService.setCover(storyId, null);
    setSaving(false);
    if (!r.success) { showToast(r.status === 409 ? LOCKED_MESSAGE : r.message || "Không gỡ được ảnh bìa.", "err"); return; }
    showToast("Đã gỡ ảnh bìa.");
    onSaved(); onClose();
  };

  return (
    <Dialog title="Chọn ảnh bìa" onClose={onClose}>
      <div className="edit-story">
        {pics === null && <p className="sub" role="status">Đang tải tranh của truyện…</p>}
        {pics !== null && pics.length === 0 && <p className="sub">Truyện chưa có tranh minh họa nào để làm ảnh bìa.</p>}
        {!!pics?.length && (
          <div className="cover-pick-grid" role="listbox" aria-label="Tranh trong truyện">
            {pics.map((p) => (
              <button key={p.assetId} type="button" role="option" aria-selected={picked?.assetId === p.assetId} aria-label={p.label}
                className={`cover-pick${picked?.assetId === p.assetId ? " on" : ""}`}
                onClick={() => { setPicked(p); setCrop(null); }}>
                <SafeImage src={p.url} alt={p.label} loading="lazy" />
              </button>
            ))}
          </div>
        )}
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
    </Dialog>
  );
}
