"use client";

import "@/app/features/staff/staff.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { PencilLine, Plus } from "lucide-react";
import { newOperationId } from "@/app/services/creatorService";
import { describeParentCode, parentAuthoringService as api } from "@/app/services/parentAuthoringService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { CreateParentDraftInput, ParentDraft, WritingPurpose } from "@/app/types/parentAuthoring";
import CreatorEditor from "@/app/features/staff/CreatorEditor";
import GiveToChild from "./GiveToChild";
import { describeAssistanceCode, parentAssistance } from "@/app/services/assistanceService";

const PURPOSE: Record<WritingPurpose, string> = {
  free: "Viết tự do",
  family_memory: "Kỷ niệm gia đình",
  understanding: "Giúp con hiểu một chuyện",
  message: "Lời nhắn gửi con",
};
const DECLARATIONS = { sourceDeclaration: "Gia đình tự viết", rightsDeclaration: "Chỉ dùng trong gia đình" };
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

/**
 * Phụ huynh tự viết truyện cho con, không qua AI tạo truyện. Mỗi lần lưu là một phiên bản;
 * xong thì kiểm tra theo cài đặt an toàn của bé, tự xác nhận, xem trước rồi giao cho con đọc.
 */
export default function WriteStoryPanel({ child }: { child: ChildProfile }) {
  const [list, setList] = useState<ParentDraft[] | null>(null);
  const [form, setForm] = useState<CreateParentDraftInput | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ParentDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tạo truyện mất mạng thì thử lại đúng thao tác cũ (cùng operationId) để không tạo trùng.
  const createOp = useRef<{ op: string; input: CreateParentDraftInput } | null>(null);

  // Danh sách chung không có bé: mở chi tiết từng truyện để lọc đúng bé đang chọn.
  const load = useCallback(async () => {
    const r = await api.list();
    if (!r.ok) { setError(r.message); setList([]); return; }
    const details = await Promise.all((r.data?.items ?? []).map((s) => api.detail(s.storyId)));
    setList(details.map((d) => d.data).filter((d): d is ParentDraft => !!d && d.childProfileId === child.id));
  }, [child.id]);
  useEffect(() => { void load(); }, [load]);

  const loadDetail = useCallback(async () => {
    if (openId === null) return;
    const r = await api.detail(openId);
    setDetail(r.data);
  }, [openId]);
  useEffect(() => { setDetail(null); void loadDetail(); }, [loadDetail]);

  const create = async () => {
    if (!form) return;
    const same = createOp.current && JSON.stringify(createOp.current.input) === JSON.stringify(form);
    if (!same) createOp.current = { op: newOperationId("create"), input: { ...form, title: form.title.trim() || "Truyện của gia đình" } };
    const { op, input } = createOp.current!;
    setBusy(true);
    setError(null);
    const r = await api.create(op, input);
    setBusy(false);
    if (r.ok && r.data) { createOp.current = null; setForm(null); setOpenId(r.data.story.storyId); void load(); }
    else setError(r.message);
  };

  if (openId !== null) {
    return (
      <div className="pb" style={{ gap: 12 }}>
        <CreatorEditor key={openId} storyId={openId} api={api} declarations={DECLARATIONS}
          assistance={parentAssistance} guidesPurpose={detail?.purpose ?? "free"}
          aiUnavailableReason={!detail || detail.canUseAiAssistance ? null : describeAssistanceCode(detail.aiUnavailableReason ?? undefined, "Hiện chưa hỏi AI được cho truyện này. Bạn vẫn tự viết bình thường.")}
          onBack={() => { setOpenId(null); void load(); }}
          readOnlyReason={!detail?.isReadOnly ? null : !detail.readOnlyReason || detail.readOnlyReason === "PARENT_STORY_FINALIZED"
            ? "Truyện đã giao cho con nên đang khoá. Thu hồi ở phần bên dưới để sửa tiếp." : describeParentCode(detail.readOnlyReason)}
          hint={`Mỗi lần lưu tạo một phiên bản mới; bản cũ vẫn giữ trong lịch sử. Lưu xong thì làm các bước bên dưới để giao cho ${child.nickname} đọc.`}>
          {({ draft, dirty, reload }) => (
            <GiveToChild storyId={openId} draft={draft} dirty={dirty} nickname={child.nickname} onChanged={() => { reload(); void loadDetail(); }} />
          )}
        </CreatorEditor>
      </div>
    );
  }

  const set = (p: Partial<CreateParentDraftInput>) => setForm((f) => (f ? { ...f, ...p } : f));
  return (
    <div className="pb" style={{ gap: 12 }}>
      <div className="row">
        <p className="sub grow" style={{ margin: 0 }}>Tự viết một câu chuyện cho {child.nickname}: kỷ niệm gia đình, một lời nhắn, hay cách giải thích một chuyện con đang gặp. Không dùng AI tạo truyện.</p>
        <button className="btn btn-p" onClick={() => { setForm({ childProfileId: child.id, title: "", purpose: "free", experienceMode: "reading" }); setError(null); }}><Plus className="ic" />Truyện mới</button>
      </div>
      {form && (
        <div className="st-card">
          <h3>Truyện mới cho {child.nickname}</h3>
          <div className="st-form">
            <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Truyện của gia đình" /></label>
            <label className="field"><span className="lbl">Viết để</span>
              <select className="inp" value={form.purpose} onChange={(e) => set({ purpose: e.target.value as WritingPurpose })}>{Object.entries(PURPOSE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
          <p className="sub" style={{ margin: 0 }}>Truyện tự viết hiện chỉ có chế độ đọc, chưa có giọng đọc.</p>
          <div className="row">
            <button className="btn btn-g" onClick={() => setForm(null)}>Đóng</button>
            <span className="grow" />
            <button className="btn btn-p" disabled={busy} onClick={() => void create()}><PencilLine className="ic" />{busy ? "Đang tạo…" : "Tạo và bắt đầu viết"}</button>
          </div>
        </div>
      )}
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Truyện</th><th>Viết để</th><th>Phiên bản</th><th>Trạng thái</th><th>Cập nhật</th><th /></tr></thead>
          <tbody>
            {list === null && <tr><td colSpan={6} className="sub">Đang tải…</td></tr>}
            {list?.map((d) => (
              <tr key={d.story.storyId}>
                <td><b>{d.story.title || "Truyện chưa đặt tên"}</b></td>
                <td>{PURPOSE[d.purpose as WritingPurpose] ?? d.purpose}</td>
                <td>{d.story.lastVersionNo ? `V${d.story.lastVersionNo}` : "Chưa lưu"}</td>
                <td>{d.isReadOnly ? <span className="pill ok">Đã giao cho con</span> : <span className="pill draft">Đang viết</span>}</td>
                <td>{fmtDate(d.story.updatedAt ?? d.story.createdAt)}</td>
                <td><button className="btn btn-g" onClick={() => setOpenId(d.story.storyId)}>Mở</button></td>
              </tr>
            ))}
            {list?.length === 0 && <tr><td colSpan={6} className="sub">Chưa có truyện tự viết nào cho {child.nickname}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
