'use client';

import { confirmDialog } from '@/app/lib/confirm';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { childAccessService } from '@/app/services/childAccessService';
import { childNotebookService } from '@/app/services/childReadingService';
import type { NotebookEntry } from '@/app/types/childReading';
import { useChildReader } from './useChildReader';
import ChildReader from './ChildReader';
import KidWish from './KidWish';
import KidRewards from './KidRewards';
import KidShelves from './KidShelves';
import { DOCK_TINT, type DockTab } from './KidDock';
import IconButton from '@/app/components/IconButton';
import '@/app/styles/features/kid/child-reading.css';
import '@/app/styles/features/kid/kid-lobby.css';
import '@/app/styles/features/kid/kid-panes.css';
import Frog from '@/app/components/brand/Frog';
import { BookA, BookOpen, Trash2 } from 'lucide-react';
import { showToast } from '@/app/lib/toast';
import { useRiseIn } from '@/app/lib/motion';
import PaneSwap from './PaneSwap';
import { KID_FEATURE, KidFeatureOff, tabEnabled, useKidDisabledFeatures } from './kidFeatures';

export type LibraryPane = DockTab;

const PANE_ORDER: readonly LibraryPane[] = [
  'lobby', 'library', 'journey', 'notebook', 'wishes', 'rewards',
];

