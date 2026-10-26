import { API_BASE_URL } from './apiConfig';
export const CORE_ORIGIN=API_BASE_URL.replace(/\/api\/v1\/?$/,'');
export interface HealthResult { ok:boolean; status:number; detail:string }
async function read(path:string,signal?:AbortSignal):Promise<HealthResult>{
 try {const r=await fetch(CORE_ORIGIN+path,{method:'GET',signal:signal??AbortSignal.timeout(5000),cache:'no-store',credentials:'omit'});return {ok:r.ok,status:r.status,detail:await r.text()};}
 catch {return {ok:false,status:0,detail:'Chưa nhận được phản hồi máy chủ.'};}
}
export const healthService={liveness:(signal?:AbortSignal)=>read('/health',signal),readiness:(signal?:AbortSignal)=>read('/healthz',signal)};
