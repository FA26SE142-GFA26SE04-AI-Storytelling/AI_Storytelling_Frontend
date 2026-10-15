"use client";

import "./home.css";
import "./dashboard.css";
import "@/app/features/roadmap/roadmap.css";
import { useCallback, useEffect, useState } from "react";
import { Eye, Lock, Sparkles, WandSparkles } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { guardianService } from "@/app/services/guardianService";
import { childProfileService } from "@/app/services/childProfileService";
import { supervisionService } from "@/app/services/supervisionService";
import type { Dashboard, ProgressReport } from "@/app/types/progress";
import type { StoryWish } from "@/app/types/reading";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import type { PermissionRequest } from "@/app/types/supervision";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";
import HeroPond from "@/app/components/brand/HeroPond";
import { ageLabel } from "@/app/lib/storyView";
import { BADGES } from "@/app/lib/readingRules";
import { childStatus, fmtDate, PERMISSIONS } from "@/app/lib/guardian";
import { useMyRole } from "@/app/features/children/useMyRole";
import { useChildRefs } from "@/app/features/roadmap/AddToRoadmapDialog";
import HoldPanel from "@/app/features/roadmap/HoldPanel";
import { useRiseIn } from "@/app/lib/motion";
import WishItem from "./WishItem";
import CompletionCard from "./CompletionCard";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Khối bị ẩn khi thiếu quyền (BR-4.D1): hiện thông báo + nút xin quyền. */
function Locked({ title, go }: { title: string; go: WorkspaceProps["go"] }) {
  return (
    <div className="dash-block locked">
      <h3>{title}</h3>
      <p className="sub"><Lock size={12} /> Bạn chưa có quyền xem mục này.</p>
      <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => go("children")}>Xin quyền</button>
    </div>
  );
}

type AllRow = { id: number; nickname: string; status: string; dash: Dashboard | null };

