"use client";
import {useCallback,useEffect,useState} from 'react';
import {Eye,EyeOff,Plus} from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import {staffService} from '@/app/services/staffService';
import type {ContentCategory,ContentCategoryGroup} from '@/app/types/childProfile';
import {AGE_BANDS} from '@/app/lib/guardian';
import {Notice,Page,useAction} from './ui';
import CategoryDetails from './CategoryDetails';
import { confirmDialog } from "@/app/lib/confirm";
/** Nhóm nhãn backend chấp nhận; nhãn tiếng Việt chỉ để hiển thị. */
const CATEGORY_GROUPS: { id: ContentCategoryGroup; label: string }[] = [
  { id: 'Genre', label: 'Thể loại' },
  { id: 'LifeValue', label: 'Giá trị và kỹ năng sống' },
  { id: 'Learning', label: 'Học tập' },
  { id: 'SafetyWarning', label: 'Cảnh báo an toàn' },
];
const groupLabel = (group?: ContentCategoryGroup) => CATEGORY_GROUPS.find((g) => g.id === group)?.label ?? group ?? '—';
/** Màn quản lý danh mục của Moderator (backend chỉ cho Moderator tạo/sửa/xoá). */
export default function AdminCatalog(){
 const [cats,setCats]=useState<ContentCategory[]>([]);
 const [newCat,setNewCat]=useState<{code:string;displayName:string;group:ContentCategoryGroup}>({code:'',displayName:'',group:'Genre'});
 const [loadError,setLoadError]=useState('');
 const [addOpen,setAddOpen]=useState(false);
 // Lấy cả danh mục đã ẩn để Moderator có thể hiện lại.
 const load=useCallback(async()=>{const r=await staffService.categories(true);setCats(r.data??[]);setLoadError(r.success?'':r.message);},[]);
 useEffect(()=>{void load();},[load]);
 const {note,busy,run}=useAction(load);
 return <Page title="Danh mục nội dung"><Notice note={note}/>{loadError&&<p className="notice err" role="alert">{loadError}</p>}
      <div className="st-card">
        <h3>Danh mục nội dung</h3>
        <p className="sub">Dùng chung cho cài đặt an toàn của bé, bộ lọc và nhãn nội dung. Ẩn danh mục chỉ bỏ khỏi lựa chọn mới, không xoá nhãn cũ.</p>
        <table className="st-table stack-table">
          <thead><tr><th>Mã</th><th>Tên hiển thị</th><th>Nhóm</th><th title="Hồ sơ bé mới thuộc nhóm tuổi này được chặn sẵn danh mục">Chặn mặc định cho</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td data-label="Mã"><code>{c.code}</code><CategoryDetails id={c.id} onChanged={()=>void load()}/></td>
                <td data-label="Tên hiển thị"><input className="inp" defaultValue={c.displayName} aria-label={`Tên ${c.code}`} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.displayName) void run(() => staffService.updateCategory(c.id, e.target.value.trim(), c.isActive)); }} /></td>
                <td data-label="Nhóm">{groupLabel(c.group)}</td>
                <td data-label="Chặn mặc định cho"><div className="chips">{AGE_BANDS.map((a) => {
                  const on = c.defaultBlockedAgeBands?.includes(a.id) ?? false;
                  const next = on ? (c.defaultBlockedAgeBands ?? []).filter((x) => x !== a.id) : [...(c.defaultBlockedAgeBands ?? []), a.id];
                  return <button key={a.id} type="button" className={`chip sm${on ? " on" : ""}`} disabled={busy} aria-pressed={on}
                    onClick={() => void run(() => staffService.updateCategory(c.id, c.displayName, c.isActive, next))}>{a.label}</button>;
                })}</div></td>
                <td data-label="Trạng thái"><span className={`pill ${c.isActive ? "ok" : "draft"}`}>{c.isActive ? "Đang dùng" : "Đã ẩn"}</span></td>
                <td data-label=""><button className="btn btn-g" disabled={busy} onClick={async () => { if (c.isActive && !(await confirmDialog(`Ẩn danh mục “${c.displayName}”? Danh mục ẩn sẽ không còn chọn được trong chính sách an toàn.`))) return; void run(() => staffService.updateCategory(c.id, c.displayName, !c.isActive)); }}>{c.isActive ? <><EyeOff className="ic" />Ẩn</> : <><Eye className="ic" />Hiện lại</>}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row"><button className="btn btn-p" onClick={() => setAddOpen(true)}><Plus className="ic" />Thêm danh mục</button></div>
        {addOpen && <Dialog title="Thêm danh mục" onClose={() => setAddOpen(false)}>
          <input className="inp" value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} placeholder="MÃ_DANH_MỤC" aria-label="Mã" />
          <input className="inp" value={newCat.displayName} onChange={(e) => setNewCat({ ...newCat, displayName: e.target.value })} placeholder="Tên hiển thị" aria-label="Tên hiển thị" />
          <select className="inp" value={newCat.group} onChange={(e) => setNewCat({ ...newCat, group: e.target.value as ContentCategoryGroup })} aria-label="Nhóm">
            {CATEGORY_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <button className="btn btn-p" disabled={busy || !newCat.code || !newCat.displayName.trim()} onClick={() => void run(() => staffService.createCategory(newCat.code, newCat.displayName.trim(), newCat.group, true)).then((ok) => { if (ok) { setNewCat({ code: "", displayName: "", group: "Genre" }); setAddOpen(false); } })}><Plus className="ic" />Thêm</button>
        </Dialog>}
      </div>

</Page>;
}
