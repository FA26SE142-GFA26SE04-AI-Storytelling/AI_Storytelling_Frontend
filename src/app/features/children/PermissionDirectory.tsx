'use client';
import { useEffect,useState } from 'react';
import { permissionService } from '@/app/services/permissionService';
import { supervisionService } from '@/app/services/supervisionService';
import { PERMISSIONS } from '@/app/lib/guardian';
import type { SupervisionRelationship, Permission } from '@/app/types/supervision';
export default function PermissionDirectory({childId,isOwner,onChanged}:{childId:number;isOwner:boolean;onChanged:()=>void}) {
 const [catalog,setCatalog]=useState<string[]>([]);const [rels,setRels]=useState<SupervisionRelationship[]>([]);const [id,setId]=useState(0);const [granted,setGranted]=useState<string[]|null>(null);const [note,setNote]=useState('');const [busy,setBusy]=useState(false);const [refresh,setRefresh]=useState(0);
 useEffect(()=>{let alive=true;const c=new AbortController();void Promise.all([permissionService.catalog(c.signal),supervisionService.listSupervisors(childId)]).then(([a,b])=>{if(alive){setCatalog(a.data??[]);setRels(b.data??[]);if(!a.success||!b.success)setNote(!a.success?a.message:b.message);}});return()=>{alive=false;c.abort();};},[childId]);
 useEffect(()=>{let alive=true;setGranted(null);if(id)void permissionService.list(id).then(r=>{if(alive){setGranted(r.data);if(!r.success)setNote(r.message);}});return()=>{alive=false;};},[id,refresh]);
 const toggle=async(p:Permission)=>{if(busy||!isOwner||!granted)return;setBusy(true);const r=granted.includes(p)?await permissionService.revoke(id,p):await permissionService.grant(id,p);setBusy(false);setNote(r.message);if(r.success){setRefresh(v=>v+1);onChanged();}};
 return <details><summary>Danh mục quyền và quyền của từng người</summary><p className="sub">Danh mục hiện hành: {catalog.map(p=>PERMISSIONS.find(x=>x.id===p)?.label??p).join(', ')}</p><label className="field">Người giám sát<select className="inp" value={id} disabled={busy} onChange={e=>setId(Number(e.target.value))}><option value={0}>Chọn người giám sát</option>{rels.filter(r=>r.supervisorRole!=='Owner').map(r=><option key={r.id} value={r.id}>Người giám sát #{r.supervisorUserId}</option>)}</select></label>{granted&&PERMISSIONS.filter(p=>catalog.includes(p.id)).map(p=><label className="row" key={p.id}><input type="checkbox" checked={granted.includes(p.id)} disabled={!isOwner||busy} onChange={()=>void toggle(p.id)}/>{p.label}</label>)}{note&&<p className="notice" role="status">{note}</p>}</details>;
}
