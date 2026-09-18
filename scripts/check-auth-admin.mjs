import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({path:'.env.local',quiet:true});
try {
  if (!process.env.SUPABASE_SECRET_KEY) throw new Error('missing');
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(15000)})},
  });
  const {data,error}=await admin.auth.admin.listUsers({page:1,perPage:1});
  if (error || !data || data.users.length!==0 || (data.total !== undefined && Number(data.total)!==0)) {
    console.log(JSON.stringify({adminAccess:!error,httpStatus:error?.status ?? null,errorCode:error?.code ?? null,returnedUsers:data?.users?.length ?? null,totalUsers:data?.total ?? null}));
    console.error('STOP: Auth Admin access check failed or existing Auth users were detected. No mutation performed.');
    process.exitCode=1;
  } else console.log('SUPABASE_SECRET_KEY Auth Admin access: PASS (read-only listUsers). Existing Auth users: 0. No credentials printed; no mutation performed.');
} catch {
  console.error('STOP: Admin credential check failed. Sensitive details hidden.');
  process.exitCode=1;
}
