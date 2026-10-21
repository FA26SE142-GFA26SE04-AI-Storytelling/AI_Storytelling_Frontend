"use client";

import "./review.css";
import { useEffect, useState } from "react";
import { Archive, BookOpenText, Check, CircleAlert, ClipboardCheck, PencilLine, PenLine, RefreshCw, WandSparkles } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { hasMissingLearning } from "@/app/features/story-workflow/storyReviewLearning";
import { useRegisterApprove } from "@/app/features/story-workflow/approveSlot";
import { countWords, normalizeSelection, type StorySelection } from "@/app/features/story-workflow/storySelection";
import Frog from "@/app/components/brand/Frog";
import { statusBadge } from "@/app/lib/storyView";
import { isReadingOnly } from "@/app/lib/storyRules";
import { useRiseIn, useSwap } from "@/app/lib/motion";
import { ArtifactItems, ARTIFACT_LABEL, type ArtifactKind } from "./ArtifactList";
import ProposalCard from "./ProposalCard";
import RevisionPanel from "./RevisionPanel";
import { StoryEditor, StoryView } from "./StoryTab";
import { ArchiveDialog, LearningEditor } from "./ReviewTools";

type Tab = "story" | ArtifactKind;
const ARTIFACTS: ArtifactKind[] = ["vocabulary", "quiz", "discussion"];

type Props = {
  storyId: number;
  /** Nhóm tuổi của bé, quyết định dạng câu đố khi sửa học liệu. */
  ageBand: string;
  onApproved: () => void;
  onArchived: () => void;
  /** Content Creator: "Xác nhận nội dung" thay cho duyệt, không có lưu trữ (Moderator duyệt công khai sau). */
  creator?: boolean;
};

/**
 * Cổng duyệt (Luồng 2 mục 6.6): đọc bản thảo và học liệu, chỉnh sửa theo chủ đích hoặc sửa tay,
 * sinh lại học liệu có xem trước, rồi Duyệt hoặc Lưu trữ. Trả về 2 cột: vùng đọc và cột quyết định.
 */
