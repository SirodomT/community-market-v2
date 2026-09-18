import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import postgres from 'postgres';

// Dedicated, explicitly approved additive operation. Never runs the fresh-install migration.
const mode = process.argv[2];
assert(['--check', '--apply', '--verify'].includes(mode));
config({ path: '.env.local', quiet: true });
const url = new URL(process.env.DATABASE_URL);
const auth = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
assert(['postgres:', 'postgresql:'].includes(url.protocol));
assert(url.hostname.endsWith('.pooler.supabase.com') && url.port === '6543');
assert(decodeURIComponent(url.username).endsWith(`.${auth.hostname.split('.')[0]}`));
const { certificate } = JSON.parse(await readFile('certs/supabase-ca.json', 'utf8'));
const historical = JSON.parse(await readFile('work/supabase-schema-inspection.json', 'utf8'));
const tables = historical.counts.map(x => x.table).sort();
const renames = [
  ['cart_items_product_id_products_id_fk', 'cart_items_product_id_idx'],
  ['order_items_order_id_orders_id_fk', 'order_items_order_id_idx'],
  ['order_items_product_id_products_id_fk', 'order_items_product_id_idx'],
  ['order_items_shop_id_shops_id_fk', 'order_items_shop_id_idx'],
  ['order_shops_shop_id_shops_id_fk', 'order_shops_shop_id_idx'],
  ['orders_user_id_users_id_fk', 'orders_user_id_idx'],
  ['products_category_id_categories_id_fk', 'products_category_id_idx'],
  ['products_shop_id_shops_id_fk', 'products_shop_id_idx'],
  ['sessions_user_id_users_id_fk', 'sessions_user_id_idx'],
  ['shop_requests_user_id_users_id_fk', 'shop_requests_user_id_idx'],
];
const ddl = [
  ...renames.map(([a,b]) => `ALTER INDEX public."${a}" RENAME TO "${b}"`),
  'CREATE UNIQUE INDEX users_email_lower_unique ON public.users USING btree (lower(email))',
  'CREATE UNIQUE INDEX categories_name_lower_unique ON public.categories USING btree (lower(name))',
  `CREATE TABLE public.auth_identities (
    supabase_user_id uuid PRIMARY KEY NOT NULL,
    user_id integer NOT NULL,
    CONSTRAINT auth_identities_user_id_unique UNIQUE (user_id)
  )`,
  'ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY',
  `ALTER TABLE public.auth_identities ADD CONSTRAINT auth_identities_user_id_users_id_fk
   FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE NO ACTION`,
];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function inventory(tx) {
  const names = [...tables, 'auth_identities'];
  const result = {};
  result.tables = await tx`SELECT c.relname AS name,c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname=ANY(${names}) ORDER BY 1`;
  result.columns = await tx`SELECT c.relname AS table_name,a.attname AS name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull AS not_null,a.attidentity AS identity,pg_get_expr(d.adbin,d.adrelid) AS default_value FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname='public' AND c.relname=ANY(${names}) AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum`;
  result.constraints = await tx`SELECT c.relname AS table_name,k.conname AS name,k.contype AS type,k.convalidated AS valid,pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY(${names}) AND k.contype <> 'n' ORDER BY 1,2`;
  result.indexes = await tx`SELECT c.relname AS table_name,i.relname AS name,x.indisvalid AS valid,pg_get_indexdef(i.oid) AS definition FROM pg_index x JOIN pg_class c ON c.oid=x.indrelid JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY(${names}) ORDER BY 1,2`;
  result.enums = await tx`SELECT t.typname AS name,e.enumlabel AS label FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public' ORDER BY t.typname,e.enumsortorder`;
  result.policies = await tx`SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename=ANY(${names}) ORDER BY 1,2`;
  result.authTriggers = await tx`SELECT tgname,pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='auth.users'::regclass ORDER BY tgname`;
  result.journal = await tx`SELECT to_regclass('drizzle.__drizzle_migrations')::text AS journal`;
  // Server serializes all values, including full timestamp precision. Persist hashes only.
  result.rows = [];
  for (const table of tables) {
    const rows = await tx`SELECT to_jsonb(t)::text AS contents FROM ${tx(`public.${table}`)} t ORDER BY id`;
    result.rows.push({table, count: rows.length, sha256: hash(rows.map(x => x.contents))});
  }
  const [emails] = await tx`SELECT count(*)::integer AS count FROM (SELECT lower(email) FROM public.users GROUP BY lower(email) HAVING count(*)>1) d`;
  const [categories] = await tx`SELECT count(*)::integer AS count FROM (SELECT lower(name) FROM public.categories GROUP BY lower(name) HAVING count(*)>1) d`;
  result.duplicates = { emails: emails.count, categories: categories.count };
  if (result.tables.some(t => t.name === 'auth_identities')) {
    const [r] = await tx`SELECT count(*)::integer AS count FROM public.auth_identities`;
    result.authIdentityCount = r.count;
  }
  return JSON.parse(JSON.stringify(result));
}
function equal(a,b,label) { assert.equal(JSON.stringify(a), JSON.stringify(b), label); }
function validateBefore(state) {
  for (const part of ['tables','columns','constraints','indexes','policies']) equal(state[part],historical.actual[part],`Unexpected historical drift: ${part}`);
  equal(state.enums,historical.allPublicEnums,'Enum drift');
  equal(state.rows.map(({table,count}) => ({table,count})), [...historical.counts].sort((a,b)=>a.table.localeCompare(b.table)), 'Row counts changed');
  equal(state.duplicates,{emails:0,categories:0},'Normalized duplicates found');
  equal(state.journal,[{journal:null}],'Unexpected migration journal');
  assert.equal(state.rows.reduce((n,r)=>n+r.count,0),61);
}
function validateAfter(before,after) {
  equal(after.rows,before.rows,'Existing row values or IDs changed');
  for (const part of ['enums','policies','authTriggers','journal','duplicates']) equal(after[part],before[part],`${part} changed`);
  for (const part of ['tables','columns','constraints']) equal(after[part].filter(x=>(x.table_name ?? x.name)!=='auth_identities'),before[part],`Existing ${part} changed`);
  const expectedIndexes = before.indexes.map(i => {
    const pair = renames.find(([old]) => old===i.name);
    return pair ? {...i,name:pair[1],definition:i.definition.replace(`INDEX ${pair[0]} `,`INDEX ${pair[1]} `)} : i;
  });
  expectedIndexes.push({table_name:'users',name:'users_email_lower_unique',valid:true,definition:'CREATE UNIQUE INDEX users_email_lower_unique ON public.users USING btree (lower((email)::text))'});
  expectedIndexes.push({table_name:'categories',name:'categories_name_lower_unique',valid:true,definition:'CREATE UNIQUE INDEX categories_name_lower_unique ON public.categories USING btree (lower((name)::text))'});
  expectedIndexes.sort((a,b)=>a.table_name.localeCompare(b.table_name)||a.name.localeCompare(b.name));
  equal(after.indexes.filter(i=>i.table_name!=='auth_identities'),expectedIndexes,'Index definitions differ');
  equal(after.tables.filter(x=>x.name==='auth_identities'),[{name:'auth_identities',rls:true}],'Mapping RLS');
  equal(after.columns.filter(x=>x.table_name==='auth_identities'),[
    {table_name:'auth_identities',name:'supabase_user_id',type:'uuid',not_null:true,identity:'',default_value:null},
    {table_name:'auth_identities',name:'user_id',type:'integer',not_null:true,identity:'',default_value:null},
  ],'Mapping columns');
  equal(after.constraints.filter(x=>x.table_name==='auth_identities'),[
    {table_name:'auth_identities',name:'auth_identities_pkey',type:'p',valid:true,definition:'PRIMARY KEY (supabase_user_id)'},
    {table_name:'auth_identities',name:'auth_identities_user_id_unique',type:'u',valid:true,definition:'UNIQUE (user_id)'},
    {table_name:'auth_identities',name:'auth_identities_user_id_users_id_fk',type:'f',valid:true,definition:'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'},
  ],'Mapping constraints');
  assert.equal(after.authIdentityCount,0);
  assert(after.indexes.every(x=>x.valid) && after.constraints.every(x=>x.valid));
  assert.equal(after.indexes.length,30);
}
let client;
try {
  client = postgres(process.env.DATABASE_URL,{prepare:false,ssl:{ca:certificate,rejectUnauthorized:true},max:1,connect_timeout:15,idle_timeout:5,onnotice(){}});
  let report;
  await client.begin(async tx => {
    if (mode !== '--apply') await tx`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`;
    await tx`SET LOCAL search_path=public`;
    await tx`SET LOCAL TIME ZONE 'UTC'`;
    await tx`SET LOCAL lock_timeout='10s'`;
    await tx`SET LOCAL statement_timeout='30s'`;
    if (mode === '--apply') {
      await tx`SELECT pg_advisory_xact_lock(1789651539,435)`;
      // Block concurrent writes and DDL throughout before/after verification.
      await tx.unsafe(`LOCK TABLE ${tables.map(t=>`public."${t}"`).join(', ')} IN ACCESS EXCLUSIVE MODE`);
    }
    const before = await inventory(tx);
    if (mode === '--verify') {
      const baseline = JSON.parse(await readFile('work/supabase-additive-preflight.json','utf8'));
      validateAfter(baseline.state,before);
      report = {verifiedAt:new Date().toISOString(),state:before,verified:true};
    } else {
      validateBefore(before);
      if (mode === '--apply') {
        const baseline = JSON.parse(await readFile('work/supabase-additive-preflight.json','utf8'));
        equal(before,baseline.state,'State changed since displayed preflight');
        for (const statement of ddl) await tx.unsafe(statement);
        const after = await inventory(tx);
        validateAfter(before,after);
        report = {verifiedAt:new Date().toISOString(),before,after,sql:ddl,verified:true};
      } else report = {inspectedAt:new Date().toISOString(),state:before};
    }
  });
  const suffix = mode === '--check' ? 'preflight' : mode === '--apply' ? 'committed' : 'verification';
  await writeFile(`work/supabase-additive-${suffix}.json`,JSON.stringify(report,null,2));
  const state = report.state ?? report.after;
  console.log(JSON.stringify({mode,transactionCompleted:true,counts:state.rows.map(({table,count})=>({table,count})),duplicates:state.duplicates,tables:state.tables.length,indexes:state.indexes.length,constraints:state.constraints.length,authIdentityCount:state.authIdentityCount,verified:report.verified ?? false},null,2));
} catch (e) {
  console.error(`Additive reconciliation stopped (${e.code ?? e.name}). No credentials or row contents printed. Inspect transaction outcome before retrying.`);
  if (e.code === 'ERR_ASSERTION') console.error(e.message.split('\n')[0]);
  process.exitCode=1;
} finally { await client?.end({timeout:5}); }
