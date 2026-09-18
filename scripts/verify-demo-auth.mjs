import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import postgres from 'postgres';
import { expectedUsers } from './migrate-demo-auth.mjs';
config({path:'.env.local',quiet:true});
const manifest=JSON.parse(await readFile('work/demo-auth-recovery/manifest.json','utf8'));
const {certificate}=JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
const db=postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,onnotice(){}});
try {
  await db.begin(async tx=>{
    await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
    await tx`SET LOCAL TIME ZONE 'UTC'`;
    const rows=[];
    for(const before of manifest.before) {
      const data=await tx`SELECT to_jsonb(t)::text AS contents FROM ${tx(`public.${before.table}`)} t ORDER BY id`;
      rows.push({table:before.table,count:data.length,sha256:createHash('sha256').update(JSON.stringify(data.map(r=>r.contents))).digest('hex')});
    }
    assert.equal(JSON.stringify(rows),JSON.stringify(manifest.before),'Marketplace fingerprints changed');
    const users=await tx`SELECT id,email,username,role,status FROM public.users ORDER BY id`;
    assert.equal(JSON.stringify(users),JSON.stringify(expectedUsers),'Source users changed');
    const mappings=await tx`SELECT m.supabase_user_id,m.user_id,u.email,u.role,u.status,a.email AS auth_email,a.email_confirmed_at IS NOT NULL AS confirmed,a.encrypted_password=u.password_hash AS hash_preserved FROM public.auth_identities m JOIN public.users u ON u.id=m.user_id JOIN auth.users a ON a.id=m.supabase_user_id ORDER BY m.user_id`;
    const [counts]=await tx`SELECT (SELECT count(*)::int FROM auth.users) AS auth_users,(SELECT count(*)::int FROM public.auth_identities) AS mappings,(SELECT count(*)::int FROM (SELECT lower(btrim(email)) FROM auth.users GROUP BY lower(btrim(email)) HAVING count(*)>1) d) AS duplicate_auth_emails,(SELECT count(*)::int FROM pg_constraint WHERE conrelid='public.auth_identities'::regclass AND confrelid='auth.users'::regclass) AS deferred_auth_fks`;
    assert.equal(counts.auth_users,4);assert.equal(counts.mappings,4);assert.equal(counts.duplicate_auth_emails,0);assert.equal(counts.deferred_auth_fks,0);
    assert.equal(mappings.length,4);
    for(const a of manifest.accounts) assert(mappings.some(m=>m.user_id===a.userId && m.supabase_user_id===a.authId && m.email===a.email && m.auth_email===a.email && m.confirmed && m.hash_preserved));
    console.log(JSON.stringify({verified:true,marketplaceRows:rows.reduce((n,r)=>n+r.count,0),fingerprintsUnchanged:true,...counts,mappingsVerified:mappings,smokePasswordsPresent:{USER:Boolean(process.env.DEMO_USER_PASSWORD),SELLER:Boolean(process.env.DEMO_SELLER_PASSWORD),ADMIN:Boolean(process.env.DEMO_ADMIN_PASSWORD)}},null,2));
  });
} catch {console.error('Verification failed; sensitive details suppressed.');process.exitCode=1;}
finally {await db.end({timeout:5});}
