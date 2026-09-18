import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({path:'.env.local',quiet:true});
const expected={public:true,fileSizeLimit:900*1024,allowedMimeTypes:['image/jpeg','image/png','image/webp']};
try {
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  let {data,error}=await client.storage.getBucket('product-images');
  if(error && String(error.statusCode)==='404') {
    const created=await client.storage.createBucket('product-images',expected);
    if(created.error) throw new Error('Bucket creation failed');
    ({data,error}=await client.storage.getBucket('product-images'));
  }
  if(error || !data || data.public!==true || Number(data.file_size_limit)!==expected.fileSizeLimit || JSON.stringify([...data.allowed_mime_types].sort())!==JSON.stringify([...expected.allowedMimeTypes].sort())) throw new Error('Bucket settings differ; review required');
  console.log('product-images verified: public reads, JPEG/PNG/WebP only, 921600-byte limit. No SQL migrations or browser write policies.');
}catch {console.error('Bucket setup failed or settings differ; sensitive details suppressed.');process.exitCode=1;}
