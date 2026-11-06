"use client";

import { useState } from "react";
import { ImageOff, Save } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import CoverCropper from "./CoverCropper";
import { GENRES } from "@/app/lib/storyRules";
import { coverFor, joinCover, splitCover, type CoverCrop } from "@/app/lib/storyView";
import type { StoryDto } from "@/app/types/story";

export type StoryInfoEdit = { title: string; description: string; genre: string; cover: string };

/** Backend lưu đường dẫn ảnh bìa tối đa 500 ký tự; chỉ nhận https để ảnh không bị chặn khi trang chạy trên https. */
const COVER_MAX = 500;
const coverError = (v: string) => (!v ? "" : v.length > COVER_MAX ? `Đường dẫn dài quá ${COVER_MAX} ký tự.` : !/^https:\/\/[^\s]+$/i.test(v) ? "Đường dẫn ảnh phải bắt đầu bằng https://" : "");

/** Popup sửa thông tin chung của truyện (tên, mô tả, thể loại). Nút Lưu chỉ hiện khi có thay đổi hợp lệ. */
export default function EditStoryDialog({ story, saving, onSave, onClose }: {
  story: Pick<StoryDto, "title" | "description" | "genre" | "coverImageUrl">;
  saving: boolean;
  onSave: (v: StoryInfoEdit) => void;
  onClose: () => void;
}) {
  const initial: StoryInfoEdit = { title: story.title ?? "", description: story.description ?? "", genre: story.genre ?? "", cover: (story.coverImageUrl ?? "").trim() };
  const initialCover = splitCover(initial.cover);
  // Ô đường dẫn chỉ chứa đường dẫn ảnh; vùng cắt nằm riêng và được ghép lại sau dấu # khi lưu.
  const [v, setV] = useState({ ...initial, cover: initialCover.src });
  const [crop, setCrop] = useState<CoverCrop | null>(initialCover.crop);
  /** Đường dẫn mà ảnh xem trước không mở được (thường là link trang web chứ không phải link thẳng tới file ảnh). */
  const [badCover, setBadCover] = useState<string | null>(null);
  const src = v.cover.trim();
  const cover = joinCover(src, crop);
  const dirty = v.title.trim() !== initial.title.trim() || v.description.trim() !== initial.description.trim() || v.genre !== initial.genre || cover !== initial.cover;
  const coverMsg = coverError(cover) || (src && badCover === src ? "Không mở được ảnh từ đường dẫn này. Hãy dán link trực tiếp tới file ảnh (.jpg, .png, .webp…)." : "");
  // Backend yêu cầu tên truyện từ 3 đến 200 ký tự.
  const valid = v.title.trim().length >= 3 && !coverMsg;
  return (
    <Dialog title="Sửa thông tin truyện" onClose={onClose}>
      <form className="edit-story" onSubmit={(e) => { e.preventDefault(); if (dirty && valid && !saving) onSave({ title: v.title.trim(), description: v.description.trim(), genre: v.genre, cover }); }}>
        <label className="lbl" htmlFor="es-title">Tên truyện</label>
        <input id="es-title" className="inp" value={v.title} minLength={3} maxLength={200} autoFocus onChange={(e) => setV({ ...v, title: e.target.value })} />
        <label className="lbl" htmlFor="es-desc">Mô tả</label>
        <textarea id="es-desc" className="inp" rows={5} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <label className="lbl" htmlFor="es-cover">Ảnh bìa</label>
        <div className="edit-story-cover-url">
          <input id="es-cover" className="inp" type="url" inputMode="url" placeholder="https://…" value={v.cover} aria-invalid={!!coverMsg}
            onChange={(e) => { setV({ ...v, cover: e.target.value }); setCrop(null); }} />
          {v.cover && <button type="button" className="btn btn-s" onClick={() => { setV({ ...v, cover: "" }); setCrop(null); }}><ImageOff className="ic" />Gỡ ảnh bìa</button>}
        </div>
        {coverMsg && <p className="notice err" role="alert" data-inline-notice>{coverMsg}</p>}
        {src && !coverMsg && (
          <div className="edit-story-cover">
            <CoverCropper key={src} src={src} value={crop} onChange={setCrop} onBroken={() => setBadCover(src)} />
            <div className="edit-story-cover-preview" role="img" aria-label="Xem trước bìa" style={{ background: coverFor(cover) }} />
          </div>
        )}
        <label className="lbl" htmlFor="es-genre">Thể loại</label>
        <select id="es-genre" className="inp" value={v.genre} onChange={(e) => setV({ ...v, genre: e.target.value })}>
          <option value="">Khác</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          {!!initial.genre && !GENRES.includes(initial.genre) && <option value={initial.genre}>{initial.genre}</option>}
        </select>
        <div className="row edit-story-actions">
          <button type="button" className="btn btn-s" onClick={onClose}>Hủy</button>
          {dirty && <button type="submit" className="btn btn-p" disabled={!valid || saving}><Save className="ic" />{saving ? "Đang lưu…" : "Lưu"}</button>}
        </div>
      </form>
    </Dialog>
  );
}
