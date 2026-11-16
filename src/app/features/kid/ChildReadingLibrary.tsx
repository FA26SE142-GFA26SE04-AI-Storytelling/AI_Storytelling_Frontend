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
import KidDock, { DOCK_TINT, type DockTab } from './KidDock';
import IconButton from '@/app/components/IconButton';
import './child-reading.css';
import Frog from '@/app/components/brand/Frog';
import { BookOpen, Trash2 } from 'lucide-react';
import PaneSwap from './PaneSwap';

export default function ChildReadingLibrary({
  childId,
  story,
  unlockTitle,
  hero,
  onStoryOpened,
  onLockChange,
  onPaneChange,
  onReadingChange,
}: {
  childId: number;
  /** Khung "Hôm nay em đọc" hiện đầu tab Truyện. */
  hero?: ReactNode;
  story?: { storyId: number } | null;
  unlockTitle?: string;
  onStoryOpened?: () => void;
  onLockChange?: (lock: { locked: boolean; unlockStoryId: number | null }) => void;
  onPaneChange?: (pane: string) => void;
  onReadingChange?: (active: boolean) => void;
}) {
  const session = childAccessService.readSession();
  const token = session?.childProfileId === childId ? session.accessToken : '';
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  const reader = useChildReader(token, refresh);
  const reading = !!reader.content;

  // Hướng trượt theo thứ tự tab: sang tab bên phải thì nội dung trượt vào từ phải, về tab bên trái thì từ trái.
  const PANE_ORDER: DockTab[] = ['stories', 'notebook', 'wishes', 'rewards'];
  const [nav, setNav] = useState<{ pane: DockTab; dir: 1 | -1 }>({ pane: 'stories', dir: 1 });
  const { pane, dir } = nav;
  const setPane = (next: DockTab) =>
    setNav((cur) => ({ pane: next, dir: PANE_ORDER.indexOf(next) >= PANE_ORDER.indexOf(cur.pane) ? 1 : -1 }));

  // Các kệ bên dưới chỉ thuộc tab Truyện của em; báo tab đang chọn cho trang cha.
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

  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [removing, setRemoving] = useState(false);
  const removeLock = useRef(false);
  const scope = useRef(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const run = ++scope.current;
    setEntries([]);
    setLoading(true);
    setNote('');
    void childNotebookService.list(token, controller.signal).then((n) => {
      if (controller.signal.aborted || run !== scope.current) return;
      setLoading(false);
      if (n.success) setEntries(n.data ?? []);
      else setNote(n.message);
    });
    return () => {
      scope.current = run + 1;
      controller.abort();
    };
  }, [token, revision]);

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
    else setNote(r.message);
  };

  if (!token) return <p className="notice">Phiên của bé đã hết hạn. Em nhờ bố mẹ mở lại nhé.</p>;
  if (reader.content) return <ChildReader reader={reader} />;

  return (
    <section
      className="ksection kid-reading kid-with-dock"
      style={{ '--tab-tint': DOCK_TINT[pane] } as CSSProperties}
    >
      <KidDock value={pane} onChange={setPane} />
      {reader.busy && !reader.content && (
        <div className="kid-loading" role="status" aria-live="polite">
          <Frog mood="think" size={96} />
          <p>Đang mở truyện…</p>
          <span className="kid-spinner" aria-hidden="true" />
        </div>
      )}
      {reader.note && <p role="status" className="kid-toast">{reader.note}</p>}
      {note && <p role="status" className="kid-toast">{note}</p>}
      <PaneSwap key={pane} dir={dir}>
        {pane === 'stories' && (
          <>
            {hero}
            <KidShelves
              token={token}
              busy={reader.busy}
              unlockTitle={unlockTitle}
              refreshKey={revision}
              onOpen={(storyId) => void reader.open({ storyId })}
              onLockChange={onLockChange}
            />
          </>
        )}
        {pane === 'notebook' && (
          <>
            {!loading && !entries.length && <p className="kid-empty">Chưa có từ nào trong sổ tay.</p>}
            <div className="kid-notebook">
              {entries.map((e) => (
                <article className="kcard kid-word-card" key={e.entryId}>
                  <h3>{e.term}</h3>
                  <p>{e.definition}</p>
                  <div className="row">
                    <IconButton
                      icon={BookOpen}
                      label={`Đọc lại đoạn có từ ${e.term}`}
                      disabled={reader.busy}
                      onClick={() =>
                        void reader.open(
                          { storyId: e.storyId },
                          e.sceneIndex == null ? undefined : e.sceneIndex + 1
                        )
                      }
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Xóa từ ${e.term} khỏi sổ tay`}
                      className="btn btn-no"
                      disabled={removing}
                      onClick={() => void remove(e.entryId)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {pane === 'rewards' && <KidRewards key={revision} token={token} />}
        {pane === 'wishes' && (
          <KidWish key={revision} token={token} busy={reader.busy} onRead={(target) => void reader.open(target)} />
        )}
      </PaneSwap>
    </section>
  );
}
