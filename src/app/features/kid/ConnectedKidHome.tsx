'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { roadmapService } from '@/app/services/roadmapService';
import { childManualService } from '@/app/services/childManualService';
import { childAccessService } from '@/app/services/childAccessService';
import { useKidSession } from './useKidSession';
import PondBackdrop from '@/app/components/brand/PondBackdrop';
import Frog from '@/app/components/brand/Frog';
import FamilyMediaPreview from '@/app/features/authoring/FamilyMediaPreview';
import ChildReadingLibrary, { type LibraryPane } from './ChildReadingLibrary';
import KidHud, { useKidRewards } from './KidHud';
import KidLobby from './KidLobby';
import KidToday from './KidToday';
import KidShelf from './KidShelf';
import KidLeaves from './KidLeaves';
import { coverFor } from '@/app/lib/storyView';
import { BookOpen, Home, Lock } from 'lucide-react';
import { usePointerPlay, usePop } from '@/app/lib/motion';

/** Bìa sách trên kệ của bé: tên truyện in trên bìa. */
function Cover({ coverUrl, title, meta, disabled, onOpen, label }: { id: number; coverUrl?: string | null; title: string; meta?: string; disabled?: boolean; onOpen?: () => void; label?: string }) {
  const canRead = !!onOpen;
  return <button className={`bk${canRead ? ' can-read' : ' cannot-read'}`} disabled={disabled || !canRead} aria-label={canRead ? `Đọc truyện ${title}` : `${title}: ${label ?? 'chưa mở'}`} onClick={onOpen}><span className="bk-cover" style={{ background: coverFor(coverUrl) }}>{canRead ? <span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden />Đọc được</span> : <span className="pill draft bk-badge"><Lock className="ic" aria-hidden />{label ?? 'Chưa mở'}</span>}<span className="bk-name display">{title}</span></span>{meta && <span className="bk-meta">{meta}</span>}</button>;
}

