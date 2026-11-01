'use client';
import { useEffect,useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { healthService, type HealthResult } from '@/app/services/healthService';

/** Trạng thái kết nối tới máy chủ: phản hồi (liveness) và sẵn sàng phục vụ (readiness). */
export default function ConnectionStatus(){
 const [live,setLive]=useState<HealthResult|null>(null);const [ready,setReady]=useState<HealthResult|null>(null);const [refresh,setRefresh]=useState(0);
 useEffect(()=>{let alive=true;const c=new AbortController();void Promise.all([healthService.liveness(c.signal),healthService.readiness(c.signal)]).then(([a,b])=>{if(alive){setLive(a);setReady(b);}});return()=>{alive=false;c.abort();};},[refresh]);
 const line=(r:HealthResult|null,ok:string,bad:string,wait:string)=>{
  const tone=r===null?'wait':r.ok?'ok':'bad';
  return <div className="conn-row"><i className={`conn-dot ${tone}`} aria-hidden /><span>{r===null?wait:r.ok?ok:`${bad} (${r.status||'không có kết nối'})`}</span></div>;
 };
 return <section className="sec" style={{ gap: 4 }}>
  <div className="row"><h3 className="display grow" style={{ margin: 0 }}>Kết nối máy chủ</h3><button className="btn btn-g" aria-label="Kiểm tra kết nối" onClick={()=>setRefresh(v=>v+1)}><RefreshCw className="ic" /></button></div>
  {line(live,'Máy chủ đang phản hồi','Máy chủ chưa phản hồi','Đang kiểm tra…')}
  {line(ready,'Các dịch vụ đã sẵn sàng','Các dịch vụ chưa sẵn sàng','Đang kiểm tra…')}
 </section>;
}
