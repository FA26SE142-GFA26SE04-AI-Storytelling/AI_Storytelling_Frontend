"use client";
import { useTabActions } from "@/app/features/story-workflow/tabActions";

import "./review.css";
import { useEffect, useState } from "react";
import { BookOpenText, Check, CircleAlert, ClipboardCheck, PencilLine, PenLine, RefreshCw, WandSparkles } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { hasMissingLearning } from "@/app/features/story-workflow/storyReviewLearning";
import { useRegisterApprove } from "@/app/features/story-workflow/approveSlot";
import { countWords, normalizeSelection, type StorySelection } from "@/app/features/story-workflow/storySelection";
import Frog from "@/app/components/brand/Frog";
import { statusBadge } from "@/app/lib/storyView";
import { isReadingOnly } from "@/app/lib/storyRules";
import { useRiseIn, useSwap } from "@/app/lib/motion";
import { ArtifactItems, ARTIFACT_LABEL, type ArtifactKind } from "./ArtifactList";
import ListeningPanel from "./ListeningPanel";
import ProposalCard from "./ProposalCard";
import RevisionPanel from "./RevisionPanel";
import { StoryEditor, StoryView } from "./StoryTab";
import { LearningEditor } from "./ReviewTools";
import AutoPublishAction from './AutoPublishAction';

type Tab = "story" | "listening" | ArtifactKind;
/** Lý do chưa duyệt được do backend trả về bằng tiếng Anh, nối bằng " • ": dịch các câu đã biết, câu lạ giữ nguyên. */
const ISSUE_VI: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Quiz needs at least 3 valid questions/, () => 'Câu hỏi đọc hiểu cần ít nhất 3 câu hợp lệ, có đủ mọi loại câu hỏi và đáp án đúng.'],
  [/^Listening interactions must be confirmed/, () => 'Cần xác nhận các tương tác khi nghe.'],
  [/^Listening interactions must match the plan/, () => 'Các tương tác khi nghe chưa khớp kế hoạch, hãy tạo lại loại bị lỗi thời.'],
  [/^Vocabulary needs at least 5 unique.*(current: (d+))/, (m) => `Từ vựng cần ít nhất 5 từ không trùng và đều xuất hiện trong truyện (hiện có ${m[1]}).`],
  [/^Artifacts must be bound to the current story version/, () => 'Học liệu chưa gắn với bản truyện hiện tại.'],
];
const viIssues = (text: string) => text.split(' • ').map((s) => { for (const [re, fn] of ISSUE_VI) { const m = s.match(re); if (m) return fn(m); } return s; }).join(' • ');
const ARTIFACTS: ArtifactKind[] = ["vocabulary", "quiz"];

type Props = {
  actor?: 'parent' | 'creator';
  storyId: number;
  /** Nhóm tuổi của bé, quyết định dạng câu đố khi sửa học liệu. */
  ageBand: string;
  onApproved: () => void;
};

/**
 * Cổng duyệt (Luồng 2 mục 6.6): đọc bản thảo và học liệu, chỉnh sửa theo chủ đích hoặc sửa tay,
 * sinh lại học liệu có xem trước, rồi Duyệt. Trả về 2 cột: vùng đọc và cột quyết định.
 */