export default function ConnectedKidHome({ childId, onExit, openStoryId }: { childId: number; onExit: () => void; openStoryId?: number | null }) {
  const playRef = usePointerPlay<HTMLDivElement>();
  const ended = useKidSession();
  const endedRef = usePop<HTMLElement>(ended, 0.9);
  const [roadmap, setRoadmap] = useState<B.MyRoadmapDto | null>(null);
  const [library, setLibrary] = useState<B.ParentFamilyConfirmationDto[]>([]);
  const [pack, setPack] = useState<B.ParentPreparationDto | null>(null);
  /** Truyện bé vừa bấm trong "Hành trình của em"; ChildReadingLibrary mở đọc rồi xoá giá trị này. */
  const [startStory, setStartStory] = useState<{ storyId: number } | null>(() => (openStoryId ? { storyId: openStoryId } : null));
  const [errors, setErrors] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [revision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [pane, setPane] = useState<LibraryPane>('lobby');
  // Thư viện của bé đang tạm khóa: chỉ đọc được truyện đang mở (backend chặn mọi truyện khác bằng 403).
  const [lock, setLock] = useState<{ locked: boolean; unlockStoryId: number | null }>({ locked: false, unlockStoryId: null });
  const scope = useRef(Symbol());
  // HUD và sảnh dùng chung một lần gọi phần thưởng; tải lại khi bé đọc xong một truyện (có thể vừa nhận exp, huy hiệu).
  const [readsDone, setReadsDone] = useState(0);
  const wasReading = useRef(false);
  useEffect(() => { if (wasReading.current && !reading) setReadsDone(n => n + 1); wasReading.current = reading; }, [reading]);
  const rewards = useKidRewards(childId, revision + readsDone);
  // Mở truyện gia đình từ sảnh: nội dung hiện bên dưới sảnh nên cuộn tới cho bé thấy.
  const packRef = useRef<HTMLElement>(null);
  useEffect(() => { if (pack) packRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [pack]);

  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setRoadmap(null); setLibrary([]); setPack(null); setErrors([]); setBusy(false);
    const session = childAccessService.readSession();
    if (!session || session.childProfileId !== childId) { setErrors(['Phiên của bé không khớp hồ sơ. Hãy vào lại.']); return; }
    const token = session.accessToken;
    const fail = (message: string) => { if (scope.current === run) setErrors(v => [...v, message]); };
    void childAccessService.getSessionProfile(token).then(r => { if (scope.current === run) { if (r.success && r.data?.childProfileId === childId) setNickname(r.data.nickname); else fail(r.message || 'Phiên của bé đã thay đổi.'); } });
    void roadmapService.mine(token, controller.signal).then(r => { if (scope.current === run) { if (r.success) setRoadmap(r.data); else fail(r.message); } });
    void childManualService.library(token, controller.signal).then(r => { if (scope.current === run) { if (r.success) setLibrary(r.data ?? []); else fail(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [childId, revision]);

  // Tên truyện theo mã: lấy trong hành trình của bé (đang mở, sắp tới, đã đọc) vì API khóa chỉ trả mã truyện.
  const titleOf = (id: number | null) => id == null ? undefined : [...(roadmap?.openStories ?? []), ...(roadmap?.upcoming ?? []), ...(roadmap?.done ?? [])].find(s => s?.storyId === id)?.title ?? undefined;

  const openManual = async (confirmation: B.ParentFamilyConfirmationDto) => {
    if (busy) return;
    setBusy(true); setPack(null); const run = scope.current;
    const token = childAccessService.readSession()?.accessToken ?? '';
    const r = await childManualService.package(token, confirmation.confirmationId);
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success && r.data && r.data.isReady && r.data.childProfileId === childId && r.data.storyVersionId === confirmation.storyVersionId) setPack(r.data);
    else setErrors(v => [...v, r.message || 'Truyện chưa sẵn sàng hoặc quyền đọc đã thay đổi.']);
  };

  return (
    <div ref={playRef} className={`kid${reading ? ' kid-focus' : ''}`} role="dialog" aria-label="Chế độ của bé">
      {!reading && <PondBackdrop rich playful />}
      {!reading && <KidLeaves />}
      {!reading && (
        <KidHud
          rewards={rewards}
          pane={pane}
          onPane={setPane}
          showDock={!ended && pane !== 'lobby'}
          onExit={onExit}
          onRewards={() => setPane('rewards')}
        />
      )}
      <div className="kscroll">
        <div className="khome">
          {ended ? (
            <section ref={endedRef} className="ksection kid-ended" role="status">
              <Frog mood="idle" size={150} />
              <h2 className="display">Phiên đọc đã kết thúc</h2>
              <p>Em nhờ bố mẹ mở lại nhé.</p>
              <button className="btn btn-p" onClick={onExit}><Home className="ic" aria-hidden />Về với bố mẹ</button>
            </section>
          ) : (
            <>
              <ChildReadingLibrary
                key={childId}
                childId={childId}
                pane={pane}
                onPaneChange={setPane}
                story={startStory}
                onStoryOpened={() => setStartStory(null)}
                unlockTitle={titleOf(lock.unlockStoryId)}
                onLockChange={setLock}
                onReadingChange={setReading}
                lobby={
                  <KidLobby
                    roadmap={roadmap}
                    nickname={nickname}
                    busy={busy}
                    rewards={rewards}
                    familyStories={library}
                    onRead={(storyId) => setStartStory({ storyId })}
                    onOpenLibrary={() => setPane('library')}
                    onRewards={() => setPane('rewards')}
                    onJourney={() => setPane('journey')}
                    childId={childId}
                    onNotebook={() => setPane('notebook')}
                    onWishes={() => setPane('wishes')}
                    onOpenFamily={(c) => void openManual(c)}
                  />
                }
                journey={
                  <KidToday
                    roadmap={roadmap}
                    nickname={nickname}
                    busy={busy}
                    onRead={(storyId) => setStartStory({ storyId })}
                    onOpenLibrary={() => setPane('library')}
                  />
                }
                libraryExtra={
                  library.length > 0 ? (
                    <KidShelf title="Truyện gia đình dành cho em" icon={Home} tone="gold" hasMore={false}>
                      {library.map(c => (
                        <Cover
                          key={c.confirmationId}
                          id={c.storyId}
                          title={"Truyện gia đình #" + c.storyId}
                          meta="Bố mẹ giao cho em"
                          disabled={busy}
                          onOpen={() => void openManual(c)}
                        />
                      ))}
                    </KidShelf>
                  ) : null
                }
              />
              {!reading && (
                <>
                  {errors.map((e, i) => <p className="notice err" role="alert" key={i}>{e}</p>)}
                  {pack ? (
                    <article ref={packRef} className="ksection">
                      <button className="btn btn-s" onClick={() => { setPack(null); setPane('library'); }}>Về thư viện</button>
                      <h2 className="display">{pack.title}</h2>
                      {pack.segments.slice().sort((a, b) => a.order - b.order).map((s, i) => (
                        <p key={i} style={{ whiteSpace: 'pre-wrap', fontSize: "var(--fs-xl)", lineHeight: 1.8 }}>{s.text}</p>
                      ))}
                      <FamilyMediaPreview preparation={pack} />
                      <p className="sub">Để lưu vị trí và hoàn thành đọc, em mở truyện trong mục Đọc và nghe truyện.</p>
                    </article>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
