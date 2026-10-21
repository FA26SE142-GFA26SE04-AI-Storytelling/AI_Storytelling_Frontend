"use client";

import "@/app/features/studio/studio.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, WandSparkles } from "lucide-react";
import { AsideContext } from "@/app/components/shell/AsidePane";
import { creatorAiService, type CreatorAiContext, type CreatorAiInput } from "@/app/services/creatorAiService";
import { aiStoryCreationService } from "@/app/services/aiStoryCreationService";
import type { AIStoryInputProgressDto } from "@/app/types/aiStory";
import { GENRES, OUTPUT_MODE } from "@/app/lib/storyRules";
import { useStoryProgressPolling } from "@/app/features/story-workflow/useStoryProgressPolling";
import { loadSnapshot, snapshotStage, useMediaProgress, type StatusSnapshot } from "@/app/features/studio/useStoryPipeline";
import OutlinePanel from "@/app/features/studio/OutlinePanel";
import StudioMedia from "@/app/features/studio/StudioMedia";
import ReviewGate from "@/app/features/review/ReviewGate";

const EMPTY: CreatorAiInput = {
  ageBand: "6-8", readingLevel: 2, outputMode: "reading_media_only", topic: "", genre: GENRES[0], characterMode: "ai_suggested", characters: [],
  settingMode: "ai_suggested", setting: "", lesson: "", vocabularyLevel: "level_2", language: "vi", targetLength: 500,
};
const keepPolling = (snap: StatusSnapshot) => ["outline_wait", "generating"].includes(snapshotStage(snap, false));

/**
 * Luồng 5 CR2 — Content Creator tạo truyện bằng AI: đầu vào (nhóm tuổi, mức đọc) → dàn ý → nội dung → xác nhận nội dung → media.
 * Không có hồ sơ bé. Xong media thì gửi Moderator duyệt ở nút "Phát hành" trong danh sách truyện.
 */
export default function CreatorAiStudio({ storyId: initialStoryId, ageBand, onBack }: { storyId: number | null; ageBand?: string; onBack: () => void }) {
  const [storyId, setStoryId] = useState<number | null>(initialStoryId);
  const [band, setBand] = useState(ageBand ?? "6-8");
  if (storyId === null) return <CreatorAiBrief onBack={onBack} onAccepted={(id, b) => { setBand(b); setStoryId(id); }} />;
  // Màn duyệt học liệu dùng dạng nhóm tuổi của hồ sơ bé ("Age_6_8").
  return <CreatorAiPipeline storyId={storyId} ageBand={band === "9-10" ? "Age_9_10" : "Age_6_8"} onBack={onBack} />;
}