export default function ReviewGate({ storyId, ageBand, onApproved, actor = 'parent' }: Props) {
  const r = useStoryReview(storyId, actor);
  const { bundle, busy, aiTask, error, validation, proposal } = r;
  const [tab, setTab] = useState<Tab>("story");
  const tabActions = useTabActions();
  const [selection, setSelection] = useState<StorySelection | null>(null);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<"learning" | null>(null);
  const docRef = useSwap<HTMLDivElement>(tab);
  const sideRef = useRiseIn<HTMLDivElement>(".sec", [bundle ? 1 : 0], { delay: 35, distance: 10 });

  const content = bundle?.story.content ?? "";
  // Lý do chưa duyệt được; tính trước khi return sớm vì hook đăng ký duyệt phải chạy ở mọi lần render.
  const approveBlock = !bundle ? "Đang tải bản thảo…"
    : proposal ? "Hãy áp dụng hoặc bỏ đề xuất của AI trước khi duyệt."
    : editing ? "Hãy lưu hoặc huỷ bản sửa tay trước khi duyệt."
    : hasMissingLearning(bundle) ? "Còn thiếu học liệu cho bản thảo này."
    : bundle.listening?.required && !bundle.listening.reviewed ? "Hãy xem và xác nhận các tương tác khi nghe (tab \"Khi nghe\") trước khi duyệt."
    : !(actor === 'creator' ? bundle.summary.canConfirmContent : bundle.summary.canApprove) ? "Bạn chưa thể duyệt truyện này."
    : null;
  // Trong Studio, nút duyệt nằm trên thanh tiến trình (cạnh nút huỷ); ở màn "Duyệt nội dung" thì tự vẽ trong cột phải.
  const approveInBar = useRegisterApprove({
    label: actor === 'creator' ? 'Xác nhận nội dung và tạo media' : 'Duyệt và tạo minh hoạ',
    disabled: busy || approveBlock !== null,
    reason: approveBlock,
    run: () => void r.approve(onApproved),
  });
  // Nội dung đổi (áp dụng đề xuất, sửa tay) thì vị trí cũ không còn đúng.
  useEffect(() => { setSelection(null); }, [content]);

  if (!bundle) {
    return (
      <>
        <div className="review-doc"><div className="empty">{error
          ? <><CircleAlert style={{ color: "var(--danger)" }} /><b className="display">Không tải được bản thảo</b><span>{error}</span><button className="btn btn-s" onClick={() => void r.refresh()}>Thử lại</button></>
          : <><Frog size={90} mood="think" /><span>Đang tải bản thảo…</span></>}</div></div>
        <div className="pane" />
      </>
    );
  }

  const { summary, story } = bundle;
  const items: Record<ArtifactKind, unknown[]> = { vocabulary: bundle.vocabulary.items, quiz: bundle.quiz.items };
  const listening = bundle.listening;
  const missing = hasMissingLearning(bundle);
  // Truyện "Chỉ để đọc" không có từ vựng / câu đố (backend từ chối mọi thao tác học liệu).
  const learning = !isReadingOnly(summary.outputMode);
  const artifacts = learning ? ARTIFACTS : [];
  const canEdit = summary.canEdit && !proposal && !editing;
  const whole = normalizeSelection(content, 0, content.length);
  const wholeStory = !!selection && !!whole && selection.start === whole.start && selection.endExclusive === whole.endExclusive;
  const [tone, statusLabel] = statusBadge(summary.storyStatus);

  const tabButton = (t: Tab, label: string, n?: number) => (
    <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
      {label}{n !== undefined && <span className={`pill ${n > 0 ? "draft" : "wait"}`}>{n}</span>}
    </button>
  );

  return (
    <>
      <div className="review-doc gate">
        <div className="gate-tabs">
          {tabButton("story", "Truyện")}
          {artifacts.map((k) => tabButton(k, ARTIFACT_LABEL[k], items[k].length))}
          {listening?.required && tabButton("listening", "Khi nghe", listening.items.length)}
          {tabActions && <div className="tab-actions">{tabActions}</div>}
        </div>

        <div ref={docRef} className="gate-body">
          {aiTask && <div className="ai-wait" role="status"><Frog size={44} mood="think" /><span>{aiTask}</span></div>}
          {proposal && !aiTask && (
            <ProposalCard proposal={proposal} busy={busy}
              onApply={() => { void r.decideProposal(true); }}
              onDiscard={() => { void r.decideProposal(false); }} />
          )}

          {tab === "story" ? (
            <article className="sheet">
              <div className="row">
                <span className={`pill ${tone}`}>{statusLabel}</span>
                <span className="pill ai">Do AI tạo</span>
                {!learning && <span className="pill draft">Chỉ để đọc</span>}
                <span className="hint" style={{ marginLeft: "auto" }}>Bản thảo #{summary.storyVersionId} · {countWords(content)} tiếng</span>
              </div>
              {editing ? (
                <StoryEditor key={story.versionId} story={story} actor={actor} assistanceRevisionToken={summary.assistanceRevisionToken} busy={busy} onCancel={() => setEditing(false)}
                  onSave={(draft) => { void r.saveStory(draft, () => setEditing(false)); }} />
              ) : (
                <>
                  <h2 className="display">{story.title}</h2>
                  <p className="sub">Bài học: {story.lesson || "—"}</p>
                  <StoryView story={story} selection={selection} selectable={canEdit} onSelect={setSelection} />
                </>
              )}
            </article>
          ) : tab === "listening" ? (
            listening && <ListeningPanel listening={listening} busy={busy || !!proposal || editing} canConfirm={!!(summary.canEdit || summary.canApprove || summary.canConfirmContent)}
              onConfirm={() => void r.confirmListening()} onRegenerate={(t) => void r.regenerateListening(t)} />
          ) : (
            <article className="sheet">
              <div className="row">
                <h3 className="display grow" style={{ margin: 0 }}>{ARTIFACT_LABEL[tab]}</h3>
                {summary.canEdit && items[tab].length > 0 && (
                  <button className="btn btn-s" disabled={busy || !!proposal || editing} onClick={() => { void r.regenerateArtifact(tab); }}>
                    <WandSparkles className="ic" />Sinh lại bằng AI
                  </button>
                )}
              </div>
              <ArtifactItems kind={tab} items={items[tab]} />
            </article>
          )}
        </div>
      </div>

      <AsidePane title="Duyệt truyện" icon={ClipboardCheck} bodyRef={sideRef}>
          <div className="sec">
            <div className="sec-h">Gói duyệt</div>
            <button className="ck ck-link" onClick={() => setTab("story")}>
              <span className="st ok"><BookOpenText /></span>Truyện<small>{countWords(content)} tiếng{summary.readabilityFkgl !== null && ` · FKGL ${summary.readabilityFkgl.toFixed(1)}`}</small>
            </button>
            {!learning && <p className="hint">Truyện chỉ để đọc: không có từ vựng hay câu đố.</p>}
            {artifacts.map((k) => (
              <button key={k} className="ck ck-link" onClick={() => setTab(k)}>
                <span className={`st ${items[k].length > 0 ? "ok" : "warn"}`}>{items[k].length > 0 ? <Check /> : <CircleAlert />}</span>
                {ARTIFACT_LABEL[k]}<small>{items[k].length > 0 ? `${items[k].length} mục` : "Chưa có"}</small>
              </button>
            ))}
            {listening?.required && (
              <button className="ck ck-link" onClick={() => setTab("listening")}>
                <span className={`st ${listening.reviewed ? "ok" : "warn"}`}>{listening.reviewed ? <Check /> : <CircleAlert />}</span>
                Khi nghe<small>{listening.reviewed ? "Đã xác nhận" : `${listening.items.length} tương tác · chờ xác nhận`}</small>
              </button>
            )}
            {validation?.checks.map((c) => (
              <div key={c.name} className="ck"><span className={`st ${c.passed ? "ok" : "warn"}`}>{c.passed ? <Check /> : <CircleAlert />}</span>{c.name}<small>{c.message ?? ""}</small></div>
            ))}
          </div>

          {summary.canEdit && tab === "story" && (
            <>
              <RevisionPanel selection={selection} wholeStory={wholeStory} disabled={busy || !canEdit}
                onSelectAll={() => setSelection(whole)} onClear={() => setSelection(null)}
                onSubmit={(instruction) => { if (selection) void r.reviseStory(selection, instruction); }} />
              <div className="sec">
                <button className="btn btn-s btn-c" disabled={busy || !canEdit} onClick={() => { setSelection(null); setEditing(true); }}>
                  <PenLine className="ic" />Tự sửa bản thảo
                </button>
              </div>
            </>
          )}

          {error && !dialog && <div className="notice err" role="status">{viIssues(error)}</div>}

          <div className="sec">
            <div className="sec-h">Quyết định</div>
            {actor==='parent'&&<AutoPublishAction key={storyId} storyId={storyId} disabled={busy||!!proposal||editing||!summary.canApprove} onApproved={onApproved}/>}
            {summary.canEdit && learning && <button className="btn btn-s btn-c" disabled={busy || !!proposal || editing} onClick={() => setDialog("learning")}><PencilLine className="ic" />Sửa học liệu</button>}
            {missing && <button className="btn btn-s btn-c" disabled={busy || !summary.canEdit || !!proposal} onClick={() => void r.generateMissingLearning()}><RefreshCw className="ic" />Tạo học liệu còn thiếu</button>}
            {!approveInBar && (
              <button className="btn btn-ok btn-c" disabled={busy || approveBlock !== null} onClick={() => void r.approve(onApproved)}>
                <Check className="ic" />{actor === 'creator' ? 'Xác nhận nội dung và tạo media' : 'Duyệt và tạo minh hoạ'}
              </button>
            )}
            <p className="hint">
              {approveBlock ?? (approveInBar ? "Bấm dấu ✓ trên thanh tiến trình để duyệt. " : "") + (actor === 'creator' ? 'Xác nhận nội dung để chuẩn bị media. Gửi duyệt công khai là bước riêng sau khi sẵn sàng.' : 'Sau khi duyệt, hệ thống vẽ tranh và tạo giọng đọc. Bé thấy truyện khi mọi thứ sẵn sàng.')}
            </p>
          </div>
          {dialog === "learning" && <LearningEditor r={r} ageBand={ageBand} onClose={() => setDialog(null)} />}
      </AsidePane>
    </>
  );
}
