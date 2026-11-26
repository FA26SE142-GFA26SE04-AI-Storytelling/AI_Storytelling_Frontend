"use client";

import "@/app/styles/features/events/events.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import Select from "@/app/components/Select";
import { useAuth } from "@/app/context/AuthContext";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { HandoverDialog } from "@/app/features/kid/StoryHandoverButton";
import { eventService } from "@/app/services/eventService";
import {
  EVENT_STATUS_LABEL,
  isNewEvent,
  type EventAppealDto,
  type EventAwardSlotDto,
  type EventDetailDto,
  type EventMissionDashboardDto,
  type EventParticipationDto,
  type EventReportSummaryDto,
  type EventSubmissionDto,
  type EventSummaryDto,
  type MyEventResultDto,
  type PublicEventResultsDto,
} from "@/app/types/event";
import CreateEventModal from "./CreateEventModal";
import EventActivityParticipantView from "./EventActivityParticipantView";
import EventCreatorView from "./EventCreatorView";
import EventMissionView from "./EventMissionView";
import EventModeratorPanel from "./EventModeratorPanel";
import EventDetailHero from "./EventDetailHero";
import EventListView from "./EventListView";
import { readEventResultNavigation, type EventResultTarget } from "./eventNavigation";

/** Không gian Sự kiện & Chiến dịch Thưởng dùng chung theo vai trò (Parent / Creator / Moderator / Admin). */
export default function EventsWorkspace({ onKid }: Pick<WorkspaceProps, "onKid"> = {}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const role = user?.role ?? "User";
  const isStaff = role === "Moderator" || role === "Administrator";
  const isModerator = role === "Moderator";

  const [events, setEvents] = useState<EventSummaryDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<EventDetailDto | null>(null);
  const [dashboard, setDashboard] = useState<EventMissionDashboardDto | null>(null);
  const [appeals, setAppeals] = useState<EventAppealDto[]>([]);
  const [submissions, setSubmissions] = useState<EventSubmissionDto[]>([]);
  const [summary, setSummary] = useState<EventReportSummaryDto | null>(null);
  const [myRewards, setMyRewards] = useState<EventAwardSlotDto[]>([]);
  const [myParticipations, setMyParticipations] = useState<EventParticipationDto[]>([]);
  const [myResults, setMyResults] = useState<MyEventResultDto[]>([]);
  const [publicResults, setPublicResults] = useState<PublicEventResultsDto | null>(null);
  const [resultTarget, setResultTarget] = useState<EventResultTarget | null>(null);
  const finishResultNavigation = useCallback((target: EventResultTarget) => {
    setResultTarget((current) => current === target ? null : current);
  }, []);
  const hasParentParticipation = role === "User" && myParticipations.some(
    (part) => part.eventId === selectedId && part.trackType === "Parent",
  );
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<EventDetailDto | null>(null);
  const [justCreatedIds, setJustCreatedIds] = useState<number[]>([]);
  const selectionRequest = useRef(0);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [readingStory, setReadingStory] = useState<{ id: number; title: string } | null>(null);
  const onOpenStory = onKid ? (id: number, title: string) => setReadingStory({ id, title }) : undefined;
  const showNewBadge = (ev: EventSummaryDto) =>
    justCreatedIds.includes(ev.id) || isNewEvent(ev);

  const selectEvent = useCallback((id: number | null, target: EventResultTarget | null = null) => {
    setResultTarget(target);
    if (id === selectedId) return;
    selectionRequest.current++;
    setDetail(null);
    setDashboard(null);
    setAppeals([]);
    setSubmissions([]);
    setSummary(null);
    setPublicResults(null);
    setDetailError(null);
    setSelectedId(id);
  }, [selectedId]);

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await eventService.list(isStaff);
    if (res.success) {
      const list = res.data ?? [];
      setEvents(list);
      let requestedId: number | null = null;
      try {
        const raw = sessionStorage.getItem("taletale_selected_event_id");
        if (raw) {
          sessionStorage.removeItem("taletale_selected_event_id");
          const parsed = Number(raw);
          if (Number.isInteger(parsed) && list.some((e) => e.id === parsed)) requestedId = parsed;
        }
      } catch {
        /* ignore storage errors */
      }
      setSelectedId((cur) => cur ?? requestedId ?? (isStaff ? list[0]?.id ?? null : null));
    }
    if (!isStaff) {
      const [rw, parts, mRes] = await Promise.all([
        eventService.myRewards(),
        eventService.myParticipations(),
        eventService.myResults(),
      ]);
      if (rw.success) setMyRewards(rw.data ?? []);
      if (parts.success) setMyParticipations(parts.data ?? []);
      if (mRes.success) setMyResults(mRes.data ?? []);
    }
    setLoading(false);
  }, [isStaff]);

  const loadSelected = useCallback(async () => {
    const request = ++selectionRequest.current;
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const det = await eventService.detail(selectedId);
    if (request !== selectionRequest.current) return;
    setDetailError(det.success ? null : det.message || "Không tải được chi tiết sự kiện.");
    setDetail(det.success ? det.data ?? null : null);

    if (isStaff) {
      const [apRes, sumRes, subRes] = await Promise.all([
        eventService.listAppeals(selectedId),
        eventService.summary(selectedId),
        eventService.listSubmissions(selectedId),
      ]);
      if (request !== selectionRequest.current) return;
      setAppeals(apRes.success ? apRes.data ?? [] : []);
      setSummary(sumRes.success ? sumRes.data ?? null : null);
      setSubmissions(subRes.success ? subRes.data ?? [] : []);
    } else if (det.success && det.data) {
      const pubPromise = det.data.configVersion === "ActivityBased" && det.data.resultsPublishedAt
        ? eventService.publicResults(selectedId)
        : Promise.resolve(null);
      const dashPromise = hasParentParticipation
        ? eventService.missionDashboard(selectedId)
        : Promise.resolve(null);
      const [pubRes, dashRes] = await Promise.all([pubPromise, dashPromise]);
      if (request !== selectionRequest.current) return;
      setPublicResults(pubRes && pubRes.success ? pubRes.data ?? null : null);
      setDashboard(dashRes && dashRes.success ? dashRes.data ?? null : null);
    } else {
      setPublicResults(null);
      setDashboard(null);
    }
  }, [selectedId, isStaff, hasParentParticipation]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!searchParams?.has("eventId") && !searchParams?.has("claim")) return;
    const navigation = readEventResultNavigation(window.location.href);
    if (!navigation) return;
    if (navigation.target) selectEvent(navigation.target.eventId, navigation.target);
    window.history.replaceState(null, "", navigation.cleanHref);
  }, [searchParams, selectEvent]);

  useEffect(() => {
    void loadSelected();
  }, [loadSelected]);

  return (
    <section className={`ws dock ev-ws${isStaff ? " ev-management" : " ev-detail-view"}`}>
      {isStaff && <aside className="pane">
        <div className="sec-h">
          <Trophy className="ic" aria-hidden="true" />
          <span className="grow">Sự kiện</span>
          {isModerator && (
            <button type="button" className="btn btn-p" onClick={() => setCreateOpen(true)}>
              <Plus className="ic" aria-hidden="true" />
              Tạo sự kiện
            </button>
          )}
        </div>
        <div className="pb">
          {loading ? (
            <p className="sub">Đang tải danh sách sự kiện…</p>
          ) : events.length === 0 ? (
            <div className="sec" style={{ alignItems: "center", textAlign: "center", padding: 16 }}>
              <Frog size={68} mood="idle" />
              <p className="sub">Chưa có sự kiện nào đang mở.</p>
            </div>
          ) : (
            <div className="ev-list">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  className={`ev-item${ev.id === selectedId ? " on" : ""}`}
                  onClick={() => selectEvent(ev.id)}
                >
                  <div className="ev-item-head">
                    <span className="ev-item-title">{ev.title}</span>
                    {showNewBadge(ev) && <span className="ev-new-badge">Mới</span>}
                  </div>
                  <div className="ev-item-meta">
                    <span>{EVENT_STATUS_LABEL[ev.status]}</span>
                    <span>{ev.targetAgeBands} tuổi</span>
                    {ev.mainCategoryName && <span>{ev.mainCategoryName}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>}

      <main className="pane">
        <div className="pb">
          {!isStaff && selectedId !== null && (
            <div className="ev-detail-switch ev-detail-navigation">
              <button type="button" className="btn btn-g" onClick={() => selectEvent(null)}>
                <ArrowLeft className="ic" aria-hidden="true" />Danh sách sự kiện
              </button>
              {events.length > 1 && (
              <Select ariaLabel="Chọn sự kiện" value={String(selectedId ?? "")}
                options={events.map((event) => ({
                  value: String(event.id),
                  label: showNewBadge(event) ? `${event.title} · Mới` : event.title,
                }))}
                onChange={(value) => selectEvent(Number(value))} portal />
              )}
            </div>
          )}
          {!isStaff && selectedId === null ? (
            <EventListView events={events} loading={loading} participations={myParticipations} onSelect={selectEvent} />
          ) : !detail ? (
            <div className="sec" style={{ alignItems: "center", padding: 32 }}>
              <Frog size={80} mood="think" />
              <p className="sub">{detailError || (selectedId !== null || loading ? "Đang tải sự kiện…" : "Chọn một sự kiện bên trái để xem chi tiết.")}</p>
              {detailError && <button type="button" className="btn btn-s" onClick={() => void loadSelected()}>Thử lại</button>}
            </div>
          ) : (
            <div className="sec ev-detail-content">
              {!isStaff ? <EventDetailHero detail={detail} /> : <div className="ev-banner">
                <div>
                  <div className="ev-hero-badges">
                    <span className="pill">{EVENT_STATUS_LABEL[detail.status]}</span>
                    {showNewBadge(detail) && <span className="ev-new-badge">Mới</span>}
                  </div>
                  <h2 className="display">{detail.title}</h2>
                  <p>{detail.description}</p>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="pill">Nhóm tuổi: {detail.targetAgeBands}</span>
                  {detail.mainCategoryName && <span className="pill">Chủ đề: {detail.mainCategoryName}</span>}
                  <span className="pill">{detail.eventStoriesCount} truyện sự kiện</span>
                  <span className="pill">{detail.budgetVnd > 0 ? `Ngân sách: ${detail.budgetVnd.toLocaleString("vi-VN")} đ` : "Thưởng quà / Lượt AI"}</span>
                </div>
              </div>}

              {isStaff ? (
                <EventModeratorPanel
                  key={detail.id}
                  detail={detail}
                  isAdmin={role === "Administrator"}
                  appeals={appeals}
                  submissions={submissions}
                  summary={summary}
                  onEditDraft={() => {
                    setEditingDetail(detail);
                    setCreateOpen(true);
                  }}
                  onRefresh={() => {
                    void loadList();
                    void loadSelected();
                  }}
                  onDraftDeleted={(id) => {
                    setEvents((items) => items.filter((item) => item.id !== id));
                    setDetail((current) => current?.id === id ? null : current);
                    setSelectedId((current) => current === id ? null : current);
                    void loadList();
                  }}
                />
              ) : detail.configVersion === "ActivityBased" ? (
                <EventActivityParticipantView
                  detail={detail}
                  dashboard={dashboard}
                  myRewards={myRewards}
                  myResult={myResults.find((r) => r.eventId === detail.id) ?? null}
                  publicResults={publicResults}
                  resultTarget={resultTarget?.eventId === detail.id ? resultTarget : null}
                  onResultTargetHandled={finishResultNavigation}
                  onOpenStory={onOpenStory}
                  onRefresh={() => {
                    void loadList();
                    void loadSelected();
                  }}
                />
              ) : role === "ContentCreator" ? (
                <EventCreatorView
                  detail={detail}
                  myRewards={myRewards}
                  onRefresh={() => {
                    void loadList();
                    void loadSelected();
                  }}
                />
              ) : (
                <EventMissionView
                  detail={detail}
                  dashboard={dashboard}
                  myRewards={myRewards}
                  onOpenStory={onOpenStory}
                  onRefresh={() => {
                    void loadList();
                    void loadSelected();
                  }}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {readingStory && onKid && <HandoverDialog
        storyId={readingStory.id}
        title={readingStory.title}
        onClose={() => setReadingStory(null)}
        onPick={(childId) => {
          setReadingStory(null);
          onKid(childId, readingStory.id, () => void loadSelected());
        }}
      />}
      {createOpen && <CreateEventModal
        key={editingDetail?.id ?? "new"}
        open={createOpen}
        initialDetail={editingDetail}
        onClose={() => {
          setCreateOpen(false);
          setEditingDetail(null);
        }}
        onCreated={(id) => {
          setEditingDetail(null);
          setJustCreatedIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
          setSelectedId(id);
          void loadList();
          void loadSelected();
        }}
      />}
    </section>
  );
}
