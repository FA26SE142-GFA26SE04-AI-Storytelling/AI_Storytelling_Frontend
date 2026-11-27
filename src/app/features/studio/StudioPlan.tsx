"use client";
import { useTabActions } from "@/app/features/story-workflow/tabActions";

import { useEffect, useState } from "react";
import { Ban, Check, ChevronDown, Heart, ShieldBan, ShieldCheck, UserRoundPen, type LucideIcon } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { childProfileService } from "@/app/services/childProfileService";
import { groupCategories } from "@/app/lib/guardian";
import type { ContentCategory } from "@/app/types/childProfile";
import type { UseAIStoryInputFlowResult } from "@/app/features/story-workflow/useAIStoryInputFlow";
import type { UseAiGenerationCapacityResult } from "@/app/features/story-workflow/useAiGenerationCapacity";
import AiCapacityBanner from "./AiCapacityBanner";
import BriefForm from "./BriefForm";
import OutlinePanel from "./OutlinePanel";
import StageProgress from "./StageProgress";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import type { Stage, StatusSnapshot } from "./useStoryPipeline";
import { useSwap } from "@/app/lib/motion";
import { providerFailureMessage } from '@/app/features/story-workflow/storyGenerationFlow';

type Props = {
  flow: UseAIStoryInputFlowResult;
  stage: Stage;
  storyId: number | null;
  snapshot: StatusSnapshot | null;
  errorCode: string | null;
  timedOut: boolean;
  statusError: string | null;
  /** Có khi bước AI vừa lỗi và backend cho thử lại (viết truyện / học liệu, dàn ý lần đầu). */
  retryFailed?: () => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
  onOutlineApproved: () => void;
  /** Tên bé đang được tạo truyện, hiện ở đầu cột phải. */
  kidName: string;
  /** Có thì hiện nút đổi bé ở đầu cột phải (chỉ khi chưa gửi ý tưởng và có nhiều bé). */
  onChangeKid?: () => void;
  /** Mở một truyện đang tạo trong Studio. */
  onOpenStory: (storyId: number) => void;
  capacity?: UseAiGenerationCapacityResult;
};

