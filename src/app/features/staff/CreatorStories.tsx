"use client";

import "@/app/features/library/library.css";
import "@/app/features/review/review-tools.css";
import "@/app/features/studio/workflow.css";
import { useRef, useState } from "react";
import { FilePlus2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import Select from "@/app/components/Select";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { CreateDraftInput } from "@/app/types/creator";
import { GENRES } from "@/app/lib/storyRules";
import { Notice, Page } from "./ui";
import CreatorGeneration from "./CreatorGeneration";
import { useAuth } from "@/app/context/AuthContext";
import CreatorEditor from "./CreatorEditor";

const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const AGE_OPTIONS: { value: CreateDraftInput["ageBand"]; label: string }[] = [{ value: "6-8", label: "6–8 tuổi" }, { value: "9-10", label: "9–10 tuổi" }];
const MODE_OPTIONS = Object.entries(MODE).map(([value, label]) => ({ value: value as CreateDraftInput["experienceMode"], label }));
const GENRE_OPTIONS = GENRES.map((g) => ({ value: g, label: g }));
const blank = (): CreateDraftInput => ({ title: "", description: "", ageBand: "6-8", genre: GENRES[0], experienceMode: "reading" });

/** Props mà khu nhân viên (StaffApp) truyền cho các trang của Content Creator. */
export type CreatorPageProps = { go: (pageId: string, target?: number | null) => void; target: number | null; /** Truyện AI đang soạn dở trước khi tải lại trang (chỉ trang "Dùng AI" dùng). */ resumeId?: number | null };

/** Trang "Dùng AI": tạo truyện mẫu mới bằng AI, hoặc mở lại truyện AI từ Thư viện (`target`). */
export function CreatorCreateAi({ go, target, resumeId = null }: CreatorPageProps) {
  const { user } = useAuth();
  const initialId = target ?? resumeId;
  return (
    <CreatorGeneration
      key={`${user?.id}:${initialId ?? "new"}`}
      initialId={initialId}
      onBack={() => go("library")}
      onBuyCredits={() => go("account-plan")}
    />
  );
}

/** Trang "Thủ công" (Luồng 5 Bước 5.8): tạo bản nháp mới rồi soạn, hoặc mở bản nháp có sẵn từ Thư viện (`target`). Mỗi lần lưu là một phiên bản. */
export function CreatorCreateManual({ go, target }: CreatorPageProps) {
  const [openId, setOpenId] = useState<number | null>(target);
  const [form, setForm] = useState<CreateDraftInput>(blank);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Tạo truyện mất mạng thì thử lại đúng thao tác cũ (cùng operationId) để không tạo trùng.
  const createOp = useRef<{ op: string; input: CreateDraftInput } | null>(null);

  const create = async () => {
    const same = createOp.current && JSON.stringify(createOp.current.input) === JSON.stringify(form);
    if (!same) createOp.current = { op: newOperationId("create"), input: { ...form } };
    const { op, input } = createOp.current!;
    setBusy(true);
    setNote(null);
    const r = await creatorService.create(op, { ...input, title: input.title.trim(), description: input.description.trim() });
    setBusy(false);
    if (r.ok && r.data) {
      createOp.current = null;
      setOpenId(r.data.storyId);
    } else setNote({ ok: false, text: r.message });
  };

  if (openId !== null) {
    return (
      <Page title="Soạn truyện mẫu" sub="Truyện mẫu dành cho Thư viện chung, bằng tiếng Việt và không chứa thông tin cá nhân của người thật.">
        <CreatorEditor key={openId} storyId={openId} onBack={() => go("library")} onBuyCredits={() => go("account-plan")} />
      </Page>
    );
  }

  const set = (p: Partial<CreateDraftInput>) => setForm((f) => ({ ...f, ...p }));
  // Giống trang phụ huynh: hộp thoại tạo bản nháp hiện ngay khi vào, tạo xong thì vào thẳng bước soạn nội dung.
  return (
    <Page title="Tạo truyện thủ công" sub="Điền thông tin truyện mới rồi mở trình soạn để tự viết nội dung.">
      <Dialog title="Tạo bản nháp truyện mới" wide onClose={() => { if (!busy) go("library"); }}>
        <form className="ce-create" onSubmit={(e) => { e.preventDefault(); void create(); }}>
          <Notice note={note} />
          <label className="field"><span className="lbl">Tên truyện</span><input className="inp" autoFocus maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <div className="ce-create-row">
            <div className="field"><span className="lbl">Nhóm tuổi</span><Select<CreateDraftInput["ageBand"]> ariaLabel="Nhóm tuổi" value={form.ageBand} options={AGE_OPTIONS} onChange={(v) => set({ ageBand: v })} /></div>
            <div className="field"><span className="lbl">Thể loại</span><Select<string> ariaLabel="Thể loại" value={form.genre} options={GENRE_OPTIONS} onChange={(v) => set({ genre: v })} /></div>
            <div className="field"><span className="lbl">Trải nghiệm</span><Select<CreateDraftInput["experienceMode"]> ariaLabel="Trải nghiệm" value={form.experienceMode} options={MODE_OPTIONS} onChange={(v) => set({ experienceMode: v })} /></div>
          </div>
          <label className="field"><span className="lbl">Mô tả ngắn</span><textarea className="inp" rows={2} maxLength={1000} value={form.description} onChange={(e) => set({ description: e.target.value })} /></label>
          <p className="notice warn" data-inline-notice>Nhóm tuổi và trải nghiệm không đổi được sau khi tạo.</p>
          <div className="ce-create-actions">
            <button type="button" className="btn btn-g" disabled={busy} onClick={() => go("library")}>Huỷ</button>
            <button type="submit" className="btn btn-p" disabled={busy || !form.title.trim()}><FilePlus2 className="ic" />{busy ? "Đang tạo…" : "Tạo bản nháp"}</button>
          </div>
        </form>
      </Dialog>
    </Page>
  );
}
