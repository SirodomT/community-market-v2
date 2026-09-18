import { readFile, writeFile, rename, mkdir, open } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

// OPERATOR CLI ONLY. Never import into src/ or expose the admin key in NEXT_PUBLIC_*.
// DEMO/TEST ONLY: explicitly confirms these four existing test accounts without email.
export const expectedUsers = [
  {id:1,email:'boss@test.com',username:'boss',role:'SELLER',status:'ACTIVE'},
  {id:2,email:'admin@test.com',username:'admin',role:'ADMIN',status:'ACTIVE'},
  {id:3,email:'bs@test.com',username:'bigsmoke',role:'USER',status:'ACTIVE'},
  {id:4,email:'ghh@test.com',username:'Rayong market',role:'SELLER',status:'ACTIVE'},
];
const tables = ['cart_items','categories','order_items','order_shops','orders','products','sessions','shop_requests','shops','users'];
const manifestPath = 'work/demo-auth-recovery/manifest.json';
class Stop extends Error {}
function requireThat(condition, message) { if (!condition) throw new Stop(message); }
function equal(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
export function validatePreflight(state) {
  requireThat(equal(state.users,expectedUsers),'The four test accounts differ from the reviewed allowlist.');
  requireThat(state.duplicateGroups===0,'Duplicate normalized emails: abort.');
  requireThat(state.authUsers===0,'Existing Auth account detected: abort; no automatic adoption or resume.');
  requireThat(state.mappings===0,'Existing mapping detected: abort.');
  requireThat(state.bcryptCount===4,'All four passwords must be bcrypt hashes.');
  requireThat(state.customTriggers===0,'Custom Auth/mapping triggers require review.');
  requireThat(state.deferredForeignKeys===0,'Unexpected Auth foreign key: review required.');
}
async function preflight(tx) {
  const users = await tx`SELECT id,email,username,role,status FROM public.users ORDER BY id`;
  const [s] = await tx`SELECT
    (SELECT count(*)::int FROM (SELECT lower(btrim(email)) FROM public.users GROUP BY lower(btrim(email)) HAVING count(*)>1) d) AS duplicates,
    (SELECT count(*)::int FROM auth.users) AS auth_users,
    (SELECT count(*)::int FROM public.auth_identities) AS mappings,
    (SELECT count(*)::int FROM public.users WHERE password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$') AS bcrypt_count,
    (SELECT count(*)::int FROM pg_trigger WHERE tgrelid IN ('auth.users'::regclass,'auth.identities'::regclass,'public.auth_identities'::regclass) AND NOT tgisinternal) AS custom_triggers,
    (SELECT count(*)::int FROM pg_constraint WHERE conrelid='public.auth_identities'::regclass AND confrelid='auth.users'::regclass) AS deferred_fks`;
  const state = {users:Array.from(users),duplicateGroups:s.duplicates,authUsers:s.auth_users,mappings:s.mappings,bcryptCount:s.bcrypt_count,customTriggers:s.custom_triggers,deferredForeignKeys:s.deferred_fks};
  validatePreflight(state);
  return state;
}
async function fingerprints(tx) {
  const result=[];
  for (const table of tables) {
    const rows=await tx`SELECT to_jsonb(t)::text AS contents FROM ${tx(`public.${table}`)} t ORDER BY id`;
    result.push({table,count:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows.map(r=>r.contents))).digest('hex')});
  }
  return result;
}
async function saveManifest(manifest) {
  // No credentials, hashes, tokens, or passwords. Atomic replacement on this volume.
  await writeFile(`${manifestPath}.tmp`,JSON.stringify(manifest,null,2),{mode:0o600});
  await rename(`${manifestPath}.tmp`,manifestPath);
}
export async function createAccounts({users,createUser,save,manifest}) {
  for (const user of users) {
    const entry=manifest.accounts.find(a=>a.userId===user.id);
    entry.status='request_pending';
    await save(manifest); // Persist the planned UUID BEFORE any external mutation.
    let response;
    try {
      response=await createUser({
        id:entry.authId,email:user.email,password_hash:user.password_hash,
        email_confirm:true, // Explicitly approved for these four DEMO accounts only.
        user_metadata:{username:user.username},
        app_metadata:{demo_test_only:true,migration_run:manifest.runId},
      });
    } catch {
      throw new Stop('Auth request outcome uncertain. Stop and inspect the recovery manifest; never retry blindly.');
    }
    requireThat(!response.error,'Auth creation failed. Stop; earlier accounts may exist. Inspect the recovery manifest.');
    const created=response.data?.user;
    requireThat(created?.id===entry.authId && created.email===user.email && Boolean(created.email_confirmed_at),
      'Auth returned unexpected UUID/email/confirmation; stop for recovery review.');
    entry.status='created';
    await save(manifest);
  }
}
export async function main(args=process.argv.slice(2)) {
  const apply=equal(args,['--apply','--demo-test-only']);
  requireThat(apply || args.length===0 || equal(args,['--dry-run']),
    'Use --dry-run, or --apply --demo-test-only after approval.');
  config({path:'.env.local',quiet:true});
  const url=new URL(process.env.DATABASE_URL);
  const auth=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  requireThat(['postgres:','postgresql:'].includes(url.protocol) && url.hostname.endsWith('.pooler.supabase.com') && url.port==='6543','Expected Supabase transaction pooler on port 6543.');
  requireThat(auth.protocol==='https:' && auth.hostname.endsWith('.supabase.co') && decodeURIComponent(url.username).endsWith(`.${auth.hostname.split('.')[0]}`),'Database and Auth projects must match.');
  const key=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (apply) requireThat(Boolean(key),'Missing server-only SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.');
  const {certificate}=JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
  const db=postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,connect_timeout:15,onnotice(){}});
  let manifest;
  try {
    if (!apply) {
      await db.begin(async tx=>{
        await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
        await tx`SET LOCAL statement_timeout='20s'`;
        const state=await preflight(tx);
        console.log(JSON.stringify({mode:'dry-run',demoTestOnly:true,emailConfirm:true,users:state.users,
          checks:{duplicateEmailGroups:state.duplicateGroups,existingAuthUsers:state.authUsers,existingMappings:state.mappings,bcryptCompatibleAccounts:state.bcryptCount,customTriggers:state.customTriggers,deferredAuthForeignKeys:state.deferredForeignKeys},
          adminCredentialPresent:Boolean(key),plannedAuthCreations:4,plannedMappingInserts:4,marketplaceWrites:0,
          executed:false,applyReady:Boolean(key),note:'DEMO/TEST ONLY: email confirmation is bypassed. No accounts, mappings, or emails created.'},null,2));
      });
      return;
    }
    await mkdir('work/demo-auth-recovery',{recursive:true});
    // Exclusive creation blocks accidental reruns, including after ambiguous failures.
    const marker=await open(manifestPath,'wx',0o600);
    await marker.close();
    manifest={runId:randomUUID(),projectHost:auth.hostname,demoTestOnly:true,status:'preflight_pending',accounts:expectedUsers.map(u=>({userId:u.id,email:u.email,authId:randomUUID(),status:'planned'}))};
    await saveManifest(manifest);
    const admin=createClient(auth.origin,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000)})}});
    await db.begin(async tx=>{
      await tx`SET LOCAL search_path=public`;
      await tx`SET LOCAL TIME ZONE 'UTC'`;
      await tx`SET LOCAL lock_timeout='10s'`;
      await tx`SET LOCAL statement_timeout='30s'`;
      await tx`SELECT pg_advisory_xact_lock(1789651539,436)`;
      // SHARE locks prevent marketplace writes while allowing readers. No Auth-table
      // locks: admin API requests use a separate connection.
      await tx.unsafe(`LOCK TABLE ${tables.map(t=>`public."${t}"`).join(', ')} IN SHARE MODE`);
      await tx`LOCK TABLE public.auth_identities IN EXCLUSIVE MODE`;
      await preflight(tx);
      const before=await fingerprints(tx);
      requireThat(before.reduce((n,r)=>n+r.count,0)===61,'Marketplace row count differs from approved baseline.');
      manifest.before=before;
      manifest.status='creating_auth_accounts';
      await saveManifest(manifest);
      // Hashes exist in process memory only; never logged or written to the manifest.
      const users=await tx`SELECT id,email,username,password_hash FROM public.users ORDER BY id`;
      await createAccounts({users,createUser:payload=>admin.auth.admin.createUser(payload),save:saveManifest,manifest});
      const authRows=await tx`SELECT id,email,email_confirmed_at FROM auth.users ORDER BY email`;
      requireThat(authRows.length===4 && manifest.accounts.every(a=>authRows.some(r=>r.id===a.authId && r.email===a.email && r.email_confirmed_at)),'Auth inventory changed or differs from the manifest.');
      for (const a of manifest.accounts) {
        await tx`INSERT INTO public.auth_identities (supabase_user_id,user_id) VALUES (${a.authId},${a.userId})`;
      }
      const mappings=await tx`SELECT supabase_user_id,user_id FROM public.auth_identities ORDER BY user_id`;
      requireThat(equal(Array.from(mappings),manifest.accounts.map(a=>({supabase_user_id:a.authId,user_id:a.userId}))),'Mapping verification failed.');
      requireThat(equal(before,await fingerprints(tx)),'Marketplace rows changed; abort mapping transaction.');
      manifest.status='mapping_commit_pending';
      await saveManifest(manifest);
    });
    manifest.status='completed';
    await saveManifest(manifest);
    console.log('Demo Auth migration committed: 4 confirmed test accounts, 4 mappings, marketplace fingerprints unchanged.');
  } finally {await db.end({timeout:5});}
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e=>{
    console.error(e instanceof Stop ? e.message : 'Runner stopped. Sensitive error details hidden; inspect the recovery manifest before any retry.');
    process.exitCode=1;
  });
}
