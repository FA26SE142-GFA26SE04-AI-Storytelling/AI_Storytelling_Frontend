/** Static route evidence; runtime behavior is verified separately. */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const doc = fs.readFileSync(path.resolve(root, '../../AI_Storytelling_Backend/docs/API_FRONTEND_ACTOR_FLOWS.md'), 'utf8');
const normalize = s => s.replace(/\?.*$/, '').replace(/\{[^}]*\}/g, '{}').replace(/\/+$/, '');
const routes = [...doc.matchAll(/^#### (GET|POST|PUT|PATCH|DELETE) (\/api\/v1\/\S+)/gm)].map(m => ({ method:m[1], route:m[2],authorization:doc.slice(m.index,m.index+1800).match(/^- Quyền: (.+)$/m)?.[1]??'See controller' }));
routes.push({method:'POST',route:'/api/v1/creator/stories/{storyId}/manual/confirm-content',authorization:'ContentCreator (current local backend extension)'});
const controllerDir=path.resolve(root,'../../AI_Storytelling_Backend/src/Core/StoryPlatform.Api/Controllers');
const sourceCount=fs.readdirSync(controllerDir).filter(p=>p.endsWith('Controller.cs')).reduce((sum,p)=>sum+[...fs.readFileSync(path.join(controllerDir,p),'utf8').matchAll(/\[Http(?:Get|Post|Put|Patch|Delete)\b/g)].length,0);
if(sourceCount!==routes.length){
 const message=`Controller inventory changed: source=${sourceCount}, document=${routes.length}`;
 if(!process.argv.includes('--catalog-only'))throw new Error(message);
 console.error(message+'; checking the documented catalog only.');
}
const walkFiles = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(d => d.isDirectory() ? walkFiles(path.join(dir,d.name)) : /\.tsx?$/.test(d.name) ? [path.join(dir,d.name)] : []);
const all = walkFiles(path.join(root,'app'));
const usages = all.map(p => ({p,text:fs.readFileSync(p,'utf8')}));
const evidence=[];
for(const file of all.filter(p=>p.includes(`${path.sep}services${path.sep}`))) {
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const vars=new Map();
 const collect=n=>{if(ts.isVariableDeclaration(n)&&n.initializer)vars.set(n.name.getText(source),n.initializer);ts.forEachChild(n,collect);};collect(source);
 const combine=(a,b)=>a.flatMap(x=>b.map(y=>x+y)).slice(0,150);
 function values(n,env={},depth=0){
  if(!n||depth>12)return ['{}'];
  if(ts.isStringLiteralLike(n))return [n.text];
  if(ts.isParenthesizedExpression(n))return values(n.expression,env,depth+1);
  if(ts.isIdentifier(n)){
   if(n.text==='API_BASE_URL')return [''];
   if(env[n.text])return env[n.text];
   if(['artifact'].includes(n.text))return ['story','vocabulary','quiz','discussion'];
   if(n.text==='action')return ['dismiss','archive','escalate'];
   const v=vars.get(n.text);return v?values(v,env,depth+1):['{}'];
  }
  if(ts.isTemplateExpression(n)){let out=[n.head.text];for(const part of n.templateSpans)out=combine(combine(out,values(part.expression,env,depth+1)),[part.literal.text]);return out;}
  if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken)return combine(values(n.left,env,depth+1),values(n.right,env,depth+1));
  if(ts.isConditionalExpression(n))return [...values(n.whenTrue,env,depth+1),...values(n.whenFalse,env,depth+1)];
  if(ts.isElementAccessExpression(n)){
   const v=vars.get(n.expression.getText(source));
   if(v&&ts.isObjectLiteralExpression(v))return v.properties.flatMap(p=>ts.isPropertyAssignment(p)?values(p.initializer,env,depth+1):[]);
  }
  if(ts.isCallExpression(n)){
   if(/apiQuery|URLSearchParams/.test(n.expression.getText(source)))return [''];
   if(n.expression.getText(source)==='encodeURIComponent')return values(n.arguments[0],env,depth+1);
   const fn=vars.get(n.expression.getText(source));
   if(fn&&ts.isArrowFunction(fn)){const next={...env};fn.parameters.forEach((p,i)=>next[p.name.getText(source)]=values(n.arguments[i],env,depth+1));return values(fn.body,next,depth+1);}
  }
  return ['{}'];
 }
 function visit(n){
  if(ts.isCallExpression(n)&&/(?:^|\.)(apiRequest|send|request|call|fetch|authenticatedFetch)$/.test(n.expression.getText(source))){
   let owner=n.parent;while(owner&&!ts.isMethodDeclaration(owner)&&!ts.isPropertyAssignment(owner))owner=owner.parent;
   let container=owner?.parent?.parent;
   const service=container&&ts.isVariableDeclaration(container)?container.name.getText(source):null;
   const name=owner?.name?.getText(source);
   const args=n.arguments;
   let method='GET';
   for(const arg of args.slice(1)){if(ts.isStringLiteral(arg)&&/^(GET|POST|PUT|PATCH|DELETE)$/.test(arg.text))method=arg.text;
    if(ts.isObjectLiteralExpression(arg)){const prop=arg.properties.find(p=>p.name?.getText(source)==='method');if(prop&&ts.isPropertyAssignment(prop)&&ts.isStringLiteral(prop.initializer))method=prop.initializer.text;}}
   const env={};
   const fn=owner && ts.isPropertyAssignment(owner)?owner.initializer:owner;
   for(const param of fn?.parameters ?? []){const literals=[];const scan=n=>{if(ts.isLiteralTypeNode(n)&&ts.isStringLiteral(n.literal))literals.push(n.literal.text);ts.forEachChild(n,scan);};if(param.type)scan(param.type);if(literals.length)env[param.name.getText(source)]=literals;}
   if(fn?.parameters?.some(p=>p.name.getText(source)==='artifact'&&p.type?.getText(source).startsWith('Exclude')))env.artifact=['vocabulary','quiz','discussion'];
   let paths=values(args[0],env);
   const wrapper=vars.get(n.expression.getText(source));
   if(wrapper && ts.isArrowFunction(wrapper) && ts.isCallExpression(wrapper.body) && wrapper.body.expression.getText(source)==='apiRequest'){
    const next={...env};wrapper.parameters.forEach((p,i)=>next[p.name.getText(source)]=values(args[i],env));
    paths=values(wrapper.body.arguments[0],next);
   }
   for(let route of paths){
    route=route.replace(/^\{\}/,'');
    if(!route.startsWith('/')||route.includes('//'))continue;
    if(!route.startsWith('/api/v1/'))route='/api/v1'+route;
    const key=method+' '+normalize(route);
    const callers=[];
    if(service&&name)for(const u of usages){
     if(u.p===file)continue;
     const imports=[...u.text.matchAll(new RegExp(`\\b${service}(?:\\s+as\\s+(\\w+))?\\b`,'g'))];
     const aliases=new Set([service,...imports.map(m=>m[1]).filter(Boolean)]);
     for(const decl of u.text.matchAll(/const\s+(\w+)\s*=\s*([^;\n]+)/g))if([...aliases].some(a=>new RegExp(`\\b${a}\\b`).test(decl[2])))aliases.add(decl[1]);
     if([...aliases].some(alias=>new RegExp(`\\b${alias}\\.${name}\\b`).test(u.text)))callers.push(path.relative(root,u.p).replaceAll('\\','/'));
     if(/^(parent|creator)AssistanceService$/.test(service)&&u.text.includes('useAssistance(')&&u.text.includes(`h.api.${name}(`))callers.push(path.relative(root,u.p).replaceAll('\\','/'));
    }
    evidence.push({key,service,operation:name,file:path.relative(root,file).replaceAll('\\','/'),line:source.getLineAndCharacterOfPosition(n.getStart(source)).line+1,callers});
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
}
const report=routes.map(r=>({...r,evidence:evidence.filter(e=>e.key===r.method+' '+normalize(r.route))}));
// Follow the retained guardian facade to the actual feature that calls its operation.
for(const r of report)for(const e of r.evidence){
 const bridgeFile=usages.find(u=>u.p.endsWith(`${path.sep}services${path.sep}guardianService.ts`));
 if(!e.callers.includes('app/services/guardianService.ts')||!bridgeFile)continue;
 const ast=ts.createSourceFile(bridgeFile.p,bridgeFile.text,ts.ScriptTarget.Latest,true);
 const visit=n=>{
  if(ts.isCallExpression(n)&&n.expression.getText(ast)===`${e.service}.${e.operation}`){
   let owner=n.parent;while(owner&&!ts.isMethodDeclaration(owner)&&!ts.isPropertyAssignment(owner))owner=owner.parent;
   if(owner?.name)for(const u of usages.filter(u=>!u.p.includes(`${path.sep}services${path.sep}`)))if(new RegExp(`guardianService\\.${owner.name.getText(ast)}\\b`).test(u.text))e.callers.push(path.relative(root,u.p).replaceAll('\\','/'));
  }
  ts.forEachChild(n,visit);
 };visit(ast);
}
for(const r of report){
 if(r.route.endsWith('/webhook/sepay'))r.disposition='SERVER_TO_SERVER';
 else if(r.route==='/api/v1/stories/{storyId}/artifacts/generate'){r.disposition='COMPATIBILITY_ALIAS';r.canonical='/api/v1/stories/{storyId}/review/artifacts/generate';}
 else r.disposition=r.evidence.length?(r.evidence.some(e=>e.callers.some(c=>!c.startsWith('app/services/')))?'CONNECTED_SOURCE':'SERVICE_ONLY'):'MISSING';
}
fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/core-api-audit.json',JSON.stringify(report,null,2));
if(process.argv.includes('--write'))fs.writeFileSync('docs/core-api-coverage.json',JSON.stringify(report,null,2)+'\n');
const missing=report.filter(r=>['MISSING','SERVICE_ONLY'].includes(r.disposition));
console.log(JSON.stringify({total:report.length,connected:report.filter(r=>r.disposition==='CONNECTED_SOURCE').length,excluded:report.filter(r=>['SERVER_TO_SERVER','COMPATIBILITY_ALIAS'].includes(r.disposition)).length,missing:missing.map(r=>r.method+' '+r.route)},null,2));
if(process.argv.includes('--check')&&missing.length)process.exitCode=1;
