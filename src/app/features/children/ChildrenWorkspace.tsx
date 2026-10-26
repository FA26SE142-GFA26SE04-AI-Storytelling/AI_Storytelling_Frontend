"use client";

import "./children.css";
import { useEffect, useState } from "react";
import { Plus, RotateCcw, Ticket } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { supervisionService } from "@/app/services/supervisionService";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";
import { avatarOf, childStatus } from "@/app/lib/guardian";
import { ageLabel } from "@/app/lib/storyView";
import { useRiseIn } from "@/app/lib/motion";
import CreateChildWizard from "./CreateChildWizard";
import ProfileTab from "./ProfileTab";
import LearningTab from "./LearningTab";
import SupervisorsTab from "./SupervisorsTab";
import AccessTab from "./AccessTab";
import JoinInvitation from "./JoinInvitation";
import RestoreArchived from './RestoreArchived';
import { childProfileService } from "@/app/services/childProfileService";
import { forgetArchived, listArchived, rememberArchived, type ArchivedChild } from "@/app/lib/archivedChildren";

type Tab = "profile" | "learning" | "supervisors" | "access";
const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Hồ sơ" },
  { id: "learning", label: "Học tập" },
  { id: "supervisors", label: "Người giám sát" },
  { id: "access", label: "Bé đăng nhập" },
];
type Role = { isOwner: boolean; perms: string[] };

/** Luồng 1 — khu quản lý hồ sơ bé ("Con của tôi", Bước 1.9). */
export default function ChildrenWorkspace({ go }: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids, child, selectChild, reloadChildren } = useWorkspaceData();
  const [mode, setMode] = useState<"view" | "create" | "join">(kids.length ? "view" : "create");
  const [tab, setTab] = useState<Tab>("profile");
  const [role, setRole] = useState<Role | null>(null);
  const listRef = useRiseIn<HTMLDivElement>(".kid-item", [kids.length]);
  const meId = user?.id ?? -1;
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

  // Vai trò và quyền của mình với bé đang chọn — kiểm tra lại mỗi lần đổi bé.
  useEffect(() => {
    if (!child) { setRole(null); return; }
    let alive = true;
    setRole(null);
    void supervisionService.listSupervisors(child.id).then(async (r) => {
      const mine = r.data?.find((x) => x.supervisorUserId === meId);
      const owner = mine ? mine.supervisorRole === "Owner" : child.ownerUserId === meId;
      const perms = mine && !owner ? (await supervisionService.listPermissions(mine.id)).data ?? [] : [];
      if (alive) setRole({ isOwner: owner, perms });
    });
    return () => { alive = false; };
  }, [child, meId]);

  const open = async (id: number, nextTab: Tab = "profile") => {
    await reloadChildren(id);
    setMode("view");
    setTab(nextTab);
  };

  const canEditLearning = !!role && (role.isOwner || role.perms.includes("ApproveReadingLevel"));
  const canManageAccess = !!role && (role.isOwner || role.perms.includes("ManageSafetySettings"));

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "250px 1fr" }}>
      <div className="pane">
        <div className="ph"><span>Con của tôi</span><div className="act"><span className="pill draft">{kids.length} bé</span></div></div>
        <div ref={listRef} className="pb" style={{ gap: 6 }}>
          <RestoreArchived onRestored={id=>void restored(id)} />
          {kids.map((k) => {
            const st = childStatus(k.status);
            return (
              <button key={k.id} className={`kid-item${mode === "view" && child?.id === k.id ? " on" : ""}`} onClick={() => { selectChild(k.id); setMode("view"); }}>
                <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
                <span className="grow"><b>{k.nickname}</b><small>{ageLabel(k.ageBand)}</small></span>
                <span className={`pill ${st.tone}`}>{st.label}</span>
              </button>
            );
          })}
          <button className={`btn btn-p btn-c${mode === "create" ? " on" : ""}`} style={{ marginTop: 8 }} onClick={() => setMode("create")}><Plus className="ic" />Thêm bé</button>
          <button className="btn btn-s btn-c" onClick={() => setMode("join")}><Ticket className="ic" />Nhập mã mời</button>
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
        {mode === "create" && (
          <>
            <div className="ph"><span>Thêm hồ sơ bé</span></div>
            <CreateChildWizard onDone={(id) => void open(id)} onCancel={() => setMode("view")} />
          </>
        )}
        {mode === "join" && <div className="pb"><JoinInvitation onJoined={(id) => void open(id, "supervisors")} onCancel={() => setMode("view")} /></div>}
        {mode === "view" && !child && (
          <div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Thêm hồ sơ bé, hoặc nhập mã mời nếu bố/mẹ của bé đã mời bạn.</span></div>
        )}
        {mode === "view" && child && (
          <>
            <div className="tabs">
              {TABS.map((t) => <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>)}
              <span style={{ marginLeft: "auto", padding: "0 12px" }} className="sub">{child.nickname} · {role ? (role.isOwner ? "Bạn là người quản lý chính" : "Bạn là người giám sát") : "…"}</span>
            </div>
            <div className="pb children-body">
              {!role ? <p className="sub">Đang tải…</p> : (
                <>
                  {tab === "profile" && <ProfileTab key={child.id} child={child} isOwner={role.isOwner} onChanged={() => void reloadChildren(child.id)} onArchived={() => { rememberArchived(meId, child); setArchived(listArchived(meId)); void reloadChildren(); }} onTab={setTab} go={go} />}
                  {tab === "learning" && <LearningTab key={child.id} child={child} canEdit={canEditLearning} onSaved={() => void reloadChildren(child.id)} />}
                  {tab === "supervisors" && <SupervisorsTab key={child.id} child={child} meId={meId} onLeft={() => void reloadChildren()} />}
                  {tab === "access" && (canManageAccess
                    ? <AccessTab key={child.id} child={child} />
                    : <p className="sub">Chỉ người quản lý chính hoặc người có quyền &quot;Sửa cài đặt an toàn&quot; mới quản lý được cách bé đăng nhập.</p>)}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
