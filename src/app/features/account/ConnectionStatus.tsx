'use client';
import { useEffect,useState } from 'react';
import { healthService, type HealthResult } from '@/app/services/healthService';
export default function ConnectionStatus(){
 const [live,setLive]=useState<HealthResult|null>(null);const [ready,setReady]=useState<HealthResult|null>(null);const [refresh,setRefresh]=useState(0);
 useEffect(()=>{let alive=true;const c=new AbortController();void Promise.all([healthService.liveness(c.signal),healthService.readiness(c.signal)]).then(([a,b])=>{if(alive){setLive(a);setReady(b);}});return()=>{alive=false;c.abort();};},[refresh]);
 return <section className="sec"><h3>Kết nối máy chủ</h3><p>{live===null?'Đang kiểm tra…':live.ok?'Máy chủ đang phản hồi.':`Máy chủ chưa phản hồi thành công (${live.status||'không có kết nối'}).`}</p><p>{ready===null?'Đang kiểm tra khả năng phục vụ…':ready.ok?'Các dịch vụ đã sẵn sàng.':`Các dịch vụ chưa báo sẵn sàng (${ready.status||'không có kết nối'}).`}</p><button className="btn btn-s" onClick={()=>setRefresh(v=>v+1)}>Kiểm tra kết nối</button></section>;
}