export default function ChildReadingLibrary({
  childId,
  pane: controlledPane,
  story,
  unlockTitle,
  lobby,
  journey,
  libraryExtra,
  onStoryOpened,
  onLockChange,
  onPaneChange,
  onReadingChange,
  onTimeBlocked,
}: {
  childId: number;
  pane?: LibraryPane;
  story?: { storyId: number } | null;
  unlockTitle?: string;
  lobby?: ReactNode;
  journey?: ReactNode;
  libraryExtra?: ReactNode;
  onStoryOpened?: () => void;
  onLockChange?: (lock: { locked: boolean; unlockStoryId: number | null }) => void;
  onPaneChange?: (pane: LibraryPane) => void;
  onReadingChange?: (active: boolean) => void;
  /** Backend chặn mở truyện vì giờ đọc (nghỉ mắt, giờ ngủ, hết phút, ngoài khung): trang cha hỏi lại trạng thái ngay. */
  onTimeBlocked?: () => void;
}) {
  const session = childAccessService.readSession();
  const token = session?.childProfileId === childId ? session.accessToken : '';
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  const reader = useChildReader(token, refresh, onTimeBlocked);
  const reading = !!reader.content;

  // Hướng trượt theo thứ tự khu: sang phải thì trượt vào từ phải, về trái thì từ trái.
  const [nav, setNav] = useState<{ pane: LibraryPane; dir: 1 | -1 }>({
    pane: controlledPane ?? 'lobby',
    dir: 1,
  });
  const { pane, dir } = nav;

  // Đồng bộ khi pane được điều khiển từ ngoài (dock nằm trên HUD của trang cha).
  useEffect(() => {
    if (!controlledPane) return;
    setNav((cur) =>
      cur.pane === controlledPane
        ? cur
        : { pane: controlledPane, dir: PANE_ORDER.indexOf(controlledPane) >= PANE_ORDER.indexOf(cur.pane) ? 1 : -1 }
    );
  }, [controlledPane]);

  // Báo khu đang chọn cho trang cha.
  useEffect(() => {
    onPaneChange?.(pane);
  }, [pane, onPaneChange]);

  // Bé bấm truyện trong "Hành trình của em" thì mở đọc luôn (backend vẫn tự kiểm quyền đọc).
  useEffect(() => {
    if (!story) return;
    void reader.open({ storyId: story.storyId });
    onStoryOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.storyId]);

  useEffect(() => {
    onReadingChange?.(reading);
    return () => onReadingChange?.(false);
  }, [reading, onReadingChange]);

  const disabled = useKidDisabledFeatures();
  const notebookOn = !disabled.has(KID_FEATURE.notebook);
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const removeLock = useRef(false);
  const scope = useRef(0);

  useEffect(() => {
    if (!token || !notebookOn) return;
    const controller = new AbortController();
    const run = ++scope.current;
    setEntries([]);
    setLoading(true);
    void childNotebookService.list(token, controller.signal).then((n) => {
      if (controller.signal.aborted || run !== scope.current) return;
      setLoading(false);
      if (n.success) setEntries(n.data ?? []);
      else showToast(n.message, 'err');
    });
    return () => {
      scope.current = run + 1;
      controller.abort();
    };
  }, [token, revision, notebookOn]);

  const remove = async (id: number) => {
    if (removeLock.current || !(await confirmDialog('Xóa từ này khỏi sổ tay?'))) return;
    removeLock.current = true;
    setRemoving(true);
    const run = scope.current;
    const r = await childNotebookService.remove(token, id);
    removeLock.current = false;
    setRemoving(false);
    if (run !== scope.current) return;
    if (r.success) refresh();
    else showToast(r.message, 'err');
  };

  // Note mở truyện báo bằng toast ("info" vì có cả câu trung tính như "Truyện này đang nghỉ…"). Đang đọc thì ChildReader tự hiện note; chỉ theo dõi note để không báo lại khi đóng truyện.
  useEffect(() => {
    if (reader.note && !reader.content) showToast(reader.note, 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reader.note]);

  const notebookRef = useRiseIn<HTMLDivElement>('.kl-panel', [pane, loading], { delay: 70 });

  if (!token) return <p className="notice">Phiên của bé đã hết hạn. Em nhờ bố mẹ mở lại nhé.</p>;
  if (reader.content) return <ChildReader reader={reader} />;

  return (
    <section
      className="ksection kid-reading kid-with-dock"
      style={{ '--tab-tint': DOCK_TINT[pane] } as CSSProperties}
    >
      {reader.busy && !reader.content && (
        <div className="kid-loading" role="status" aria-live="polite">
          <Frog mood="think" size={96} />
          <p>Đang mở truyện…</p>
          <span className="kid-spinner" aria-hidden="true" />
        </div>
      )}
      <PaneSwap key={pane} dir={dir}>
        {pane === 'lobby' && lobby}
        {!tabEnabled(pane, disabled) && <KidFeatureOff />}
        {pane === 'library' && tabEnabled(pane, disabled) && (
          <>
            <KidShelves
              token={token}
              busy={reader.busy}
              unlockTitle={unlockTitle}
              refreshKey={revision}
              onOpen={(storyId) => void reader.open({ storyId })}
              onLockChange={onLockChange}
            />
            {libraryExtra}
          </>
        )}
        {pane === 'journey' && journey}
        {pane === 'notebook' && notebookOn && (
          <div ref={notebookRef}>
            <section className="kl-panel kl-words kid-notebook-panel" aria-labelledby="kid-notebook-h" aria-busy={loading}>
              <h2 id="kid-notebook-h" className="kl-head kl-words-head display"><BookA aria-hidden="true" />Từ vựng của em</h2>
              {!loading && !entries.length && (
                <div className="kid-pane-empty">
                  <Frog mood="think" size={96} />
                  <p className="kl-words-empty">Em chưa lưu từ nào. Gặp từ mới trong truyện thì bấm lưu nhé!</p>
                </div>
              )}
              {entries.length > 0 && (
                <ul className="kid-notebook-grid">
                  {entries.map((e, i) => (
                    <li className="kl-word" key={e.entryId} style={{ animationDelay: `${Math.min(i, 12) * 0.05}s` }}>
                      <b className="display">{e.term}</b>
                      <span>{e.definition}</span>
                      <div className="kid-word-actions">
                        <IconButton
                          icon={BookOpen}
                          label={`Đọc lại đoạn có từ ${e.term}`}
                          className="kid-btn3d is-mint kid-btn-sq"
                          iconClassName=""
                          disabled={reader.busy}
                          onClick={() =>
                            void reader.open({ storyId: e.storyId }, e.sceneIndex == null ? undefined : e.sceneIndex + 1)
                          }
                        />
                        <IconButton
                          icon={Trash2}
                          label={`Xóa từ ${e.term} khỏi sổ tay`}
                          className="kid-btn3d is-pink kid-btn-sq"
                          iconClassName=""
                          disabled={removing}
                          onClick={() => void remove(e.entryId)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
        {pane === 'rewards' && tabEnabled(pane, disabled) && <KidRewards key={revision} token={token} />}
        {pane === 'wishes' && tabEnabled(pane, disabled) && (
          <KidWish key={revision} token={token} busy={reader.busy} onRead={(target) => void reader.open(target)} />
        )}
      </PaneSwap>
    </section>
  );
}
