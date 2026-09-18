import { readFile, writeFile } from 'node:fs/promises';
import { config } from 'dotenv';
config({path:'.env.local',quiet:true});
const manifest=JSON.parse(await readFile('work/product-image-migration/manifest.json','utf8'));
const origin='http://localhost:3100',cookies=new Map(),results=[];
class Failure extends Error {}
function check(ok,message){if(!ok)throw new Failure(message);results.push(message);console.log(`PASS: ${message}`);}
async function request(path,options={}){
 const r=await fetch(new URL(path,origin),{...options,redirect:'manual',signal:AbortSignal.timeout(30000),headers:{origin,cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; ')}});
 for(const header of r.headers.getSetCookie()){const pair=header.split(';')[0],i=pair.indexOf('='),k=pair.slice(0,i),v=pair.slice(i+1);if(!v || /max-age=0(?:;|$)/i.test(header))cookies.delete(k);else cookies.set(k,v);}
 return {status:r.status,location:r.headers.get('location'),body:await r.text()};
}
function form(html,match){
 const found=[...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(x=>x[0]).find(match);
 if(!found)throw new Failure('Form missing');const f=new FormData();
 for(const [tag] of found.matchAll(/<input\b[^>]*>/g)){
  const name=tag.match(/\bname="([^"]+)"/)?.[1],value=tag.match(/\bvalue="([^"]*)"/)?.[1] ?? '';
  if(name?.startsWith('$ACTION_'))f.set(name,value);
 }
 return f;
}
async function page(path,images){
 const r=await request(path);
 check(r.status===200 && !r.body.includes('NEXT_REDIRECT') && !r.body.includes('NEXT_HTTP_ERROR_FALLBACK'),`${path} responds successfully`);
 const tags=[...r.body.matchAll(/<img\b[^>]*>/g)].map(x=>x[0]);
 for(const entry of images)check(tags.some(tag=>tag.includes(entry.newUrl)||tag.includes(encodeURIComponent(entry.newUrl))),`${path}: product ${entry.productId} uses migrated image`);
 return r;
}
let loggedIn=false;
try{
 await page('/products',manifest.images);
 for(const entry of manifest.images){
  await page(`/products/${entry.productId}`,[entry]);
  const image=await fetch(`${origin}/_next/image?url=${encodeURIComponent(entry.newUrl)}&w=640&q=75`,{signal:AbortSignal.timeout(30000)});
  check(image.status===200 && image.headers.get('content-type')?.startsWith('image/') && (await image.arrayBuffer()).byteLength>0,`Product ${entry.productId}: Next image rendering`);
 }
 for(const shopId of [1,2])await page(`/shops/${shopId}`,manifest.images.filter(x=>x.shopId===shopId));
 if(!process.env.DEMO_SELLER_PASSWORD)throw new Failure('Seller test password missing');
 const login=await request('/login'),body=form(login.body,x=>x.includes('name="password"'));
 body.set('email','boss@test.com');body.set('password',process.env.DEMO_SELLER_PASSWORD);
 const signed=await request('/login',{method:'POST',body});
 check(signed.status===303 && signed.location==='/account','Seller login');loggedIn=true;
 const list=await page('/seller/products',[]);
 for(const entry of manifest.images.filter(x=>x.shopId===1)){
  check(list.body.includes(`/seller/products/${entry.productId}`),`Seller list links product ${entry.productId} (existing list has no thumbnails)`);
  await page(`/seller/products/${entry.productId}`,[entry]);
  await page(`/seller/products/${entry.productId}/edit`,[entry]);
 }
}catch(e){console.error(e instanceof Failure?e.message:'Image smoke test failed; sensitive details suppressed.');process.exitCode=1;}
finally{
 if(loggedIn){
  try{const account=await request('/account');const logout=await request('/account',{method:'POST',body:form(account.body,x=>x.includes('ออกจากระบบ'))});check(logout.status===303 && logout.location==='/login','Seller logout');}
  catch{console.error('Seller logout failed');process.exitCode=1;}
 }
 await writeFile('work/product-image-migration/page-tests.json',JSON.stringify({testedAt:new Date().toISOString(),passed:process.exitCode!==1,results},null,2));
}
