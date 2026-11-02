"use client";

import "@/app/features/library/library.css";
import { useRef, useState } from "react";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { CreateDraftInput, CreatorDraft } from "@/app/types/creator";
import { GENRES } from "@/app/lib/storyRules";
import { Notice, Page } from "./ui";
import CreatorGeneration from "./CreatorGeneration";
import { useAuth } from "@/app/context/AuthContext";
import CreatorEditor from "./CreatorEditor";

const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const blank = (): CreateDraftInput => ({ title: "", description: "", ageBand: "6-8", genre: GENRES[0], experienceMode: "reading" });

/** Props mà khu nhân viên (StaffApp) truyền cho các trang của Content Creator. */
export type CreatorPageProps = { go: (pageId: string, target?: number | null) => void; target: number | null };

/** Trang "Dùng AI": tạo truyện mẫu mới bằng AI, hoặc mở lại truyện AI từ Thư viện (`target`). */
export function CreatorCreateAi({ go, target }: CreatorPageProps) {
  const { user } = useAuth();
  return <CreatorGeneration key={`${user?.id}:${target ?? "new"}`} initialId={target} onBack={() => go("library")} />;
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
        <CreatorEditor key={openId} storyId={openId} onBack={() => go("library")} />
      </Page>
    );
  }

  const set = (p: Partial<CreateDraftInput>) => setForm((f) => ({ ...f, ...p }));
  return (
    <Page title="Tạo truyện thủ công" sub="Điền thông tin truyện mới rồi mở trình soạn để tự viết nội dung.">
      <Notice note={note} />
      <div className="st-card">
        <h3>Truyện mới</h3>
        <div className="st-form">
          <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="field"><span className="lbl">Nhóm tuổi</span>
            <select className="inp" value={form.ageBand} onChange={(e) => set({ ageBand: e.target.value as CreateDraftInput["ageBand"] })}><option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option></select></label>
          <label className="field"><span className="lbl">Thể loại</span>
            <select className="inp" value={form.genre} onChange={(e) => set({ genre: e.target.value })}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label>
          <label className="field"><span className="lbl">Trải nghiệm</span>
            <select className="inp" value={form.experienceMode} onChange={(e) => set({ experienceMode: e.target.value as CreateDraftInput["experienceMode"] })}>
              {Object.entries(MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <label className="field"><span className="lbl">Mô tả ngắn</span><textarea className="inp" rows={2} maxLength={1000} value={form.description} onChange={(e) => set({ description: e.target.value })} /></label>
        <p className="sub">Nhóm tuổi và trải nghiệm chưa đổi được sau khi tạo. “Nghe” và “Đọc và nghe” chưa tự tạo giọng đọc.</p>
        <div className="row">
          <button className="btn btn-g" onClick={() => go("library")}>Về thư viện</button>
          <span className="grow" />
          <button className="btn btn-p" disabled={busy} onClick={() => void create()}>{busy ? "Đang tạo…" : "Tạo và mở trình soạn"}</button>
        </div>
      </div>
    </Page>
  );
}
