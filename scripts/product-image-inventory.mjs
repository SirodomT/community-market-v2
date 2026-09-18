import { config } from 'dotenv';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
config({path:'.env.local',quiet:true});
const {certificate}=JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
const db=postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,onnotice(){}});
try {
  await db.begin(async tx=>{
    await tx`SET TRANSACTION READ ONLY`;
    const products=await tx`SELECT id,shop_id,image_url FROM public.products ORDER BY id`;
    const images=[];
    for(const p of products) {
      const local=typeof p.image_url==='string' && /^\/uploads\/products\/[^/]+$/.test(p.image_url);
      const file=local ? resolve('public/uploads/products',basename(p.image_url)) : null;
      const info=file ? await stat(file).catch(()=>null) : null;
      images.push({...p,local,exists:info?.isFile() ?? false,bytes:info?.size ?? null});
    }
    const policies=await tx`SELECT policyname,cmd,roles,qual,with_check FROM pg_policies WHERE schemaname='storage' AND tablename='objects'`;
    const objects=await tx`SELECT name,created_at FROM storage.objects WHERE bucket_id='product-images' ORDER BY name`;
    const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await admin.storage.getBucket('product-images');
    console.log(JSON.stringify({products:products.length,withImage:products.filter(p=>p.image_url).length,images,localFiles:await readdir('public/uploads/products'),storagePolicies:policies,storageObjects:objects,bucket:data,bucketError:error ? {status:error.statusCode,message:error.message}:null},null,2));
  });
}catch {console.error('Inventory failed; sensitive details suppressed.');process.exitCode=1;}
finally {await db.end({timeout:5});}
