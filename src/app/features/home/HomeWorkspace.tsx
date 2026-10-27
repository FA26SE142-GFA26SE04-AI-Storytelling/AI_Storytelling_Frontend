"use client";

import "./home.css";
import "./dashboard.css";
import "@/app/features/roadmap/roadmap.css";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, Lock, WandSparkles } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { guardianService } from "@/app/services/guardianService";
import { childProfileService } from "@/app/services/childProfileService";
import { supervisionService } from "@/app/services/supervisionService";
import { adaptiveService } from "@/app/services/adaptiveService";
import type { Recommendation } from "@/app/types/adaptive";
import type { Dashboard, ProgressReport } from "@/app/types/progress";
import type { StoryWish } from "@/app/types/reading";
import type { TokenQuotaStatus } from "@/app/types/childProfile";
import type { PermissionRequest } from "@/app/types/supervision";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import Frog from "@/app/components/brand/Frog";
import { BADGES } from "@/app/lib/readingRules";
import { fmtDate, PERMISSIONS } from "@/app/lib/guardian";
import { useMyRole } from "@/app/features/children/useMyRole";
import { useChildRefs } from "@/app/features/roadmap/AddToRoadmapDialog";
import HoldPanel from "@/app/features/roadmap/HoldPanel";
import { useRiseIn } from "@/app/lib/motion";
import RecommendationCard from "@/app/features/adaptive/RecommendationCard";
import WishItem from "./WishItem";
import SupervisionTodos, { useSupervisionTodos } from "./SupervisionTodos";
import CompletionCard from "./CompletionCard";
import InProgressStories, { needsYouCount } from "./InProgressStories";
import ChildCard from "./ChildCard";
import AccountStats from "./AccountStats";
import { openChildCreate } from "@/app/features/children/childrenIntent";

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

