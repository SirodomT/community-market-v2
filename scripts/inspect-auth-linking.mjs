import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import postgres from 'postgres';

// Read-only planning: never retrieves or prints password hashes.
config({path:'.env.local',quiet:true});
const url = new URL(process.env.DATABASE_URL);
const auth = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert(['postgres:', 'postgresql:'].includes(url.protocol));
assert(url.hostname.endsWith('.pooler.supabase.com') && url.port==='6543');
assert(decodeURIComponent(url.username).endsWith(`.${auth.hostname.split('.')[0]}`));
const {certificate} = JSON.parse(await readFile('certs/supabase-ca.json','utf8'));
const client = postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,connect_timeout:15,onnotice(){}});
try {
  await client.begin(async tx => {
    await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
    await tx`SET LOCAL statement_timeout='20s'`;
    const users = await tx`SELECT id,email,username,role,status FROM public.users ORDER BY id`;
    const hashes = await tx`SELECT
      count(*) FILTER (WHERE password_hash ~ '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$')::int AS bcrypt_format,
      count(*) FILTER (WHERE password_hash LIKE '$argon2%')::int AS argon2_prefix,
      count(*)::int AS total FROM public.users`;
    const duplicates = await tx`SELECT count(*)::int AS conflicting_groups FROM (SELECT lower(btrim(email)) FROM public.users GROUP BY lower(btrim(email)) HAVING count(*)>1) d`;
    const collisions = await tx`SELECT count(*)::int AS matches FROM auth.users a JOIN public.users u ON lower(btrim(a.email))=lower(btrim(u.email))`;
    const authCount = await tx`SELECT count(*)::int AS count FROM auth.users`;
    const mappings = await tx`SELECT count(*)::int AS count FROM public.auth_identities`;
    const triggers = await tx`SELECT t.tgname,pg_get_triggerdef(t.oid) AS definition,p.proname,pg_get_functiondef(p.oid) AS function_definition FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid WHERE t.tgrelid IN ('auth.users'::regclass,'auth.identities'::regclass,'public.auth_identities'::regclass) AND NOT t.tgisinternal ORDER BY t.tgname`;
    console.log(JSON.stringify({users,passwordFormatSummary:hashes,duplicates,authEmailCollisions:collisions,authCount,mappings,triggers,adminCredentialPresent:Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)},null,2));
  });
} catch(e) {console.error(`Read-only inspection failed (${e.code ?? e.name}); sensitive details hidden.`);process.exitCode=1;}
finally {await client.end({timeout:5});}
