"use client";

import "./children.css";
import { useEffect, useRef, useState } from "react";
import { Lock, Plus, RotateCcw, UserCheck } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";
import { avatarOf, childStatus } from "@/app/lib/guardian";
import { ageLabel } from "@/app/lib/storyView";
import { useRiseIn } from "@/app/lib/motion";
import CreateChildWizard from "./CreateChildWizard";
import { clearChildIntent, markChildCreate, readChildDraft, wantsChildCreate } from "./childrenIntent";
import ProfileTab from "./ProfileTab";
import LearningTab from "./LearningTab";
import SafetyTab from "@/app/features/safety/SafetyWorkspace";
import AccessTab from "./AccessTab";
import ReadingSlotsDialog from "./ReadingSlotsDialog";
import { childProfileService } from "@/app/services/childProfileService";
import { forgetArchived, listArchived, rememberArchived, type ArchivedChild } from "@/app/lib/archivedChildren";
import type { ReadingSlotsDto } from "@/app/types/readingSlots";

type Tab = "profile" | "learning" | "safety" | "access";
const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Hồ sơ" },
  { id: "learning", label: "Học tập" },
  { id: "safety", label: "An toàn" },
  { id: "access", label: "QR đăng nhập" },
];

/** Luồng 1 — khu quản lý hồ sơ bé ("Con của tôi", Bước 1.9). */
export default function ChildrenWorkspace(_props: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids, reloadChildren } = useWorkspaceData();
  const [slots, setSlots] = useState<ReadingSlotsDto | null>(null);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const slotsAbortRef = useRef<AbortController | null>(null);

  const reloadSlots = async () => {
    slotsAbortRef.current?.abort();
    const ctrl = new AbortController();
    slotsAbortRef.current = ctrl;
    try {
      const r = await childProfileService.getReadingSlots(ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (r.success && r.data) {
        setSlots(r.data);
      }
    } catch {
      // bỏ qua lỗi
    }
  };

  useEffect(() => {
    void reloadSlots();
    return () => {
      slotsAbortRef.current?.abort();
    };
  }, []);

  // Mở từ nút "+ Thêm bé" ở màn khác, hoặc tải lại trang khi đang ở form tạo hồ sơ, thì vào thẳng form.
  const [mode, setMode] = useState<"view" | "create">(() => (wantsChildCreate() || !kids.length ? "create" : "view"));
  useEffect(() => { if (mode === "create") markChildCreate(); else clearChildIntent(); }, [mode]);
  const [tab, setTab] = useState<Tab>("profile");
  const listRef = useRiseIn<HTMLDivElement>(".kid-item", [kids.length]);
  const meId = user?.id ?? -1;
  // Bé chọn ở đây chỉ để xem và sửa trong trang Hồ sơ bé, không đổi bé của các trang khác.
  const sortedKids = kids;
  const [selId, setSelId] = useState<number | null>(null);
  const child = kids.find((k) => k.id === selId) ?? sortedKids[0] ?? null;
  const [archived, setArchived] = useState<ArchivedChild[]>([]);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);
  useEffect(() => { setArchived(listArchived(meId)); }, [meId]);
  const restored = async (id: number) => {
    forgetArchived(meId, id);
    setArchived(listArchived(meId));
    await open(id);
  };
  const restore = async (c: ArchivedChild) => {
    const r = await childProfileService.restoreChildProfile(c.id);
    if (!r.success) { setRestoreNote(r.message); return; }
    setRestoreNote(`Đã khôi phục hồ sơ ${c.nickname}. Hãy tạo mã đăng nhập nhanh mới cho bé.`);
    await restored(c.id);
  };

  const open = async (id: number, nextTab: Tab = "profile") => {
    // Rời form tạo trước khi tải lại danh sách: hồ sơ mới làm đủ số của gói thì không chớp màn "đã đủ hồ sơ".
    setMode("view");
    await reloadChildren();
    setSelId(id);
    setTab(nextTab);
  };

  // Mỗi bé chỉ còn một người quản lý (chủ hồ sơ), nên chủ hồ sơ làm được mọi việc.
  const isOwner = !!child && child.ownerUserId === meId;

  // Giống backend: hồ sơ Nháp / Đang hoạt động / Tạm ngưng của chính mình chiếm chỗ trong số hồ sơ tối đa của gói
  // (reading-slots trả về đúng số đó). Bản nháp đã tạo hồ sơ trên server thì vẫn cho mở lại để làm nốt.
  const occupied = kids.filter((k) => k.ownerUserId === meId && ["Draft", "Active", "Suspended"].includes(k.status)).length;
  const draftHasProfile = readChildDraft(meId, Number.MAX_SAFE_INTEGER)?.createdId != null;
  const atLimit = !!slots && occupied >= slots.slots && !draftHasProfile;

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "250px 1fr", ...(slots?.isOverLimit ? { gridTemplateRows: "auto minmax(0, 1fr)" } : {}) }}>
      {slots?.isOverLimit && (
        <div className="reading-slot-banner" role="status" style={{ gridColumn: "1 / -1" }}>
          <span>Gói hiện tại chỉ cho {slots.slots} bé đọc truyện.</span>
          <button className="btn btn-p" onClick={() => setSlotsOpen(true)}>
            <UserCheck className="ic" />Chọn bé được đọc
          </button>
        </div>
      )}
      <div className="pane">
        <div ref={listRef} className="pb" style={{ gap: 6 }}>
          {sortedKids.map((k) => {
            const st = childStatus(k.status);
            const slot = slots?.profiles.find((p) => p.childProfileId === k.id);
            return (
              <button key={k.id} className={`kid-item${mode === "view" && child?.id === k.id ? " on" : ""}`} onClick={() => { setSelId(k.id); setMode("view"); }}>
                <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
                <span className="grow kid-item-text">
                  <b title={k.nickname}>{k.nickname}</b>
                  <span className="kid-item-meta">
                    <small>{ageLabel(k.ageBand)}</small>
                    {slot && !slot.canRead ? (
                      <span className="reading-slot-lock" title="Bé đang chỉ xem, chưa được đọc truyện theo gói hiện tại">
                        <Lock className="ic" />Chỉ xem
                      </span>
                    ) : (
                      <span className={`pill ${st.tone}`}>{st.label}</span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
          <button className={`btn btn-p btn-c${mode === "create" ? " on" : ""}`} style={{ marginTop: 8 }} disabled={atLimit} title={atLimit ? "Đã đủ số hồ sơ của gói hiện tại" : undefined} onClick={() => setMode("create")}><Plus className="ic" />Thêm bé</button>
          {atLimit && slots && <div className="notice warn sec" role="status" data-inline-notice style={{ gap: 8 }}>
            <span>Gói hiện tại cho tối đa {slots.slots} hồ sơ bé. Nâng cấp gói để thêm bé.</span>
            <a className="btn btn-s" href="#account-payment">Nâng cấp gói</a>
          </div>}
          {archived.length > 0 && <div className="sec" style={{ gap: 4, marginTop: 12 }}>
            <small className="sub">Vừa lưu trữ</small>
            {archived.map(c => <div key={c.id} className="row" style={{ gap: 6 }}>
              <span className="grow">{c.nickname}</span>
              <button className="btn btn-g" onClick={() => void restore(c)}><RotateCcw className="ic" />Khôi phục</button>
            </div>)}
          </div>}
          {restoreNote && <div className="notice warn" role="status">{restoreNote}</div>}
        </div>
      </div>

      <div className="pane children-main">
        {mode === "create" && atLimit && (
          <div className="empty">
            <Frog size={110} mood="think" />
            <b className="display">Đã đủ số hồ sơ bé của gói</b>
            <span>Gói hiện tại cho tối đa {slots?.slots} hồ sơ bé. Nâng cấp gói để thêm bé; các thông tin bạn đã điền vẫn được giữ.</span>
            <div className="row" style={{ gap: 8, marginTop: 8 }}>
              <button type="button" className="btn btn-g" onClick={() => setMode("view")}>Về danh sách</button>
              <a className="btn btn-p" href="#account-payment">Nâng cấp gói</a>
            </div>
          </div>
        )}
        {mode === "create" && !atLimit && (
          <CreateChildWizard onDone={(id) => void open(id)} onCancel={() => setMode("view")} />
        )}
        {mode === "view" && !child && (
          <div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Thêm hồ sơ để bắt đầu.</span></div>
        )}
        {mode === "view" && child && (
          <>
            <div className="tabs children-tabs" style={{ "--i": Math.max(0, TABS.findIndex((x) => x.id === tab)), "--n": TABS.length } as React.CSSProperties}>
              {TABS.map((t) => <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
            </div>
            <div className="pb children-body">
              <div key={`${tab}:${child.id}`} className="tab-pane">
                  {tab === "profile" && <ProfileTab key={child.id} child={child} isOwner={isOwner} onChanged={() => void reloadChildren()} onArchived={() => { rememberArchived(meId, child); setArchived(listArchived(meId)); void reloadChildren(); }} onTab={setTab} />}
                  {tab === "learning" && <LearningTab key={child.id} child={child} canEdit={isOwner} onSaved={() => void reloadChildren()} />}
                  {tab === "safety" && <SafetyTab key={child.id} child={child} />}
                  {tab === "access" && <AccessTab key={child.id} child={child} />}
              </div>
            </div>
          </>
        )}
      </div>

      {slotsOpen && slots && (
        <ReadingSlotsDialog
          slots={slots}
          onClose={() => setSlotsOpen(false)}
          onSaved={async () => {
            setSlotsOpen(false);
            await Promise.all([reloadSlots(), reloadChildren()]);
          }}
        />
      )}
    </section>
  );
}
