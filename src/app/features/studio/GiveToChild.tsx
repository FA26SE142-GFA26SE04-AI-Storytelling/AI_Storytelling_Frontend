"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpenCheck, Check, Gift, ShieldCheck, Undo2 } from "lucide-react";
import { describeParentCode, parentAuthoringService as api } from "@/app/services/parentAuthoringService";
import type { CreatorDraft } from "@/app/types/creator";
import type { ParentCheck, ParentChecklist, ParentContentConfirmation, ParentFamilyConfirmation, ParentOperation, ParentPreparation } from "@/app/types/parentAuthoring";

const CHECKLIST: [keyof ParentChecklist, string][] = [
  ["intendedMeaning", "Truyện nói đúng điều tôi muốn gửi tới con"],
  ["suitableForChild", "Nội dung phù hợp với tuổi của con"],
  ["privacyChecked", "Không có thông tin riêng tư (địa chỉ, số điện thoại, trường lớp…)"],
  ["endingChecked", "Tôi đã đọc lại phần kết"],
];
const NONE: ParentChecklist = { intendedMeaning: false, suitableForChild: false, privacyChecked: false, endingChecked: false };

/** Kết quả mới nhất còn khớp phiên bản hiện tại của một loại bước. */
function latest<T>(ops: ParentOperation[], kind: string): T | null {
  const op = [...ops].reverse().find((o) => o.kind === kind && o.sourceIsCurrent && !o.revokedAt);
  return op ? (op.result as T) : null;
}

/**
 * Bốn bước giao truyện tự viết cho con: kiểm tra → tự xác nhận → chuẩn bị bản đọc (xem trước) → giao.
 * Giao xong truyện bị khoá; thu hồi lần giao cuối mới sửa tiếp được.
 */
