import { config } from 'dotenv';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
config({path:'.env.local',quiet:true});
const origin='http://localhost:3100';
const results=[];
const adminOnly=process.argv.includes('--admin-only');
const skipDashboard=process.argv.includes('--skip-dashboard');
class Failure extends Error {}
function check(condition,label) {
  if(!condition) throw new Failure(label);
  results.push({test:label,result:'PASS'});
  console.log(`PASS: ${label}`);
}
function jarClient() {
  const jar=new Map();
  return async (path,options={})=>{
    let response;
    try { response=await fetch(new URL(path,origin),{...options,redirect:'manual',signal:AbortSignal.timeout(60000),headers:{...options.headers,origin,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}}); }
    catch {throw new Failure(`Request failed or timed out: ${options.method ?? 'GET'} ${path}`);}
    for(const line of response.headers.getSetCookie()) {
      const pair=line.split(';')[0],index=pair.indexOf('=');
      const name=pair.slice(0,index),value=pair.slice(index+1);
      if(!value || /max-age=0(?:;|$)/i.test(line)) jar.delete(name); else jar.set(name,value);
    }
    let body;
    try {body=await response.text();} catch {throw new Failure(`Response stream failed or timed out: ${path}`);}
    return {status:response.status,location:response.headers.get('location'),body};
  };
}
function formData(html,predicate) {
  const forms=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(m=>m[0]);
  const form=forms.find(predicate);
  if(!form) throw new Failure('Expected server-action form missing');
  const data=new FormData();
  for(const match of form.matchAll(/<input\b[^>]*>/g)) {
    const name=match[0].match(/\bname="([^"]+)"/)?.[1];
    const value=match[0].match(/\bvalue="([^"]*)"/)?.[1] ?? '';
    if(name?.startsWith('$ACTION_')) data.append(name,value.replaceAll('&quot;','"').replaceAll('&amp;','&'));
  }
  if(![...data.keys()].some(k=>k.startsWith('$ACTION_'))) throw new Failure('Server-action identifier missing');
  return data;
}
function destination(r) {
  if([303,307,308].includes(r.status) && r.location) return new URL(r.location,origin);
  // Next.js streams some server-component redirects as a browser meta refresh.
  const tag=r.body.match(/<meta\b[^>]*id="__next-page-redirect"[^>]*>/)?.[0];
  const target=tag?.match(/content="[01];url=([^"]+)"/)?.[1];
  if(r.status===200 && r.body.includes('NEXT_REDIRECT') && target) return new URL(target.replaceAll('&amp;','&'),origin);
  return null;
}
function redirectTo(r,path) {return destination(r)?.pathname===path;}
async function login(request,email,password) {
  const page=await request('/login');
  const body=formData(page.body,f=>f.includes('name="password"'));
  body.set('email',email);body.set('password',password);
  return request('/login',{method:'POST',body});
}
async function logout(request) {
  const page=await request('/account');
  const body=formData(page.body,f=>f.includes('ออกจากระบบ'));
  return request('/account',{method:'POST',body});
}
async function allowed(request,path,label) {
  const start=performance.now();
  const r=await request(path);
  check(r.status===200 && !r.body.includes('NEXT_REDIRECT') && !r.body.includes('NEXT_HTTP_ERROR_FALLBACK') && !r.body.includes('Application error:'),label);
  results.at(-1).elapsedMs=Math.round(performance.now()-start);
  if(path==='/admin') console.log(`Dashboard response: HTTP ${r.status}, ${results.at(-1).elapsedMs}ms`);
  return r;
}
const cases=[['USER','bs@test.com','DEMO_USER_PASSWORD',3],['SELLER','boss@test.com','DEMO_SELLER_PASSWORD',1],['ADMIN','admin@test.com','DEMO_ADMIN_PASSWORD',2]];
let db;
try {
  for(const [, ,env] of cases) if(!process.env[env]) throw new Failure('Missing smoke-test password environment variable');
  const {certificate}=JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
  db=postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,onnotice(){}});
  const context=await db.begin(async tx=>{
    await tx`SET TRANSACTION READ ONLY`;
    const products=await tx`SELECT p.id,s.owner_id FROM public.products p JOIN public.shops s ON s.id=p.shop_id ORDER BY p.id`;
    const links=await tx`SELECT u.id,u.email,u.role,u.status,a.email AS auth_email,m.supabase_user_id FROM public.users u JOIN public.auth_identities m ON m.user_id=u.id JOIN auth.users a ON a.id=m.supabase_user_id ORDER BY u.id`;
    return {products,links};
  });
  for(const [role,email,env,id] of cases.filter(c=>!adminOnly || c[0]==='ADMIN')) {
    const request=jarClient();let signedIn=false;
    try {
      const r=await login(request,email,process.env[env]);
      check(redirectTo(r,'/account'),`${role}: password login`);signedIn=true;
      const account=await allowed(request,'/account',`${role}: protected account access`);
      check(account.body.includes(email),`${role}: account displays expected email`);
      check(context.links.some(x=>x.id===id && x.email===email && x.auth_email===email && x.role===role && x.status==='ACTIVE'),`${role}: UUID resolves to integer ID ${id}, correct role and ACTIVE status`);
      if(role==='USER') {
        for(const path of ['/seller','/seller/products','/admin']) check(redirectTo(await request(path),'/unauthorized'),`USER: ${path} denied`);
      } else if(role==='SELLER') {
        for(const path of ['/seller','/seller/products','/seller/orders']) await allowed(request,path,`SELLER: ${path} authorized`);
        const own=context.products.find(p=>p.owner_id===id),other=context.products.find(p=>p.owner_id!==id);
        if(own) await allowed(request,`/seller/products/${own.id}/edit`,'SELLER: own product edit page authorized (GET only)');
        if(other) {
          const denied=await request(`/seller/products/${other.id}/edit`);
          check(denied.status===404 || (denied.status===200 && denied.body.includes('NEXT_HTTP_ERROR_FALLBACK;404')),'SELLER: other shop product edit page denied');
        } else results.push({test:'SELLER: cross-shop product ownership',result:'NOT_TESTED_NO_FIXTURE'});
        check(redirectTo(await request('/admin'),'/unauthorized'),'SELLER: /admin denied');
      } else {
        for(const path of (skipDashboard ? ['/admin/users','/admin/shops','/admin/orders'] : ['/admin','/admin/users','/admin/shops','/admin/orders'])) await allowed(request,path,`ADMIN: ${path} authorized`);
      }
    } finally {
      if(signedIn) {
        check(redirectTo(await logout(request),'/login'),`${role}: logout`);
        for(const path of ['/account','/seller','/admin']) check(redirectTo(await request(path),'/login'),`${role}: logged-out ${path} denied`);
      }
    }
  }
  const anonymous=jarClient();
  const wrong=await login(anonymous,'bs@test.com',`wrong-${randomUUID()}`);
  check(redirectTo(wrong,'/login') && destination(wrong)?.searchParams.get('error')==='credentials','Wrong password rejected');
  for(const path of ['/account','/seller','/admin']) check(redirectTo(await anonymous(path),'/login'),`After wrong password: ${path} denied`);
} catch(e) {
  const label=e instanceof Failure ? e.message : 'Smoke test infrastructure error (sensitive details suppressed)';
  console.error(`FAIL: ${label}`);results.push({test:label,result:'FAIL'});process.exitCode=1;
} finally {
  await db?.end({timeout:5});
  await writeFile(adminOnly ? 'work/demo-auth-smoke-admin-results.json' : 'work/demo-auth-smoke-results.json',JSON.stringify({testedAt:new Date().toISOString(),method:'HTTP server-action form submissions and protected route GETs; no marketplace mutations',results},null,2));
}
