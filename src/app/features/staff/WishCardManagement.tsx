'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Pencil, Plus, RefreshCw } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import SafeImage from '@/app/components/SafeImage';
import Select from '@/app/components/Select';
import { wishCardService } from '@/app/services/wishCardService';
import { staffService } from '@/app/services/staffService';
import type { ContentCategory } from '@/app/types/childProfile';
import type { PagedResult } from '@/app/types/backendContracts';
import type { ManagedWishCardGroup, WishCardDto } from '@/app/types/storyWish';
import '@/app/features/review/review-tools.css';
import { Page } from './ui';
import WishCardDialog, {
  EMPTY_WISH_FORM,
  type WishCardForm,
  wishCardValidationProblem,
} from './WishCardDialog';

export const WISH_GROUPS: { id: ManagedWishCardGroup; label: string; wish: boolean }[] = [
  { id: 'Character', label: 'Nhân vật', wish: true },
  { id: 'Place', label: 'Nơi chốn', wish: true },
  { id: 'Challenge', label: 'Thử thách', wish: true },
  { id: 'Lesson', label: 'Bài học', wish: true },
  { id: 'Desire', label: 'Bạn ấy muốn gì (Bé sáng tác)', wish: false },
  { id: 'Event', label: 'Chuyện gì xảy ra (Bé sáng tác)', wish: false },
  { id: 'Ending', label: 'Kết thúc (Bé sáng tác)', wish: false },
];

export const groupLabel = (g: string) => WISH_GROUPS.find(x => x.id === g)?.label ?? g;

const GROUP_OPTIONS: { value: ManagedWishCardGroup | ''; label: string }[] = [
  { value: '', label: 'Mọi nhóm' },
  ...WISH_GROUPS.map(g => ({ value: g.id, label: g.label })),
];

const ACTIVE_OPTIONS: { value: '' | 'true' | 'false'; label: string }[] = [
  { value: '', label: 'Đang dùng và đã ẩn' },
  { value: 'true', label: 'Đang dùng' },
  { value: 'false', label: 'Đã ẩn' },
];

const toForm = (c: WishCardDto): WishCardForm => ({
  group: c.group as ManagedWishCardGroup,
  label: c.label,
  imageUrl: c.imageUrl,
  audioUrl: c.audioUrl ?? '',
  ageBand: c.ageBand ?? '',
  contentCategoryId: c.contentCategoryId?.toString() ?? '',
  sortOrder: String(c.sortOrder),
});