export default function GiveToChild({ storyId, draft, dirty, onChanged, nickname }: {
  storyId: number;
  draft: CreatorDraft;
  dirty: boolean;
  /** Gọi sau các bước làm đổi revision (giao, thu hồi) để trình soạn tải lại. */
  onChanged: () => void;
  nickname: string;
}) {
  const [check, setCheck] = useState<ParentCheck | null>(null);
  const [confirmation, setConfirmation] = useState<ParentContentConfirmation | null>(null);
  const [prep, setPrep] = useState<ParentPreparation | null>(null);
  const [grants, setGrants] = useState<ParentFamilyConfirmation[]>([]);
  const [checklist, setChecklist] = useState<ParentChecklist>(NONE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phục hồi tiến trình từ các bước đã làm (sau khi tải lại trang).
  const loadWorkflow = useCallback(async () => {
    const r = await api.workflow(storyId);
    if (!r.ok || !r.data) return;
    const ops = r.data;
    setCheck(latest<ParentCheck>(ops, "Check"));
    setConfirmation(latest<ParentContentConfirmation>(ops, "ContentConfirmation"));
    const p = latest<ParentPreparation>(ops, "Preparation");
    setPrep(p ? (await api.preparation(storyId, p.preparationId)).data ?? p : null);
    setGrants(ops.filter((o) => o.kind === "FamilyConfirmation" && !o.revokedAt).map((o) => o.result as unknown as ParentFamilyConfirmation));
  }, [storyId]);
  // Phiên bản đổi (lưu mới, khôi phục) thì các bước cũ không còn khớp: tải lại.
  useEffect(() => { void loadWorkflow(); }, [loadWorkflow, draft.selectedVersionId, draft.revisionToken]);

  const step = async <T,>(fn: () => Promise<{ ok: boolean; message: string; data: T | null }>, onOk: (d: T) => void) => {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.ok && r.data !== null) onOk(r.data);
    else setError(describeParentCode(r.message));
  };

  const given = grants.length > 0;
  const blocked = dirty || !draft.selectedVersionId;

  if (given) {
    return (
      <div className="st-card">
        <h3><Gift className="ic" /> Đã giao cho {nickname}</h3>
        <p className="sub" style={{ margin: 0 }}>{nickname} đọc được truyện này trong Chế độ của bé. Truyện bị khoá để giữ đúng bản con đang đọc. Muốn sửa, hãy thu hồi rồi giao lại.</p>
        {grants.map((g) => (
          <div key={g.confirmationId} className="row" style={{ gap: 8 }}>
            <span className="grow sub">Giao lúc {new Date(g.confirmedAt).toLocaleString("vi-VN")}</span>
            <button className="btn btn-s" disabled={busy} onClick={() => { if (confirm(`Thu hồi? ${nickname} sẽ không đọc được truyện này nữa.`)) void step(() => api.revoke(storyId, draft, g.confirmationId), () => { setGrants([]); setCheck(null); setConfirmation(null); setPrep(null); onChanged(); }); }}>
              <Undo2 className="ic" />Thu hồi
            </button>
          </div>
        ))}
        {error && <div className="notice err" role="alert">{error}</div>}
      </div>
    );
  }

  return (
    <div className="st-card">
      <h3><Gift className="ic" /> Giao cho {nickname} đọc</h3>
      {blocked && <div className="notice warn">{dirty ? "Lưu phiên bản mới trước khi giao cho con." : "Lưu truyện ít nhất một lần trước khi giao cho con."}</div>}

      <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <b style={{ minWidth: 20 }}>1</b>
        <div className="grow sec" style={{ gap: 6 }}>
          <span>Kiểm tra theo cài đặt an toàn của {nickname}</span>
          {check && (check.canPrepare
            ? <div className="notice ok"><ShieldCheck className="ic" /> Đạt kiểm tra.</div>
            : <div className="notice err"><ul style={{ margin: 0, paddingLeft: 18 }}>{check.errors.map((e) => <li key={e}>{describeParentCode(e)}</li>)}</ul></div>)}
          {check?.warnings.length ? <div className="notice warn"><ul style={{ margin: 0, paddingLeft: 18 }}>{check.warnings.map((w) => <li key={w}>{describeParentCode(w)}</li>)}</ul></div> : null}
          <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || blocked}
            onClick={() => void step(() => api.check(storyId, draft), (d) => { setCheck(d); setConfirmation(null); setPrep(null); })}>{check ? "Kiểm tra lại" : "Kiểm tra"}</button>
        </div>
      </div>

      {check?.canPrepare && (
        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <b style={{ minWidth: 20 }}>2</b>
          <div className="grow sec" style={{ gap: 6 }}>
            <span>Bạn tự xác nhận</span>
            {CHECKLIST.map(([k, label]) => (
              <label key={k} className="row" style={{ gap: 8, fontSize: 13 }}>
                <input type="checkbox" disabled={!!confirmation} checked={confirmation ? true : checklist[k]} onChange={(e) => setChecklist({ ...checklist, [k]: e.target.checked })} />{label}
              </label>
            ))}
            {!confirmation && <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || blocked || !Object.values(checklist).every(Boolean)}
              onClick={() => void step(() => api.confirmContent(storyId, draft, check.checkId, checklist), (d) => { setConfirmation(d); setPrep(null); })}><Check className="ic" />Xác nhận</button>}
          </div>
        </div>
      )}

      {confirmation && (
        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <b style={{ minWidth: 20 }}>3</b>
          <div className="grow sec" style={{ gap: 6 }}>
            <span>Chuẩn bị bản đọc và xem trước như {nickname} thấy</span>
            {!prep && <button className="btn btn-s" style={{ width: "fit-content" }} disabled={busy || blocked}
              onClick={() => void step(() => api.prepare(storyId, draft, confirmation.confirmationId), setPrep)}><BookOpenCheck className="ic" />Chuẩn bị bản đọc</button>}
            {prep && (
              <>
                <div className="st-content" style={{ maxHeight: 260, overflowY: "auto" }}>
                  <b>{prep.title}</b>
                  {prep.segments.map((s, i) => <p key={s.order} style={{ whiteSpace: "pre-wrap" }}><small className="sub">Trang {i + 1}</small><br />{s.text}</p>)}
                </div>
                {!prep.isReady && <div className="notice err">Chưa sẵn sàng: {prep.missingRequirements.map(describeParentCode).join(" ")}</div>}
              </>
            )}
          </div>
        </div>
      )}

      {prep?.isReady && (
        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <b style={{ minWidth: 20 }}>4</b>
          <div className="grow sec" style={{ gap: 6 }}>
            <span>Giao cho {nickname}. Sau khi giao, truyện bị khoá cho tới khi bạn thu hồi.</span>
            <button className="btn btn-p" style={{ width: "fit-content" }} disabled={busy || blocked}
              onClick={() => void step(() => api.confirmFamily(storyId, draft, prep.preparationId), (d) => { setGrants([d]); onChanged(); })}><Gift className="ic" />Giao cho {nickname}</button>
          </div>
        </div>
      )}

      {error && <div className="notice err" role="alert">{error}</div>}
    </div>
  );
}
