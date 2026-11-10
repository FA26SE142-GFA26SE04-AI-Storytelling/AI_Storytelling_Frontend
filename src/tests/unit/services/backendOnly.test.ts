import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {afterEach,expect,it,vi} from 'vitest';
import {guardianService} from '@/app/services/guardianService';
import {roadmapService} from '@/app/services/roadmapService';
import {staffService} from '@/app/services/staffService';
import {authService} from '@/app/services/authService';
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();});
const files=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(path.join(dir,d.name)):[path.join(dir,d.name)]);
it('ships no runtime data simulators, imports or mock switch',()=>{
 const source=files('app').filter(p=>/\.tsx?$/.test(p));
 expect(source.filter(p=>/[\\/]mocks[\\/]|(?:guardian|reading|adaptive|staff|notification)Local\.ts$/.test(p))).toEqual([]);
 for(const file of source){const text=readFileSync(file,'utf8');expect(text,file).not.toMatch(/USE_MOCK|NEXT_PUBLIC_USE_MOCK|contractMock|(?:from\s+['"][^'"]*(?:\/mocks\/|(?:guardian|reading|adaptive|staff|notification)Local))/);}
});
it('does not keep facades for removed progress, hold mode or staff APIs',()=>{
 for(const key of ['dashboard','reports','completions','holdCase','unlockHold'])expect(key in guardianService).toBe(false);
 expect('metrics' in staffService).toBe(false);expect('applications' in staffService).toBe(false);
});
it('cannot be switched back to mock data by an obsolete environment flag',async()=>{
 vi.stubEnv('NEXT_PUBLIC_USE_MOCK','true');const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:false,message:'Forbidden',data:null}),{status:403}));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');
 const r=await roadmapService.get(10);expect(fetcher).toHaveBeenCalledTimes(1);expect(r.success).toBe(false);expect(r.status).toBe(403);expect(r.data).toBeNull();
});