/** Moderator/Administrator quản lý bộ thẻ ước (catalog/trạng thái hoạt động). Thẻ chỉ ẩn, không xóa. */
export default function WishCardManagement() {
  const [group, setGroup] = useState<ManagedWishCardGroup | ''>('');
  const [active, setActive] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<PagedResult<WishCardDto> | null>(null);
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [loadError, setLoadError] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; mode: 'view' | 'edit' | 'create' }>({ open: false, mode: 'create' });
  const [editing, setEditing] = useState<WishCardDto | null>(null);
  const [form, setForm] = useState<WishCardForm>(EMPTY_WISH_FORM);
  const [rowAudioErrors, setRowAudioErrors] = useState<Record<number, boolean>>({});
  const listScope = useRef(Symbol());
  const detailCtrl = useRef<AbortController | null>(null);
  const submitLock = useRef(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const loadList = useCallback(async (signal?: AbortSignal) => {
    const run = Symbol();
    listScope.current = run;
    const r = await wishCardService.list(
      { group: group || undefined, isActive: active === '' ? undefined : active === 'true', pageIndex: page, pageSize: 20 },
      signal,
    );
    if (signal?.aborted || listScope.current !== run) return;
    if (r.success && r.data) {
      setList(r.data);
      setLoadError('');
      setRowAudioErrors({});
    } else {
      setLoadError(r.message || 'Không tải được danh sách thẻ ước.');
    }
  }, [group, active, page]);

  useEffect(() => {
    const controller = new AbortController();
    void loadList(controller.signal);
    return () => controller.abort();
  }, [loadList]);

  useEffect(() => {
    const controller = new AbortController();
    void staffService.categories().then(r => {
      if (!controller.signal.aborted && r.data) setCats(r.data);
    });
    return () => controller.abort();
  }, []);

  const restoreFocus = () => {
    const el = triggerRef.current;
    triggerRef.current = null;
    if (el && typeof el.focus === 'function') queueMicrotask(() => el.focus());
  };

  const closeDialog = () => {
    detailCtrl.current?.abort();
    setModal({ open: false, mode: 'create' });
    setEditing(null);
    setForm(EMPTY_WISH_FORM);
    setSaveError('');
    restoreFocus();
  };

  const fetchLatestCard = (cardId: number, baselineForm: WishCardForm | null, forceFormUpdate = false) => {
    detailCtrl.current?.abort();
    const controller = new AbortController();
    detailCtrl.current = controller;
    void wishCardService.get(cardId, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (!r.success || !r.data) {
        setSaveError(r.message || 'Không tải lại được chi tiết thẻ.');
        return;
      }
      const fresh = r.data;
      setEditing(cur => (cur?.id === cardId ? fresh : cur));
      if (forceFormUpdate || !baselineForm) {
        setForm(toForm(fresh));
      } else {
        setForm(prev => (JSON.stringify(prev) === JSON.stringify(baselineForm) ? toForm(fresh) : prev));
      }
    });
  };

  const openExisting = (c: WishCardDto, mode: 'view' | 'edit') => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const listed = toForm(c);
    setEditing(c);
    setForm(listed);
    setSaveError('');
    setModal({ open: true, mode });
    fetchLatestCard(c.id, listed, false);
  };

  const openCreate = () => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    detailCtrl.current?.abort();
    setEditing(null);
    setForm(EMPTY_WISH_FORM);
    setSaveError('');
    setModal({ open: true, mode: 'create' });
  };

  const save = async () => {
    if (busy || submitLock.current || wishCardValidationProblem(form)) return;
    submitLock.current = true;
    setBusy(true);
    setSaveError('');
    setNote(null);
    const body = {
      label: form.label.trim(),
      imageUrl: form.imageUrl.trim(),
      audioUrl: form.audioUrl.trim() || null,
      ageBand: form.ageBand || null,
      contentCategoryId: form.contentCategoryId ? Number(form.contentCategoryId) : null,
      sortOrder: Number(form.sortOrder),
    };
    const r = editing
      ? await wishCardService.update(editing.id, body)
      : await wishCardService.create({ ...body, group: form.group });
    submitLock.current = false;
    setBusy(false);
    if (!r.success) {
      setSaveError(r.message || 'Không lưu được thẻ ước; dữ liệu bạn vừa nhập vẫn được giữ.');
      return;
    }
    setNote({ ok: true, text: r.message || (editing ? 'Đã lưu thẻ ước.' : 'Đã thêm thẻ ước mới.') });
    closeDialog();
    await loadList();
  };

  const toggleActive = async (c: WishCardDto) => {
    if (busy || submitLock.current) return;
    submitLock.current = true;
    setBusy(true);
    setNote(null);
    const r = await wishCardService.setActive(c.id, !c.isActive);
    submitLock.current = false;
    setBusy(false);
    if (!r.success) {
      setNote({ ok: false, text: r.message || 'Không đổi được trạng thái thẻ; giữ nguyên trạng thái từ máy chủ.' });
      await loadList();
      return;
    }
    setNote({ ok: true, text: r.message || (c.isActive ? `Đã ẩn thẻ “${c.label}”.` : `Đã bật lại thẻ “${c.label}”.`) });
    await loadList();
  };

  const catName = (id: number | null) => (id == null ? '—' : cats.find(c => c.id === id)?.displayName ?? `#${id}`);

  return (
    <Page title="Thẻ ước" sub="Thẻ hình bé chọn khi ước một câu chuyện. Ẩn thẻ chỉ bỏ khỏi lựa chọn mới; điều ước và truyện đã gắn thẻ vẫn giữ nguyên.">
      {note && <p className={`notice ${note.ok ? 'ok' : 'err'}`} role={note.ok ? 'status' : 'alert'} data-inline-notice>{note.text}</p>}
      {loadError && <p className="notice err" role="alert" data-inline-notice>{loadError}</p>}

      <div className="row st-wrap">
        <Select<ManagedWishCardGroup | ''>
          ariaLabel="Lọc theo nhóm"
          value={group}
          options={GROUP_OPTIONS}
          onChange={v => { setGroup(v); setPage(1); }}
        />
        <Select<'' | 'true' | 'false'>
          ariaLabel="Lọc theo trạng thái"
          value={active}
          options={ACTIVE_OPTIONS}
          onChange={v => { setActive(v); setPage(1); }}
        />
        <button type="button" className="btn btn-g" disabled={busy} onClick={() => void loadList()}>
          <RefreshCw className="ic" />Tải lại
        </button>
        <IconButton icon={Plus} label="Thêm thẻ mới" className="btn btn-p" style={{ flex: 'none', minWidth: 44 }} disabled={busy} onClick={openCreate} />
      </div>

      <div className="st-card">
        <table className="st-table stack-table">
          <thead>
            <tr><th>Hình</th><th>Nhãn</th><th>Nhóm</th><th>Tuổi</th><th>Nhãn nội dung</th><th>Thứ tự</th><th>Trạng thái</th><th /></tr>
          </thead>
          <tbody>
            {list?.items.map(c => (
              <tr key={c.id} className={editing?.id === c.id ? 'on' : undefined}>
                <td data-label="Hình">
                  <SafeImage src={c.imageUrl} alt="" width={44} height={44} style={{ objectFit: 'contain', borderRadius: 8 }} />
                </td>
                <td data-label="Nhãn">
                  <b>{c.label}</b>
                  {c.audioUrl && (
                    <div>
                      <audio controls preload="none" src={c.audioUrl} style={{ height: 28, maxWidth: 180 }} onError={() => setRowAudioErrors(prev => ({ ...prev, [c.id]: true }))} />
                      {rowAudioErrors[c.id] && <small className="sub" style={{ display: 'block' }}>Không tải được âm thanh.</small>}
                    </div>
                  )}
                </td>
                <td data-label="Nhóm">{groupLabel(c.group)}</td>
                <td data-label="Tuổi">{c.ageBand ?? 'Mọi tuổi'}</td>
                <td data-label="Nhãn nội dung">{catName(c.contentCategoryId)}</td>
                <td data-label="Thứ tự">{c.sortOrder}</td>
                <td data-label="Trạng thái"><span className={`pill ${c.isActive ? 'ok' : 'draft'}`}>{c.isActive ? 'Đang dùng' : 'Đã ẩn'}</span></td>
                <td data-label="Thao tác">
                  <div className="row">
                    <IconButton icon={FileText} label={`Xem thẻ ${c.label}`} disabled={busy} onClick={() => openExisting(c, 'view')} />
                    <IconButton icon={Pencil} label={`Sửa thẻ ${c.label}`} disabled={busy} onClick={() => openExisting(c, 'edit')} />
                    <IconButton
                      icon={c.isActive ? EyeOff : Eye}
                      label={`${c.isActive ? 'Ẩn' : 'Hiện lại'} thẻ ${c.label}`}
                      className="btn btn-g"
                      disabled={busy}
                      onClick={() => void toggleActive(c)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {list && !list.items.length && <tr><td colSpan={8} className="sub">Chưa có thẻ nào khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
        <div className="row">
          <IconButton icon={ChevronLeft} label="Trang trước" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)} />
          <span>Trang {page}{list ? `/${Math.max(1, list.totalPages)}` : ''}</span>
          <IconButton icon={ChevronRight} label="Trang sau" disabled={busy || !list?.hasNextPage} onClick={() => setPage(p => p + 1)} />
        </div>
      </div>

      {modal.open && (
        <WishCardDialog
          mode={modal.mode}
          editing={editing}
          form={form}
          categories={cats}
          groups={WISH_GROUPS}
          busy={busy}
          saveError={saveError}
          onFormChange={setForm}
          onSwitchToEdit={() => { setSaveError(''); setModal(prev => ({ ...prev, mode: 'edit' })); }}
          onReloadCard={() => { if (editing) fetchLatestCard(editing.id, null, true); }}
          onSave={() => void save()}
          onClose={closeDialog}
        />
      )}
    </Page>
  );
}
