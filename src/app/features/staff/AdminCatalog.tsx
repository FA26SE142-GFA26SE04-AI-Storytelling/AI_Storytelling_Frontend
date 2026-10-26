"use client";
import {useCallback,useEffect,useState} from 'react';
import {Plus} from 'lucide-react';
import {staffService} from '@/app/services/staffService';
import type {ContentCategory} from '@/app/types/childProfile';
import {AGE_BANDS} from '@/app/lib/guardian';
import {Notice,Page,useAction} from './ui';
import CategoryDetails from './CategoryDetails';
export default function AdminCatalog(){
 const [cats,setCats]=useState<ContentCategory[]>([]);
 const [newCat,setNewCat]=useState({code:'',displayName:''});
 const [loadError,setLoadError]=useState('');
 const load=useCallback(async()=>{const r=await staffService.categories();setCats(r.data??[]);setLoadError(r.success?'':r.message);},[]);
 useEffect(()=>{void load();},[load]);
 const {note,busy,run}=useAction(load);
 return <Page title="Danh mục nội dung"><Notice note={note}/>{loadError&&<p className="notice err">{loadError}</p>}
      <div className="st-card">
        <h3>Danh mục nội dung</h3>
        <p className="sub">Dùng chung cho cài đặt an toàn của bé, bộ lọc và nhãn nội dung. Ẩn danh mục chỉ bỏ khỏi lựa chọn mới, không xoá nhãn cũ.</p>
        <table className="st-table">
          <thead><tr><th>Mã</th><th>Tên hiển thị</th><th title="Hồ sơ bé mới thuộc nhóm tuổi này được chặn sẵn danh mục">Chặn mặc định cho</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td><code>{c.code}</code><CategoryDetails id={c.id} onChanged={()=>void load()}/></td>
                <td><input className="inp" defaultValue={c.displayName} aria-label={`Tên ${c.code}`} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.displayName) void run(() => staffService.updateCategory(c.id, e.target.value.trim(), c.isActive)); }} /></td>
                <td><div className="chips">{AGE_BANDS.map((a) => {
                  const on = c.defaultBlockedAgeBands?.includes(a.id) ?? false;
                  const next = on ? (c.defaultBlockedAgeBands ?? []).filter((x) => x !== a.id) : [...(c.defaultBlockedAgeBands ?? []), a.id];
                  return <button key={a.id} type="button" className={`chip sm${on ? " on" : ""}`} disabled={busy} aria-pressed={on}
                    onClick={() => void run(() => staffService.updateCategory(c.id, c.displayName, c.isActive, next))}>{a.label}</button>;
                })}</div></td>
                <td><span className={`pill ${c.isActive ? "ok" : "draft"}`}>{c.isActive ? "Đang dùng" : "Đã ẩn"}</span></td>
                <td><button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.updateCategory(c.id, c.displayName, !c.isActive))}>{c.isActive ? "Ẩn" : "Hiện lại"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row">
          <input className="inp" style={{ maxWidth: 180 }} value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} placeholder="MÃ_DANH_MỤC" aria-label="Mã" />
          <input className="inp" value={newCat.displayName} onChange={(e) => setNewCat({ ...newCat, displayName: e.target.value })} placeholder="Tên hiển thị" aria-label="Tên hiển thị" />
          <button className="btn btn-p" disabled={busy || !newCat.code || !newCat.displayName.trim()} onClick={() => void run(() => staffService.createCategory(newCat.code, newCat.displayName.trim(), true)).then((ok) => ok && setNewCat({ code: "", displayName: "" }))}><Plus className="ic" />Thêm</button>
        </div>
      </div>

<p className="notice">Backend chưa cung cấp API Prompt Catalog, thẻ ước, bài học gợi ý và nhân vật mẫu.</p></Page>;
}