/** Bước 1: đầu vào. Gửi xong theo dõi kết quả kiểm tra an toàn của đầu vào cho tới khi được nhận hoặc bị chặn. */
function CreatorAiBrief({ onBack, onAccepted }: { onBack: () => void; onAccepted: (storyId: number, ageBand: string) => void }) {
  const [f, setF] = useState<CreatorAiInput>(EMPTY);
  const [chars, setChars] = useState("");
  const [ctx, setCtx] = useState<CreatorAiContext | null>(null);
  const [progress, setProgress] = useState<AIStoryInputProgressDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Gửi lại đúng payload thì dùng lại key để backend không tạo trùng.
  const key = useRef<{ key: string; body: string } | null>(null);
  const set = (p: Partial<CreatorAiInput>) => setF((x) => ({ ...x, ...p }));

  useEffect(() => {
    let alive = true;
    void creatorAiService.context(f.ageBand, f.readingLevel, f.language).then((r) => { if (alive && r.data) setCtx(r.data); });
    return () => { alive = false; };
  }, [f.ageBand, f.readingLevel, f.language]);

  // Đang kiểm tra đầu vào: hỏi lại trạng thái.
  useEffect(() => {
    if (!progress || progress.inputStatus !== "checking_input") return;
    const t = setTimeout(() => void creatorAiService.progress(progress.storyId, progress.requestId).then((r) => { if (r.data) setProgress(r.data); }), 2000);
    return () => clearTimeout(t);
  }, [progress]);
  useEffect(() => { if (progress?.inputStatus === "input_accepted") onAccepted(progress.storyId, f.ageBand); }, [progress, onAccepted, f.ageBand]);

  const input = (): CreatorAiInput => ({
    ...f, topic: f.topic.trim(), lesson: f.lesson.trim(), setting: f.settingMode === "specified" ? f.setting?.trim() : undefined,
    characters: f.characterMode === "specified" ? chars.split(",").map((c) => c.trim()).filter(Boolean) : [],
  });
  const submit = async () => {
    const body = input();
    const json = JSON.stringify(body);
    if (key.current?.body !== json) key.current = { key: `creator-ai-${crypto.randomUUID()}`, body: json };
    setBusy(true);
    setError(null);
    const r = await creatorAiService.submit(body, key.current.key);
    setBusy(false);
    if (r.data) setProgress(r.data);
    if (!r.success) setError(r.data?.fallbackMessage || r.message);
  };
  const retry = async () => {
    if (!progress) return;
    setBusy(true);
    const r = await creatorAiService.retry(progress.storyId, progress.requestId, input());
    setBusy(false);
    if (r.data) setProgress(r.data);
    if (!r.success) setError(r.data?.fallbackMessage || r.message);
  };

  const max = ctx?.maximumLength ?? 1000;
  const valid = f.topic.trim().length >= 2 && f.lesson.trim().length >= 2 && f.targetLength > 0 && f.targetLength <= max
    && (f.characterMode !== "specified" || chars.trim()) && (f.settingMode !== "specified" || f.setting?.trim());
  const checking = progress?.inputStatus === "checking_input";

  return (
    <div className="st-card">
      <div className="row"><button className="btn btn-g" onClick={onBack}><ArrowLeft className="ic" />Danh sách</button><h3 className="grow">Tạo truyện mẫu bằng AI</h3></div>
      <div className="st-form">
        <label className="field"><span className="lbl">Nhóm tuổi</span>
          <select className="inp" value={f.ageBand} onChange={(e) => set({ ageBand: e.target.value as CreatorAiInput["ageBand"] })}><option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option></select></label>
        <label className="field"><span className="lbl">Mức đọc</span>
          <select className="inp" value={f.readingLevel} onChange={(e) => set({ readingLevel: +e.target.value, vocabularyLevel: `level_${e.target.value}` as CreatorAiInput["vocabularyLevel"] })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="field"><span className="lbl">Thể loại</span>
          <select className="inp" value={f.genre} onChange={(e) => set({ genre: e.target.value })}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label className="field"><span className="lbl">Độ dài (tối đa {max} từ)</span>
          <input className="inp" type="number" min={100} max={max} value={f.targetLength} onChange={(e) => set({ targetLength: +e.target.value || 0 })} /></label>
        <label className="field"><span className="lbl">Kiểu truyện</span>
          <select className="inp" value={f.outputMode} onChange={(e) => set({ outputMode: e.target.value as CreatorAiInput["outputMode"] })}>
            {(ctx?.availableOutputModes ?? ["reading_media_only", "learning"]).map((m) => <option key={m} value={m}>{OUTPUT_MODE[m as CreatorAiInput["outputMode"]]?.label ?? m}</option>)}</select></label>
      </div>
      <label className="field"><span className="lbl">Chủ đề</span><input className="inp" maxLength={200} value={f.topic} onChange={(e) => set({ topic: e.target.value })} placeholder="Ví dụ: Hai người bạn cùng chăm sóc khu vườn" /></label>
      <label className="field"><span className="lbl">Bài học</span><input className="inp" maxLength={500} value={f.lesson} onChange={(e) => set({ lesson: e.target.value })} placeholder="Ví dụ: Biết chia sẻ và kiên nhẫn" /></label>
      <div className="st-form">
        <label className="field"><span className="lbl">Nhân vật</span>
          <select className="inp" value={f.characterMode} onChange={(e) => set({ characterMode: e.target.value as CreatorAiInput["characterMode"] })}><option value="ai_suggested">Để AI chọn</option><option value="specified">Tự đặt</option></select></label>
        {f.characterMode === "specified" && <label className="field"><span className="lbl">Tên nhân vật (cách nhau dấu phẩy)</span><input className="inp" value={chars} onChange={(e) => setChars(e.target.value)} /></label>}
        <label className="field"><span className="lbl">Bối cảnh</span>
          <select className="inp" value={f.settingMode} onChange={(e) => set({ settingMode: e.target.value as CreatorAiInput["settingMode"] })}><option value="ai_suggested">Để AI chọn</option><option value="specified">Tự đặt</option></select></label>
        {f.settingMode === "specified" && <label className="field"><span className="lbl">Bối cảnh</span><input className="inp" maxLength={200} value={f.setting ?? ""} onChange={(e) => set({ setting: e.target.value })} /></label>}
      </div>
      {ctx && <small className="sub">Ngưỡng an toàn tối thiểu {ctx.safetyScoreThreshold}. Nội dung bị chặn với nhóm tuổi này: {ctx.blockedCategoryCodes.join(", ") || "không có"}.</small>}
      {checking && <div className="notice warn">Đang kiểm tra an toàn của đầu vào…</div>}
      {progress && ["input_blocked", "input_check_failed"].includes(progress.inputStatus) && (
        <div className="notice err">{progress.fallbackMessage || "Đầu vào chưa phù hợp. Hãy điều chỉnh rồi gửi lại."}
          {progress.canRetry && <button className="btn btn-s" style={{ marginLeft: 8 }} disabled={busy} onClick={() => void retry()}><RefreshCw className="ic" />Thử lại</button>}</div>
      )}
      {error && !progress && <div className="notice err" role="alert">{error}</div>}
      <div className="row"><span className="grow" />
        <button className="btn btn-p" disabled={busy || checking || !valid} onClick={() => void submit()}><WandSparkles className="ic" />{busy ? "Đang gửi…" : "Tạo dàn ý"}</button></div>
    </div>
  );
}

/** Bước 2–5: dàn ý → AI viết → xác nhận nội dung → media. Dùng lại các khung của Studio phụ huynh. */
function CreatorAiPipeline({ storyId, ageBand, onBack }: { storyId: number; ageBand: string; onBack: () => void }) {
  const [approved, setApproved] = useState(false);
  const shouldContinue = useCallback((s: StatusSnapshot) => keepPolling(s), []);
  const status = useStoryProgressPolling<StatusSnapshot>(storyId, loadSnapshot, shouldContinue);
  const stage = snapshotStage(status.data, approved);
  const media = useMediaProgress(stage === "media" ? storyId : null);
  const [aside, setAside] = useState(false);
  const asideState = useMemo(() => ({ collapsed: aside, toggle: () => setAside((v) => !v) }), [aside]);
  const errorCode = status.data?.generation?.lastErrorCode ?? status.data?.outline?.lastErrorCode ?? null;
  const generationFailed = status.data?.generation?.currentStep?.startsWith("failed_") ?? false;
  const outlineFailed = !!status.data?.outline?.lastErrorCode && !status.data.outline.currentVersion;

  const retry = async () => {
    const key = `retry-${storyId}-${crypto.randomUUID()}`;
    if (generationFailed) await aiStoryCreationService.retryGeneration(storyId, { retryKey: key });
    else await aiStoryCreationService.retryOutline(storyId, { operationKey: key });
    status.refresh();
  };

  const header = (
    <div className="st-card">
      <div className="row"><button className="btn btn-g" onClick={onBack}><ArrowLeft className="ic" />Danh sách</button>
        <h3 className="grow">Truyện AI #{storyId}</h3>
        <span className="pill ai">{{ outline_wait: "AI đang viết dàn ý", outline: "Duyệt dàn ý", generating: "AI đang viết truyện", review: "Xem lại nội dung", media: "Tạo tranh và giọng đọc", moderation: "Chờ kiểm duyệt an toàn", stopped: "Đã dừng" }[stage as string] ?? stage}</span></div>
      {status.error && <div className="notice err">{status.error}</div>}
      {(generationFailed || outlineFailed) && <div className="notice err">AI gặp lỗi ({errorCode}). <button className="btn btn-s" onClick={() => void retry()}><RefreshCw className="ic" />Thử lại</button></div>}
      {status.timedOut && <div className="notice warn">AI chạy lâu hơn dự kiến. <button className="btn btn-s" onClick={status.refresh}>Kiểm tra lại</button></div>}
    </div>
  );

  if (stage === "review") {
    return (
      <>
        {header}
        <AsideContext.Provider value={asideState}>
          <section className="ws dock" data-aside={aside ? "collapsed" : undefined} style={{ minHeight: 560 }}>
            <ReviewGate key={storyId} storyId={storyId} ageBand={ageBand} creator onApproved={status.refresh} onArchived={onBack} />
          </section>
        </AsideContext.Provider>
      </>
    );
  }
  if (stage === "media") {
    return (
      <>
        {header}
        <AsideContext.Provider value={asideState}>
          <section className="ws dock" data-aside={aside ? "collapsed" : undefined} style={{ minHeight: 480 }}>
            <StudioMedia key={storyId} storyId={storyId} media={media} onFinish={onBack} />
          </section>
        </AsideContext.Provider>
        {media.data?.isReady && <div className="notice ok">Truyện đã sẵn sàng. Về danh sách và bấm “Phát hành” để gửi Moderator duyệt.</div>}
      </>
    );
  }
  return (
    <>
      {header}
      {stage === "outline" && status.data?.outline?.currentVersion && (
        <div className="st-card">
          <OutlinePanel storyId={storyId} version={status.data.outline.currentVersion} editable visible onReveal={() => {}}
            onApproved={() => { setApproved(true); status.refresh(); }} onChanged={status.refresh} />
        </div>
      )}
      {["outline_wait", "generating"].includes(stage) && <div className="st-card"><p className="sub" style={{ margin: 0 }}>AI đang làm việc, trang tự cập nhật. Bạn có thể quay lại danh sách và mở lại sau.</p></div>}
      {stage === "moderation" && <div className="st-card"><p className="sub" style={{ margin: 0 }}>Nội dung cần kiểm duyệt an toàn trước khi tiếp tục.</p></div>}
      {stage === "stopped" && <div className="st-card"><p className="sub" style={{ margin: 0 }}>Truyện đã dừng (bị chặn, từ chối hoặc lưu trữ).</p></div>}
    </>
  );
}