export default function ReviewGate({ storyId, ageBand, onApproved, onArchived, creator = false }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, busy, aiTask, error, validation, proposal } = r;
  const [tab, setTab] = useState<Tab>("story");
  const [selection, setSelection] = useState<StorySelection | null>(null);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<"learning" | "archive" | null>(null);
  const [autoNote, setAutoNote] = useState<string | null>(null);
  const docRef = useSwap<HTMLDivElement>(tab);
  const sideRef = useRiseIn<HTMLDivElement>(".sec", [bundle ? 1 : 0], { delay: 35, distance: 10 });

  const content = bundle?.story.content ?? "";
  // Lý do chưa duyệt được; tính trước khi return sớm vì hook đăng ký duyệt phải chạy ở mọi lần render.
  const approveBlock = !bundle ? "Đang tải bản thảo…"
    : proposal ? "Hãy áp dụng hoặc bỏ đề xuất của AI trước khi duyệt."
    : editing ? "Hãy lưu hoặc huỷ bản sửa tay trước khi duyệt."
    : hasMissingLearning(bundle) ? "Còn thiếu học liệu cho bản thảo này."
    : !(creator ? bundle.summary.canConfirmContent ?? bundle.summary.canEdit : bundle.summary.canApprove) ? "Bạn chưa thể duyệt truyện này."
    : null;
  // Trong Studio, nút duyệt nằm trên thanh tiến trình (cạnh nút huỷ); ở màn "Duyệt nội dung" thì tự vẽ trong cột phải.
  const approveInBar = useRegisterApprove({
    label: creator ? "Xác nhận nội dung và tạo minh hoạ" : "Duyệt và tạo minh hoạ",
    disabled: busy || approveBlock !== null,
    reason: approveBlock,
    run: () => void r.approve(onApproved, creator),
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
  const items: Record<ArtifactKind, unknown[]> = { vocabulary: bundle.vocabulary.items, quiz: bundle.quiz.items, discussion: bundle.discussion.items };
  const missing = hasMissingLearning(bundle);
  // Truyện "Chỉ để đọc" không có từ vựng / câu đố / thảo luận (backend từ chối mọi thao tác học liệu).
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
                <StoryEditor story={story} busy={busy} onCancel={() => setEditing(false)}
                  onSave={(draft) => { void r.saveStory(draft, () => setEditing(false)); }} />
              ) : (
                <>
                  <h2 className="display">{story.title}</h2>
                  <p className="sub">Bài học: {story.lesson || "—"}</p>
                  <StoryView story={story} selection={selection} selectable={canEdit} onSelect={setSelection} />
                </>
              )}
            </article>
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
              {tab === "discussion" && <p className="sub">Dành cho bố mẹ trò chuyện cùng bé sau khi đọc. Bé không thấy phần này.</p>}
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
            {!learning && <p className="hint">Truyện chỉ để đọc: không có từ vựng, câu đố hay câu hỏi thảo luận.</p>}
            {artifacts.map((k) => (
              <button key={k} className="ck ck-link" onClick={() => setTab(k)}>
                <span className={`st ${items[k].length > 0 ? "ok" : "warn"}`}>{items[k].length > 0 ? <Check /> : <CircleAlert />}</span>
                {ARTIFACT_LABEL[k]}<small>{items[k].length > 0 ? `${items[k].length} mục` : "Chưa có"}</small>
              </button>
            ))}
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

          {error && !dialog && <div className="notice err" role="alert">{error}</div>}

          <div className="sec">
            <div className="sec-h">Quyết định</div>
            {summary.canEdit && learning && <button className="btn btn-s btn-c" disabled={busy || !!proposal || editing} onClick={() => setDialog("learning")}><PencilLine className="ic" />Sửa học liệu</button>}
            {missing && <button className="btn btn-s btn-c" disabled={busy || !summary.canEdit || !!proposal} onClick={() => void r.generateMissingLearning()}><RefreshCw className="ic" />Tạo học liệu còn thiếu</button>}
            {!approveInBar && (
              <button className="btn btn-ok btn-c" disabled={busy || approveBlock !== null} onClick={() => void r.approve(onApproved, creator)}>
                <Check className="ic" />{creator ? "Xác nhận nội dung và tạo minh hoạ" : "Duyệt và tạo minh hoạ"}
              </button>
            )}
            <p className="hint">
              {approveBlock ?? (approveInBar ? "Bấm dấu ✓ trên thanh tiến trình để duyệt. " : "") + (creator ? "Sau khi xác nhận, hệ thống vẽ tranh và tạo giọng đọc; xong thì gửi Moderator duyệt ở nút Phát hành." : "Sau khi duyệt, hệ thống vẽ tranh và tạo giọng đọc. Bé thấy truyện khi mọi thứ sẵn sàng.")}
            </p>
            {!creator && summary.canApprove && (
              <button className="btn btn-g btn-c" disabled={busy} onClick={() => void api.autoPublishCheck(storyId).then((res) => {
                if (res.success && res.data) onApproved();
                else setAutoNote(res.success ? "Truyện chưa đủ điều kiện tự duyệt theo cài đặt của bé, bạn duyệt tay nhé." : res.message);
              })}>Kiểm tra tự duyệt</button>
            )}
            {autoNote && <p className="hint">{autoNote}</p>}
            {!creator && <button className="btn btn-g btn-c" disabled={busy || !summary.canArchive} onClick={() => setDialog("archive")}><Archive className="ic" />Lưu trữ truyện</button>}
          </div>
          {dialog === "learning" && <LearningEditor r={r} ageBand={ageBand} onClose={() => setDialog(null)} />}
          {/* Lưu trữ bắt buộc chọn lý do (Luồng 2 mục 6.6). */}
          {dialog === "archive" && <ArchiveDialog storyId={storyId} onClose={() => setDialog(null)} onDone={() => { setDialog(null); onArchived(); }} />}
      </AsidePane>
    </>
  );
}
