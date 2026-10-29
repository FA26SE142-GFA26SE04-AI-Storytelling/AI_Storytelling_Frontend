"use client";

import "@/app/features/library/library.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PencilLine, Search, WandSparkles, X } from "lucide-react";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { CreateDraftInput, CreatorDraft } from "@/app/types/creator";
import { GENRES } from "@/app/lib/storyRules";
import { gradientFor } from "@/app/lib/storyView";
import { Notice, Page, fmt } from "./ui";
import CreatorGeneration from "./CreatorGeneration";
import { useAuth } from "@/app/context/AuthContext";
import CreatorEditor from "./CreatorEditor";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const blank = (): CreateDraftInput => ({ title: "", description: "", ageBand: "6-8", genre: GENRES[0], experienceMode: "reading" });

/** Props mà khu nhân viên (StaffApp) truyền cho các trang của Content Creator. */
export type CreatorPageProps = { go: (pageId: string, target?: number | null) => void; target: number | null };

const isAi = (s: CreatorDraft) => s.source?.toLowerCase() === "ai";
const statusKey = (s: CreatorDraft) => (s.status ?? "draft").toLowerCase().replace(/[^a-z]/g, "");

/** Kệ theo trạng thái; mỗi truyện chỉ nằm ở đúng một kệ. */
const SHELVES: { id: string; title: string; sub: string; keys: string[] }[] = [
  { id: "draft", title: "Đang soạn", sub: "Bản nháp chưa gửi duyệt", keys: ["draft"] },
  { id: "review", title: "Đang duyệt & chuẩn bị", sub: "Chờ Moderator duyệt hoặc đang tạo tranh và giọng đọc",
    keys: ["inputaccepted", "generating", "outlinereview", "moderationreview", "contentreview", "approved", "mediaprocessing", "mediareview"] },
  { id: "ready", title: "Sẵn sàng", sub: "Đã duyệt, có thể công khai vào Thư viện chung", keys: ["ready", "published"] },
  { id: "archived", title: "Đã lưu trữ", sub: "Không còn dùng", keys: ["archived"] },
];
const shelfOf = (s: CreatorDraft) => SHELVES.find((g) => g.keys.includes(statusKey(s)))?.id ?? "draft";

/** Trang "Thư viện" của Content Creator: truyện mẫu của chính mình, xếp theo kệ trạng thái giống Thư viện của phụ huynh. */
export function CreatorLibrary({ go }: CreatorPageProps) {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [age, setAge] = useState("all");
  const [src, setSrc] = useState("all");

  const load = useCallback(async () => {
    const r = await creatorService.list();
    setList(r.ok ? r.data?.items ?? [] : []);
    setNote(r.ok ? null : { ok: false, text: r.message });
  }, []);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list ?? [])
      .filter((s) => (age === "all" || s.ageBand === age) && (src === "all" || (src === "ai" ? isAi(s) : !isAi(s))) && (s.title || "").toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime());
  }, [list, q, age, src]);
  const filtering = q.trim() !== "" || age !== "all" || src !== "all";
  const open = (s: CreatorDraft) => go(isAi(s) ? "create-ai" : "create-manual", s.storyId);

  return (
    <Page title="Thư viện truyện mẫu" sub="Truyện bạn soạn sẽ vào Thư viện chung sau khi Moderator duyệt. Bấm Mở để soạn tiếp, xem phiên bản hoặc gửi duyệt."
      actions={<><button className="btn btn-s" onClick={() => go("create-ai")}><WandSparkles className="ic" />Dùng AI</button><button className="btn btn-p" onClick={() => go("create-manual")}><PencilLine className="ic" />Thủ công</button></>}>
      <Notice note={note} />
      <div className="lfilters" role="group" aria-label="Lọc truyện mẫu" style={{ borderBottom: 0, padding: 0 }}>
        <label className="row" style={{ gap: 6, color: "var(--muted)", flex: "1 1 220px" }}>
          <Search className="ic" />
          <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên truyện" aria-label="Tìm theo tên truyện" />
        </label>
        <select className={`inp${age !== "all" ? " on" : ""}`} aria-label="Lọc theo nhóm tuổi" value={age} onChange={(e) => setAge(e.target.value)}>
          <option value="all">Mọi độ tuổi</option>
          {Object.entries(AGE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={`inp${src !== "all" ? " on" : ""}`} aria-label="Lọc theo cách tạo" value={src} onChange={(e) => setSrc(e.target.value)}>
          <option value="all">Mọi cách tạo</option>
          <option value="ai">Dùng AI</option>
          <option value="manual">Thủ công</option>
        </select>
        {filtering && <button className="btn btn-g" onClick={() => { setQ(""); setAge("all"); setSrc("all"); }}><X className="ic" />Xoá lọc</button>}
      </div>

      {list === null ? <p className="sub">Đang tải…</p>
        : list.length === 0 ? (
          <div className="lib-empty">
            <b className="display">Chưa có truyện mẫu nào</b>
            <span className="sub">Bắt đầu bằng AI từ một ý tưởng, hoặc tự viết theo cách thủ công.</span>
            <div className="row"><button className="btn btn-p" onClick={() => go("create-ai")}><WandSparkles className="ic" />Dùng AI tạo truyện</button><button className="btn btn-s" onClick={() => go("create-manual")}>Viết thủ công</button></div>
          </div>
        ) : shown.length === 0 ? <p className="sub">Không tìm thấy truyện phù hợp.</p>
        : SHELVES.map((g) => {
          const items = shown.filter((s) => shelfOf(s) === g.id);
          if (items.length === 0) return null;
          return (
            <section key={g.id} className="shelf" aria-label={g.title}>
              <div className="shelf-h"><h3 className="display">{g.title}</h3><span className="sub">{g.sub} · {items.length} truyện</span></div>
              <div className="shelf-grid">
                {items.map((s) => (
                  <article key={s.storyId} className="bk">
                    <span className="bk-cover" style={{ background: gradientFor(s.storyId) }}>
                      <span className="pill draft bk-badge">{isAi(s) ? "AI" : "Thủ công"}</span>
                      <span className="bk-name display">{s.title || "Truyện chưa đặt tên"}</span>
                    </span>
                    <span className="bk-title">{s.title || "Truyện chưa đặt tên"}</span>
                    <span className="bk-meta">{s.genre || "Khác"} · {AGE[s.ageBand] ?? s.ageBand} · {MODE[s.experienceMode] ?? s.experienceMode}</span>
                    <span className="bk-meta">{s.lastVersionNo ? `V${s.lastVersionNo}` : "Chưa lưu"} · {fmt(s.updatedAt ?? s.createdAt)}</span>
                    <button className="btn btn-s" style={{ marginTop: 6 }} onClick={() => open(s)}>Mở</button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
    </Page>
  );
}

/** Trang "Dùng AI": tạo truyện mẫu mới bằng AI, hoặc mở lại truyện AI từ Thư viện (`target`). */
export function CreatorCreateAi({ go, target }: CreatorPageProps) {
  const { user } = useAuth();
  return (
    <Page title="Tạo truyện bằng AI">
      <CreatorGeneration key={`${user?.id}:${target ?? "new"}`} initialId={target} onBack={() => go("library")} />
    </Page>
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