/** Luồng 4 Bước 4.3c — Dashboard tổng quan của phụ huynh, đầu trang là "Con của tôi" (Luồng 1 Bước 1.9). */
export default function HomeWorkspace({ go }: WorkspaceProps) {
  const { user } = useAuth();
  const { children: kids, child, selectChild, stories, reviewQueue, error, reloadChildren } = useWorkspaceData();
  const role = useMyRole(child);
  const refs = useChildRefs();
  const [dash, setDash] = useState<Dashboard | null>(null);
  // Backend chưa có API dashboard / báo cáo tuần: ẩn hẳn các khối đó thay vì hiện "—" hay thông báo lỗi kỹ thuật.
  const [dashOk, setDashOk] = useState(false);
  const [reportsOk, setReportsOk] = useState(false);
  const [wishes, setWishes] = useState<(StoryWish & { label: string })[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [quota, setQuota] = useState<TokenQuotaStatus | null>(null);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const todos = useSupervisionTodos(child, user?.id ?? -1);
  const [openReport, setOpenReport] = useState<number | null>(null);
  const rootRef = useRiseIn<HTMLElement>(".dash-block", [child?.id, dash ? 1 : 0]);

  const load = useCallback(async () => {
    if (!child) return;
    const [d, w, r, q, rels, rc] = await Promise.all([
      guardianService.dashboard(child.id), guardianService.wishes(child.id), guardianService.reports(child.id),
      childProfileService.getTokenQuotaForChild(child.id), supervisionService.listSupervisors(child.id),
      // Luồng 6 Bước 6.5 — hàng đợi đề xuất chung của bé, tải lại mỗi lần mở Dashboard.
      child.status === "Active" ? adaptiveService.recommendations(child.id) : Promise.resolve({ data: [] as Recommendation[] }),
    ]);
    setDash(d.data);
    setDashOk(d.success && !!d.data);
    setReportsOk(r.success);
    setRecs(rc.data ?? []);
    setWishes((w.data ?? []).filter((x) => x.status === "pending"));
    setReports(r.data ?? []);
    setQuota(q.success ? q.data : null);
    // Yêu cầu cấp quyền chỉ Owner xử lý (Luồng 1 Bước G).
    const others = (rels.data ?? []).filter((x) => x.supervisorRole !== "Owner");
    const reqs = await Promise.all(others.map((x) => supervisionService.listPermissionRequests(x.id)));
    setRequests(reqs.flatMap((x) => x.data ?? []).filter((x) => x.status === "Pending"));
  }, [child]);
  useEffect(() => { setDash(null); void load(); }, [load]);

  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty"><Frog size={110} mood="think" /><b className="display">Chưa có hồ sơ bé</b><span>Tạo hồ sơ bé để bắt đầu tạo truyện, hoặc nhập mã mời nếu bố/mẹ của bé đã mời bạn.</span><button className="btn btn-p" onClick={() => openChildCreate(go)}>Thêm hồ sơ bé</button></div></div>
      </section>
    );
  }

  const can = (p: (typeof PERMISSIONS)[number]["id"]) => !!role?.can(p);
  const lessonOf = (storyId: number) => stories.find((s) => s.id === storyId)?.raw.moralLesson ?? null;
  const maxMin = Math.max(1, ...(dash?.minutesByDay.map((d) => d.minutes) ?? [0]));
  const unseen = dash?.completions.filter((c) => !c.seen) ?? [];
  // Đề xuất hiện cho mọi người giám sát hợp lệ; nhãn quyền tính trên thẻ (Bước 6.5). Đề xuất vừa quyết định giữ lại 3 ngày để xem kết quả.
  const awaitingRecs = recs.filter((r) => r.status === "awaiting_review");
  const recentRecs = recs.filter((r) => r.status !== "awaiting_review" && r.status !== "stale" && r.decidedAt && Date.now() - Date.parse(r.decidedAt) < 3 * 86_400_000);
  const actionCount = (can("ApproveStory") ? reviewQueue.length + wishes.length : 0) + needsYouCount(stories) + (dash?.holdCase?.needsAttention ? 1 : 0) + (role?.isOwner ? requests.length : 0) + unseen.length + awaitingRecs.length + todos.count;
  const permLabel = (p: string) => PERMISSIONS.find((x) => x.id === p)?.label ?? p;

  return (
    <section ref={rootRef} className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
      <div className="pane dash">
        {error && <div className="err-banner" role="alert">{error}</div>}

        <div className="dash-body">
          <h1 className="sr-only">Tổng quan</h1>

          {/* Tất cả các con, mỗi bé một thẻ gọn. Bấm thẻ để mở hồ sơ của bé. */}
          <section className="kc-row" aria-label="Các con">
            {kids.map((k) => (
              <ChildCard key={k.id} child={k} onOpenProfile={() => { selectChild(k.id); go("children"); }} />
            ))}
          </section>

            <>
              <div className="continue">
                {/* Hai lối tắt: Thư viện truyện và Studio tạo truyện */}
                <button className="cont" onClick={() => go("library")}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--paper)))" }} />
                  <span className="grow">
                    <small>Thư viện truyện</small><b className="display">Xem tất cả truyện</b>
                    <small>{stories.length ? `${stories.length} truyện · ${stories.filter((s) => s.tone === "ok").length} đã duyệt` : "Lọc, xem trước như bé thấy, thêm vào lộ trình"}</small>
                  </span>
                  <span className="go" aria-hidden><BookOpen className="ic" /></span>
                </button>
                <button className="cont" onClick={() => go("studio")}>
                  <span className="thumb cover" style={{ background: "linear-gradient(170deg, var(--lotus-deep), color-mix(in srgb, var(--lotus) 45%, var(--paper)))" }} />
                  <span className="grow">
                    <small>Studio tạo truyện</small><b className="display">Tạo truyện mới</b><small>Mô tả ý tưởng, AI sẽ viết cùng bạn</small>
                    {quota && !quota.isUnlimited && (
                      <span className="quota" title={quota.periodEnd ? `Làm mới ${fmtDate(quota.periodEnd)}` : undefined}>
                        <span className="quota-bar" aria-hidden><i style={{ width: `${Math.min(100, ((quota.remaining ?? 0) / Math.max(1, quota.quotaLimit ?? 1)) * 100)}%` }} /></span>
                        <small>Còn {quota.remaining ?? 0}/{quota.quotaLimit ?? "?"} lượt</small>
                      </span>
                    )}
                  </span>
                  <span className="go" aria-hidden><WandSparkles className="ic" /></span>
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
                  <SupervisionTodos child={child} todos={todos} go={go} onOwnerChanged={() => { void reloadChildren(child.id); void load(); }} />
                  {role && [...awaitingRecs, ...recentRecs].map((r) => <RecommendationCard key={r.id} rec={r} child={child} role={role} go={go} onChanged={() => void load()} />)}
                  {can("ViewProgress") && unseen.length > 0 && <p className="sub">{unseen.length} câu chuyện con vừa đọc xong — xem bên dưới để trò chuyện với con.</p>}
                </div>

                <InProgressStories stories={stories} go={go} />


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

                {/* Tiến độ (chỉ khi backend có API dashboard) */}
                {dashOk && (can("ViewProgress") ? (
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
                    {!dash?.holdCase?.needsAttention && <HoldPanel child={child} role={role} compact onChanged={() => void load()} />}
                  </div>
                ) : <Locked title="Tiến độ" go={go} />)}

                {/* Kết quả học tập */}
                {dashOk && (can("ViewResults") ? (
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
                ) : <Locked title="Kết quả học tập" go={go} />)}

                {/* Sở thích + Hoạt động gần đây */}
                {dashOk && (can("ViewProgress") ? (
                  <div className="dash-block">
                    <h3>Sở thích</h3>
                    {dash?.topGenres.length ? <div className="chips">{dash.topGenres.map((g) => <span key={g.genre} className="chip">{g.genre} · {g.count}</span>)}</div> : <p className="sub">Chưa đủ dữ liệu (chỉ tính truyện bé tự chọn).</p>}
                    <small className="sub">Điều ước gần đây</small>
                    {dash?.recentWishes.length ? dash.recentWishes.map((w) => <p key={w.id} className="sub" style={{ margin: 0 }}>✨ {w.label}</p>) : <p className="sub">Chưa có điều ước nào.</p>}
                    <h3 style={{ marginTop: 10 }}>Hoạt động gần đây</h3>
                    {dash?.activity.length ? <ul className="activity">{dash.activity.map((a, i) => <li key={i}><span>{a.text}</span><small>{fmtDate(a.at)}</small></li>)}</ul> : <p className="sub">Chưa có hoạt động.</p>}
                  </div>
                ) : <Locked title="Sở thích và hoạt động" go={go} />)}

                {/* Báo cáo định kỳ (chỉ khi backend có API báo cáo) */}
                {reportsOk && (can("ReceiveReport") ? (
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
                ) : <Locked title="Báo cáo tuần" go={go} />)}

                {/* Thống kê của tài khoản: luôn ở cuối trang */}
                <AccountStats kids={kids} stories={stories} quota={quota} />
              </div>
            </>
        </div>
      </div>
    </section>
  );
}