/** Luồng 4 Bước 4.3c — Dashboard tổng quan của phụ huynh, đầu trang là "Con của tôi" (Luồng 1 Bước 1.9). */
export default function HomeWorkspace({ go, onKid }: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids, child, selectChild, stories, reviewQueue, error } = useWorkspaceData();
  const role = useMyRole(child);
  const refs = useChildRefs();
  const [tab, setTab] = useState<"one" | "all">("one");
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [wishes, setWishes] = useState<(StoryWish & { label: string })[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [allRows, setAllRows] = useState<AllRow[]>([]);
  const [openReport, setOpenReport] = useState<number | null>(null);
  const rootRef = useRiseIn<HTMLElement>(".dash-block", [child?.id, tab, dash ? 1 : 0]);

  const load = useCallback(async () => {
    if (!child) return;
    const [d, w, r, q, rels] = await Promise.all([
      guardianService.dashboard(child.id), guardianService.wishes(child.id), guardianService.reports(child.id),
      childProfileService.getTokenQuotaForChild(child.id), supervisionService.listSupervisors(child.id),
    ]);
    setDash(d.data);
    setWishes((w.data ?? []).filter((x) => x.status === "pending"));
    setReports(r.data ?? []);
    setQuota(q.success ? q.data : null);
    // Yêu cầu cấp quyền chỉ Owner xử lý (Luồng 1 Bước G).
    const others = (rels.data ?? []).filter((x) => x.supervisorRole !== "Owner");
    const reqs = await Promise.all(others.map((x) => supervisionService.listPermissionRequests(x.id)));
    setRequests(reqs.flatMap((x) => x.data ?? []).filter((x) => x.status === "Pending"));
  }, [child]);
  useEffect(() => { setDash(null); void load(); }, [load]);

  useEffect(() => {
    if (tab !== "all") return;
    void Promise.all(kids.map(async (k) => ({ id: k.id, nickname: k.nickname, status: k.status, dash: (await guardianService.dashboard(k.id)).data }))).then(setAllRows);
  }, [tab, kids]);

  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Tạo hồ sơ bé để bắt đầu tạo truyện, hoặc nhập mã mời nếu bố/mẹ của bé đã mời bạn.</span><button className="btn btn-p" onClick={() => go("children")}>Thêm hồ sơ bé</button></div></div>
      </section>
    );
  }

  const can = (p: (typeof PERMISSIONS)[number]["id"]) => !!role?.can(p);
  const lessonOf = (storyId: number) => stories.find((s) => s.id === storyId)?.raw.moralLesson ?? null;
  const maxMin = Math.max(1, ...(dash?.minutesByDay.map((d) => d.minutes) ?? [0]));
  const unseen = dash?.completions.filter((c) => !c.seen) ?? [];
  const actionCount = (can("ApproveStory") ? reviewQueue.length + wishes.length : 0) + (dash?.holdCase?.needsAttention ? 1 : 0) + (role?.isOwner ? requests.length : 0) + unseen.length;
  const permLabel = (p: string) => PERMISSIONS.find((x) => x.id === p)?.label ?? p;

  return (
    <section ref={rootRef} className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane dash">
        <div className="tabs">
          <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>Tất cả các con</button>
          {kids.map((k) => <button key={k.id} className={tab === "one" && k.id === child.id ? "on" : ""} onClick={() => { selectChild(k.id); setTab("one"); }}>{k.nickname}</button>)}
        </div>
        {error && <div className="err-banner" role="alert">{error}</div>}

        <div className="dash-body">
          <header className="hero">
            <div>
              <h1 className="display home-h1">Chào {user?.fullName?.split(" ").slice(-1)[0] || "bạn"}</h1>
              <p className="sub" style={{ fontSize: 14, marginTop: 4 }}>
                {tab === "all" ? `Bạn đang theo dõi ${kids.length} bé.` : `${child.nickname} (${ageLabel(child.ageBand)}) · ${actionCount ? `${actionCount} việc cần bạn xử lý` : "Không có việc gì cần xử lý"}`}
              </p>
            </div>
            <HeroPond />
          </header>

          {tab === "all" ? (
            <div className="dash-block">
              <h3>Tóm tắt các con</h3>
              {allRows.map((r) => (
                <button key={r.id} className="all-row" onClick={() => { selectChild(r.id); setTab("one"); }}>
                  <b>{r.nickname}</b>
                  <span className={`pill ${childStatus(r.status).tone}`}>{childStatus(r.status).label}</span>
                  <span className="grow sub">{r.dash ? `Tuần này đọc ${r.dash.storiesThisWeek} truyện · chuỗi ${r.dash.streakDays} ngày · ${r.dash.pendingWishes} điều ước chờ` : "…"}</span>
                  {r.dash?.holdCase?.status === "hold_mode" && <span className="pill wait">Tạm khoá thư viện</span>}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="continue">
                <button className="cont" onClick={onKid}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg,#2FA866,#6FD39A 60%,#D2F5E0)" }} />
                  <span className="grow"><small>Cho {child.nickname} đọc</small><b className="display">{dash?.roadmap.open?.title ?? "Mở thư viện của bé"}</b><small>{dash?.roadmap.open ? "Truyện đang mở trong lộ trình" : "Bé tự chọn truyện"}</small></span>
                  <span className="go"><Eye className="ic" /></span>
                </button>
                <button className="cont" onClick={() => go("studio")}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg,#E0568A,#F59BB6 60%,#FFD6E2)" }} />
                  <span className="grow"><small>Bắt đầu mới</small><b className="display">Tạo truyện mới</b><small>Mô tả ý tưởng, AI sẽ viết cùng bạn</small></span>
                  <span className="go"><WandSparkles className="ic" /></span>
                </button>
              </div>

              <div className="dash-grid">
                {/* Cần xử lý */}
                <div className="dash-block wide">
                  <h3>Cần xử lý <span className="pill wait">{actionCount}</span></h3>
                  {actionCount === 0 && <p className="sub">Không có việc gì cần xử lý.</p>}
                  {can("ApproveStory") && reviewQueue.map((s) => (
                    <button key={s.id} className="mini-item" onClick={() => go("review")}><span className="cover-sm" style={{ background: s.gradient }} /><span className="grow" style={{ textAlign: "left" }}><b>{s.title}</b><small>Truyện chờ duyệt</small></span></button>
                  ))}
                  {can("ApproveStory") && wishes.map((w) => <WishItem key={w.id} wish={w} childRef={refs.find((r) => r.id === child.id)} stories={stories} go={go} onChanged={() => void load()} />)}
                  {dash?.holdCase?.needsAttention && <HoldPanel child={child} role={role} onChanged={() => void load()} />}
                  {role?.isOwner && requests.map((q) => (
                    <button key={q.id} className="mini-item" onClick={() => go("children")}><span className="grow" style={{ textAlign: "left" }}><b>Người giám sát #{q.requesterUserId} xin quyền {q.permissions.map(permLabel).join(", ")}</b><small>Mở Hồ sơ bé → Người giám sát để xử lý</small></span></button>
                  ))}
                  {can("ViewProgress") && unseen.length > 0 && <p className="sub">{unseen.length} câu chuyện con vừa đọc xong — xem bên dưới để trò chuyện với con.</p>}
                </div>

                {/* Con vừa đọc xong */}
                {can("ViewProgress") ? (dash?.completions.length ?? 0) > 0 && (
                  <div className="dash-block wide">
                    <h3>Con vừa đọc xong</h3>
                    <div className="done-grid">
                      {dash!.completions.map((c) => <CompletionCard key={c.id} item={c} nickname={child.nickname} lesson={lessonOf(c.storyId)} showResults={can("ViewResults")}
                        onSeen={() => void guardianService.markCompletionSeen(child.id, c.id).then(load)} />)}
                    </div>
                  </div>
                ) : null}

                {/* Tiến độ */}
                {can("ViewProgress") ? (
                  <div className="dash-block">
                    <h3>Tiến độ</h3>
                    <div className="stats3">
                      <div><b className="display">{dash?.storiesThisWeek ?? "–"}</b><small>truyện tuần này</small></div>
                      <div><b className="display">{dash?.streakDays ?? "–"}</b><small>ngày đọc liên tiếp</small></div>
                      <div><b className="display">{dash?.activitiesCompleted ?? "–"}</b><small>hoạt động đã làm</small></div>
                    </div>
                    <small className="sub">Phút đọc 7 ngày qua</small>
                    <div className="bars">
                      {dash?.minutesByDay.map((d, i) => (
                        <div key={d.date} className={`bar${i === 6 ? " today" : ""}`}>
                          <em>{d.minutes}</em><i style={{ height: `${(d.minutes / maxMin) * 100}%`, minHeight: d.minutes ? 4 : 2 }} /><small>{DOW[new Date(`${d.date}T00:00:00`).getDay()]}</small>
                        </div>
                      ))}
                    </div>
                    {(dash?.newBadges.length ?? 0) > 0 && <p className="sub">Huy hiệu mới: {dash!.newBadges.map((b) => `${BADGES[b.badgeCode]?.emoji ?? ""} ${BADGES[b.badgeCode]?.label ?? b.badgeCode}`).join(", ")}</p>}
                    <div className="dash-roadmap">
                      <b>Lộ trình của con</b>
                      {dash?.roadmap.empty
                        ? <span className="sub">{dash.roadmap.total ? `${child.nickname} đã đọc hết truyện bạn chọn.` : "Chưa có truyện nào."} Thêm truyện hoặc bộ truyện mẫu nhé.</span>
                        : <span className="sub">Đang mở: {dash?.roadmap.open?.title ?? "—"} · {dash?.roadmap.done}/{dash?.roadmap.total} đã đọc{dash?.roadmap.overdue ? " · đã qua ngày mong đọc xong" : ""}</span>}
                      <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => go("roadmap")}>Mở lộ trình</button>
                    </div>
                    {!dash?.holdCase?.needsAttention && <HoldPanel child={child} role={role} compact onChanged={() => void load()} />}
                  </div>
                ) : <Locked title="Tiến độ" go={go} />}

                {/* Kết quả học tập */}
                {can("ViewResults") ? (
                  <div className="dash-block">
                    <h3>Kết quả học tập</h3>
                    <small className="sub">Điểm câu đố 5 lần gần nhất</small>
                    {dash?.quizTrend.length ? (
                      <div className="trend">
                        {dash.quizTrend.map((q, i) => (
                          <div key={i} className="trend-bar" title={`${q.title}: ${q.percent}%`}>
                            <em>{q.percent}%</em><i className={q.percent < 70 ? "low" : ""} style={{ height: `${Math.max(4, q.percent)}%` }} />
                          </div>
                        ))}
                      </div>
                    ) : <p className="sub">Chưa có kết quả câu đố.</p>}
                    <p className="sub">Đã lưu {dash?.wordsCollected ?? 0} từ vào sổ tay.</p>
                  </div>
                ) : <Locked title="Kết quả học tập" go={go} />}

                {/* Sở thích + Hoạt động gần đây */}
                {can("ViewProgress") ? (
                  <div className="dash-block">
                    <h3>Sở thích</h3>
                    {dash?.topGenres.length ? <div className="chips">{dash.topGenres.map((g) => <span key={g.genre} className="chip">{g.genre} · {g.count}</span>)}</div> : <p className="sub">Chưa đủ dữ liệu (chỉ tính truyện bé tự chọn).</p>}
                    <small className="sub">Điều ước gần đây</small>
                    {dash?.recentWishes.length ? dash.recentWishes.map((w) => <p key={w.id} className="sub" style={{ margin: 0 }}>✨ {w.label}</p>) : <p className="sub">Chưa có điều ước nào.</p>}
                    <h3 style={{ marginTop: 10 }}>Hoạt động gần đây</h3>
                    {dash?.activity.length ? <ul className="activity">{dash.activity.map((a, i) => <li key={i}><span>{a.text}</span><small>{fmtDate(a.at)}</small></li>)}</ul> : <p className="sub">Chưa có hoạt động.</p>}
                  </div>
                ) : <Locked title="Sở thích và hoạt động" go={go} />}

                {/* Tài khoản */}
                <div className="dash-block">
                  <h3>Tài khoản</h3>
                  {quota ? (quota.isUnlimited ? <p className="sub">Không giới hạn lượt tạo truyện.</p> : <p className="sub">Đã dùng {quota.quotaUsed ?? 0}/{quota.quotaLimit ?? "?"} lượt tạo truyện, còn {quota.remaining ?? 0} lượt{quota.periodEnd ? ` (làm mới ${fmtDate(quota.periodEnd)})` : ""}.</p>) : <p className="sub">Chưa tải được số lượt tạo truyện.</p>}
                  <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => go("studio")}><Sparkles className="ic" />Tạo truyện</button>
                </div>

                {/* Báo cáo định kỳ */}
                {can("ReceiveReport") ? (
                  <div className="dash-block wide">
                    <h3>Báo cáo tuần</h3>
                    {reports.length === 0 && <p className="sub">Chưa có báo cáo.</p>}
                    {reports.map((r) => (
                      <div key={r.id} className="report-row">
                        <button className="row" style={{ width: "100%" }} onClick={() => setOpenReport(openReport === r.id ? null : r.id)}>
                          <b className="grow" style={{ textAlign: "left" }}>Tuần {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</b>
                          <span className="sub">{r.storiesRead} truyện · {r.minutesRead} phút</span>
                        </button>
                        {openReport === r.id && (
                          <div className="kv" style={{ marginTop: 8 }}>
                            <div><small>Truyện đã đọc</small><b>{r.storiesRead}</b></div>
                            <div><small>Thời gian đọc</small><b>{r.minutesRead} phút</b></div>
                            <div><small>Điểm câu đố trung bình</small><b>{r.quizAverage !== null ? `${r.quizAverage}%` : "—"}</b></div>
                            <div><small>Chủ đề yêu thích</small><b>{r.favoriteTopics.join(", ") || "—"}</b></div>
                            <div><small>Chuỗi ngày đọc</small><b>{r.streakDays}</b></div>
                            <div><small>Huy hiệu mới</small><b>{r.newBadges.join(", ") || "—"}</b></div>
                            <div><small>Truyện con thích nhất</small><b>{r.favoriteStory ?? "—"}</b></div>
                            <div><small>Điều ước đã gửi / thành truyện</small><b>{r.wishesSubmitted} / {r.wishesFulfilled}</b></div>
                            <div><small>Tạm khoá thư viện</small><b>{r.holdMode ? "Có" : "Không"}</b></div>
                            <div><small>Câu hỏi thảo luận chưa xem</small><b>{r.unseenDiscussions}</b></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <Locked title="Báo cáo tuần" go={go} />}
              </div>
              {guardianService.isLocal() && <p className="sub" style={{ textAlign: "center" }}>Số liệu đang tính từ các lần bé đọc trên trình duyệt này (máy chủ chưa có chức năng theo dõi tiến độ).</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
