import { config } from 'dotenv';
import { readFile, writeFile, mkdir, rename, open, readdir } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { basename, resolve } from 'node:path';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
config({path:'.env.local',quiet:true});
const mode=process.argv[2];
const manifestPath='work/product-image-migration/manifest.json';
const expected=[
 [1,1,'ea235494-f6dc-4b94-aba0-6b74e385ccf0.png',572869],
 [3,1,'0cb723ae-14f8-471d-8673-b9437d2b40de.jpg',237319],
 [4,1,'19564b9f-e777-4b9d-886e-73bc56242ec5.png',548284],
 [5,2,'af828aaa-1b0b-4b3a-8762-72080db4557c.png',455593],
 [6,2,'a17e6678-5113-4ee0-bf28-1cf42c2d56cb.jpg',199050],
];
const digest=x=>createHash('sha256').update(x).digest('hex');
class Stop extends Error {}
function check(ok,message){if(!ok)throw new Stop(message);}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function save(m){await writeFile(`${manifestPath}.tmp`,JSON.stringify(m,null,2));await rename(`${manifestPath}.tmp`,manifestPath);}
const baseline=JSON.parse(await readFile('work/demo-auth-recovery/manifest.json','utf8'));
const {certificate}=JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
const url=new URL(process.env.DATABASE_URL),auth=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
check(url.hostname.endsWith('.pooler.supabase.com') && url.port==='6543' && decodeURIComponent(url.username).endsWith(`.${auth.hostname.split('.')[0]}`),'Project/pooler mismatch');
const db=postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,onnotice(){}});
const admin=createClient(auth.origin,process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,o)=>fetch(u,{...o,signal:AbortSignal.timeout(20000)})}});
const storage=admin.storage.from('product-images');
async function bucket(){
 const {data,error}=await admin.storage.getBucket('product-images');
 check(!error && data?.public && Number(data.file_size_limit)===921600 && equal([...data.allowed_mime_types].sort(),['image/jpeg','image/png','image/webp']),'Bucket configuration differs');
}
async function state(tx){
 const full=[],nonImage=[];
 for(const item of baseline.before){
  const data=await tx`SELECT to_jsonb(t)::text AS contents FROM ${tx(`public.${item.table}`)} t ORDER BY id`;
  full.push({table:item.table,count:data.length,sha256:digest(JSON.stringify(data.map(x=>x.contents)))});
  if(item.table==='products'){
   const data=await tx`SELECT (to_jsonb(t)-'image_url')::text AS contents FROM public.products t ORDER BY id`;
   nonImage.push({table:item.table,count:data.length,sha256:digest(JSON.stringify(data.map(x=>x.contents)))});
  }else nonImage.push(full.at(-1));
 }
 const products=await tx`SELECT id,shop_id,image_url FROM public.products ORDER BY id`;
 const objects=await tx`SELECT name FROM storage.objects WHERE bucket_id='product-images' ORDER BY name`;
 const links=await tx`SELECT supabase_user_id,user_id FROM public.auth_identities ORDER BY user_id`;
 return {full,nonImage,products:Array.from(products),objects:objects.map(x=>x.name),links:Array.from(links)};
}
async function readState(){return db.begin(async tx=>{await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;await tx`SET LOCAL TIME ZONE 'UTC'`;return state(tx);});}
async function sources(){
 check(equal((await readdir('public/uploads/products')).sort(),expected.map(x=>x[2]).sort()),'Local file inventory differs');
 const result=[];
 for(const [id,shopId,filename,size] of expected){
  const bytes=await readFile(resolve('public/uploads/products',filename));
  check(bytes.length===size,'Source file size differs');
  const meta=await sharp(bytes).metadata();
  check(meta.format===(filename.endsWith('.jpg')?'jpeg':'png'),'Source format differs');
  result.push({productId:id,shopId,oldUrl:`/uploads/products/${filename}`,filename,size,sha256:digest(bytes)});
 }
 return result;
}
async function verifyObject(entry){
 const {data,error}=await storage.download(entry.objectPath);
 check(!error && data,'Storage download failed');
 const stored=Buffer.from(await data.arrayBuffer());
 check(stored.length===entry.size && digest(stored)===entry.sha256,'Stored size/hash differs');
 const response=await fetch(entry.newUrl,{signal:AbortSignal.timeout(20000),cache:'no-store'});
 check(response.ok,'Public image fetch failed');
 const publicBytes=Buffer.from(await response.arrayBuffer());
 check(publicBytes.length===entry.size && digest(publicBytes)===entry.sha256,'Public bytes differ');
 console.log(`Verified product ${entry.productId}: size, SHA-256 and public HTTP ${response.status}.`);
}
function verifyAfter(m,s){
 check(equal(s.nonImage,m.before.nonImage),'Non-image marketplace values or IDs changed');
 check(equal(s.links,m.before.links),'Auth mappings changed');
 check(equal(s.products,m.images.map(x=>({id:x.productId,shop_id:x.shopId,image_url:x.newUrl}))),'Product mapping differs');
 check(equal(s.objects,m.images.map(x=>x.objectPath).sort()),'Storage object inventory differs');
 check(s.full.reduce((n,x)=>n+x.count,0)===61,'Marketplace row count changed');
}
try {
 check(['--preflight','--apply','--verify'].includes(mode),'Use --preflight, --apply or --verify');
 await bucket();
 if(mode==='--preflight'){
  const before=await readState();
  check(equal(before.full,baseline.before),'Marketplace differs from reviewed 61-row baseline');
  check(before.objects.length===0,'Bucket is not empty');
  const images=await sources();
  check(equal(before.products,images.map(x=>({id:x.productId,shop_id:x.shopId,image_url:x.oldUrl}))),'Reviewed product URLs differ');
  check(new Set(images.map(x=>x.oldUrl)).size===5,'Ambiguous local URL mapping');
  for(const entry of images){entry.objectPath=`products/${entry.shopId}/${randomUUID()}.${entry.filename.endsWith('.jpg')?'jpg':'png'}`;entry.newUrl=storage.getPublicUrl(entry.objectPath).data.publicUrl;entry.status='planned';}
  await mkdir('work/product-image-migration',{recursive:true});
  const file=await open(manifestPath,'wx');await file.close();
  await save({status:'planned',project:auth.hostname,createdAt:new Date().toISOString(),before,images});
  console.log(JSON.stringify({preflight:'PASS',products:5,sourceFiles:5,uniqueLocalUrls:5,bucketObjects:0,images:images.map(({productId,shopId,oldUrl,filename,size,sha256})=>({productId,shopId,oldUrl,filename,size,sha256}))},null,2));
 }else{
  const m=JSON.parse(await readFile(manifestPath,'utf8'));
  check(m.project===auth.hostname,'Manifest project mismatch');
  check(equal(await sources(),m.images.map(({productId,shopId,oldUrl,filename,size,sha256})=>({productId,shopId,oldUrl,filename,size,sha256}))),'Local files changed since preflight');
  if(mode==='--apply'){
   check(m.status==='planned' && m.images.every(x=>x.status==='planned'),'Already started; inspect state instead of rerunning');
   check(equal(await readState(),m.before),'Database or bucket changed since preflight');
   m.status='uploading';await save(m);
   for(const entry of m.images){
    entry.status='upload_pending';await save(m);
    const bytes=await readFile(resolve('public/uploads/products',basename(entry.filename)));
    const {error}=await storage.upload(entry.objectPath,bytes,{contentType:entry.filename.endsWith('.jpg')?'image/jpeg':'image/png',upsert:false,cacheControl:'3600'});
    check(!error,'Upload failed or outcome uncertain; inspect manifest before recovery');
    await verifyObject(entry);entry.status='verified';await save(m);
   }
   await db.begin(async tx=>{
    await tx`SET LOCAL TIME ZONE 'UTC'`;await tx`SET LOCAL lock_timeout='10s'`;await tx`SET LOCAL statement_timeout='30s'`;
    await tx.unsafe(`LOCK TABLE ${baseline.before.map(x=>`public."${x.table}"`).join(', ')} IN SHARE ROW EXCLUSIVE MODE`);
    const before=await state(tx);
    check(equal(before.full,m.before.full) && equal(before.links,m.before.links),'Marketplace changed during upload');
    check(equal(before.objects,m.images.map(x=>x.objectPath).sort()),'Unexpected uploaded object inventory');
    for(const entry of m.images){
     const changed=await tx`UPDATE public.products SET image_url=${entry.newUrl} WHERE id=${entry.productId} AND shop_id=${entry.shopId} AND image_url=${entry.oldUrl} RETURNING id`;
     check(changed.length===1,'Product update conflict');
    }
    verifyAfter(m,await state(tx));m.status='commit_pending';await save(m);
   });
   m.status='completed';m.completedAt=new Date().toISOString();await save(m);
  }
  verifyAfter(m,await readState());
  for(const entry of m.images)await verifyObject(entry);
  console.log('PASS: exactly 5 objects and migrated URLs; all 61 rows retained, all non-image data/timestamps/IDs unchanged; original files retained.');
 }
}catch(e){console.error(e instanceof Stop?e.message:'Migration/verification stopped; sensitive details suppressed. Inspect the manifest before retrying.');process.exitCode=1;}
finally{await db.end({timeout:5});}