/** Mã chủ đề (VD WAR_CONFLICT) khi chưa tải được danh mục: viết thường, bỏ gạch dưới. */
const fallbackName = (code: string) => {
  const words = code.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Danh mục nội dung (đã cache, dùng chung với form hồ sơ học tập) để tra tên tiếng Việt và nhóm của mã chủ đề. */
const NO_CATEGORIES: ContentCategory[] = [];

function useCategories(): ContentCategory[] {
  const [cats, setCats] = useState<ContentCategory[]>(NO_CATEGORIES);
  useEffect(() => {
    let alive = true;
    void childProfileService.getContentCategoriesCached().then((list) => { if (alive) setCats(list); });
    return () => { alive = false; };
  }, []);
  return cats;
}

/**
 * Mã chủ đề chia theo nhóm danh mục (Thể loại, Giá trị và kỹ năng sống, Học tập, Cảnh báo an toàn); mỗi nhóm gập / mở được.
 * Mã chưa có trong danh mục (hoặc chưa tải xong) nằm ở nhóm "Khác" với tên dự phòng.
 */
function TopicGroups({ codes, cats, icon: Icon, open }: { codes: string[]; cats: ContentCategory[]; icon: LucideIcon; open: boolean }) {
  const items = codes.map((code) => {
    const found = cats.find((c) => c.code.toUpperCase() === code.toUpperCase());
    return { code, name: found?.displayName ?? fallbackName(code), group: found?.group };
  });
  return (
    <div className="ctx-groups">
      {groupCategories(items).map((g) => (
        <details key={g.id} className="ctx-group" open={open}>
          <summary>
            <span className="grow">{g.label}</span>
            <span className="ctx-count">{g.items.length}</span>
            <ChevronDown className="ic ctx-chevron" aria-hidden />
          </summary>
          <div className="ctx-chips">
            {g.items.map((i) => i.name).sort((a, b) => a.localeCompare(b, "vi")).map((n) => (
              <span key={n} className="ctx-chip"><Icon className="ic" aria-hidden />{n}</span>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/** Sở thích, chủ đề được phép và bị chặn của bé, hiện ở cột phải khi tạo truyện. */
function ChildTopicRules({ kidName, interests, allowed, blocked }: { kidName: string; interests: string[]; allowed: string[]; blocked: string[] }) {
  const cats = useCategories();
  return (
    <>
      {interests.length > 0 && (
        <section className="ctx-block is-like" aria-label="Sở thích của bé">
          <div className="ctx-head"><span className="ctx-ic" aria-hidden><Heart className="ic" /></span><b>Sở thích của bé</b></div>
          <div className="ctx-chips">{interests.map((i) => <span key={i} className="ctx-chip"><Heart className="ic" aria-hidden />{i}</span>)}</div>
        </section>
      )}
      {allowed.length > 0 && (
        <section className="ctx-block is-allow" aria-label="Chỉ viết trong các chủ đề">
          <div className="ctx-head"><span className="ctx-ic" aria-hidden><Check className="ic" /></span><b>Chỉ viết trong các chủ đề</b><span className="ctx-count">{allowed.length}</span></div>
          <p className="ctx-note">Bấm vào từng nhóm để xem chủ đề.</p>
          <TopicGroups codes={allowed} cats={cats} icon={Check} open={false} />
        </section>
      )}
      {blocked.length > 0 && (
        <section className="ctx-block is-block" aria-label="Chủ đề bị chặn">
          <div className="ctx-head"><span className="ctx-ic" aria-hidden><ShieldBan className="ic" /></span><b>Chủ đề bị chặn</b><span className="ctx-count">{blocked.length}</span></div>
          <p className="ctx-note">AI sẽ tránh các chủ đề này khi viết truyện cho {kidName}.</p>
          <TopicGroups codes={blocked} cats={cats} icon={Ban} open />
        </section>
      )}
    </>
  );
}

type View = "brief" | "outline" | "status";
const VIEW_ORDER: Record<View, number> = { brief: 0, status: 1, outline: 2 };

/** Ô lớn mặc định hiện thứ cần làm ở bước hiện tại: form ý tưởng, dàn ý chờ duyệt, hoặc thẻ AI đang làm. */
function autoView(stage: Stage): View {
  if (stage === "brief") return "brief";
  if (stage === "outline") return "outline";
  return "status";
}

export default function StudioPlan({ flow, stage, storyId, snapshot, errorCode, timedOut, statusError, retryFailed, refresh, onOutlineApproved, kidName, onChangeKid, onOpenStory, capacity }: Props) {
  // Lựa chọn tab chỉ có hiệu lực trong bước đã chọn; sang bước mới thì quay về view mặc định.
  const [choice, setChoice] = useState<{ stage: Stage; view: View } | null>(null);
  const hasOutline = !!snapshot?.outline?.currentVersion && storyId !== null;
  const auto = autoView(stage);
  let view = choice?.stage === stage ? choice.view : auto;
  if (view === "outline" && !hasOutline) view = auto === "outline" ? "status" : auto;
  const pick = (v: View) => setChoice({ stage, view: v });
  // Nội dung ô lớn trượt theo hướng của bước: tiến tới thì trượt từ phải, quay lại thì từ trái.
  const viewRef = useSwap<HTMLDivElement>(view, VIEW_ORDER[view] >= VIEW_ORDER[auto] ? 1 : -1);
  const blocked = stage === "blocked";
  const statusLabel = blocked ? "Ý tưởng bị chặn" : errorCode ? "Đã dừng do lỗi" : stage === "stopped" ? "Đã dừng" : "AI đang làm";

  const tabActions = useTabActions();
  return (
    <>
      <div className="center plan-center">
        <div className="tabs plan-tabs" role="tablist">
          <button role="tab" aria-selected={view === "brief"} className={view === "brief" ? "on" : ""} disabled={!flow.context && stage !== 'brief'} onClick={() => pick("brief")}>Yêu cầu</button>
          <button role="tab" aria-selected={view === "outline"} className={view === "outline" ? "on" : ""} disabled={!hasOutline} onClick={() => pick("outline")}>
            Dàn ý{stage === "outline" && <i className="tab-dot" aria-label="chờ bạn duyệt" />}
          </button>
          {auto === "status" && (
            <button role="tab" aria-selected={view === "status"} className={view === "status" ? "on" : ""} onClick={() => pick("status")}>{statusLabel}</button>
          )}
          {tabActions && <div className="tab-actions">{tabActions}</div>}
        </div>
        <div className="plan-stage">
          <PondBackdrop />
          <div ref={viewRef} className="plan-view">
            {view === "brief" && <div className="plan-scroll">
              {stage === "brief" && capacity && (
                <AiCapacityBanner
                  capacity={capacity.capacity}
                  loading={capacity.loading}
                  limitRejected={flow.concurrencyLimitReached}
                  onRefresh={() => void capacity.refresh()}
                  onRetrySubmit={flow.concurrencyLimitReached ? () => void flow.submit() : undefined}
                  onOpenStory={onOpenStory}
                  busy={flow.isBusy}
                />
              )}
              <BriefForm flow={flow} locked={stage !== "brief"} />
            </div>}
            {/* Luôn dựng khi đã có dàn ý (ẩn khi xem tab khác) để nút duyệt trên thanh tiến trình còn đó. */}
            {hasOutline && storyId !== null && (
              <div className="plan-scroll" hidden={view !== "outline"}>
                <OutlinePanel storyId={storyId} version={snapshot?.outline?.currentVersion ?? null} regeneration={snapshot?.outline?.regeneration} editable={stage === "outline"} visible={view === "outline"} onReveal={() => pick("outline")} onApproved={onOutlineApproved} onChanged={refresh} />
              </div>
            )}
            {view === "status" && (
              <StageProgress
                outputMode={flow.values?.outputMode}
                stage={stage}
                snapshot={snapshot}
                message={blocked ? flow.errorMessage : statusError}
                errorCode={errorCode}
                timedOut={timedOut || flow.isPollingTimedOut}
                onRetry={blocked && flow.canRetryInput ? () => void flow.retry() : flow.isPollingTimedOut ? () => void flow.checkStatus() : refresh}
                onRetryFailed={retryFailed}
                onEdit={blocked && flow.valuesKnown ? flow.editInput : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <AsidePane title={kidName} icon={ShieldCheck} actions={onChangeKid && (
        <button className="btn btn-g aside-toggle" onClick={onChangeKid} title="Đổi bé" aria-label={`Đổi bé, đang tạo cho ${kidName}`}><UserRoundPen className="ic" /></button>
      )}>
          {flow.context ? (
            <>
              <div className="kv">
                <div><small>Độ dài tối đa</small><b>{flow.context.maximumLength.toLocaleString("vi-VN")} từ</b></div>
                <div><small>Từ vựng</small><b>{flow.context.defaultVocabularyLevel.replace("level_", "Mức ")}</b></div>
                <div><small>Chế độ duyệt</small><b>{/auto/i.test(flow.context.requiredApprovalMode) ? "Tự duyệt" : "Duyệt tay"}</b></div>
                <div><small>Ngôn ngữ</small><b>Tiếng Việt</b></div>
              </div>
              <ChildTopicRules
                kidName={kidName}
                interests={flow.context.interests}
                allowed={flow.context.allowedCategoryCodes}
                blocked={flow.context.blockedCategoryCodes}
              />
            </>
          ) : errorCode ? <div role="status">
            {storyId !== null && <p className="sub">Truyện #{storyId}</p>}
            <p className="notice err" data-inline-notice>{providerFailureMessage(errorCode) ?? 'Tác vụ tạo truyện đã thất bại. Xem thông báo ở khung chính để biết bước tiếp theo.'}</p>
          </div> : statusError || flow.errorMessage ? <p className="notice err" role="status" data-inline-notice>Chưa tải được thông tin truyện. {statusError || flow.errorMessage}</p>
            : storyId !== null && snapshot ? <p className="sub">Truyện #{storyId}. Chưa có thông tin hồ sơ để hiển thị.</p>
            : <p className="sub">{storyId ? 'Đang mở lại truyện đã lưu…' : 'Đang tải…'}</p>}
      </AsidePane>
    </>
  );
}
