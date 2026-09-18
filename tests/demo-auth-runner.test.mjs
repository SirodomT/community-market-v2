import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccounts, expectedUsers, validatePreflight } from '../scripts/migrate-demo-auth.mjs';

const good=()=>({users:structuredClone(expectedUsers),duplicateGroups:0,authUsers:0,mappings:0,bcryptCount:4,customTriggers:0,deferredForeignKeys:0});
test('preflight fails closed for existing accounts, mappings, duplicates and source drift',()=>{
  validatePreflight(good());
  for(const [field,value] of Object.entries({duplicateGroups:1,authUsers:1,mappings:1,bcryptCount:3,customTriggers:1,deferredForeignKeys:1})) {
    assert.throws(()=>validatePreflight({...good(),[field]:value}));
  }
  const changed=good(); changed.users[0].role='ADMIN';
  assert.throws(()=>validatePreflight(changed));
});
const setup=()=>({
  users:expectedUsers.map(u=>({...u,password_hash:'MOCK_SECRET_HASH'})),
  manifest:{runId:'test-run',accounts:expectedUsers.map(u=>({userId:u.id,email:u.email,authId:`uuid-${u.id}`,status:'planned'}))},
});
test('exact email/hash import; pending recovery saved before API; no secrets in manifest',async()=>{
  const {users,manifest}=setup(); const calls=[]; const saves=[];
  await createAccounts({users,manifest,save:async m=>saves.push(structuredClone(m)),createUser:async payload=>{
    const entry=saves.at(-1).accounts.find(a=>a.authId===payload.id);
    assert.equal(entry.status,'request_pending');
    assert.equal(payload.email,users[calls.length].email);
    assert.equal(payload.password_hash,'MOCK_SECRET_HASH');
    assert.equal(payload.email_confirm,true);
    assert.equal(payload.app_metadata.demo_test_only,true);
    assert.equal(payload.role,undefined);
    calls.push(payload);
    return {data:{user:{id:payload.id,email:payload.email,email_confirmed_at:'confirmed'}},error:null};
  }});
  assert.equal(calls.length,4);
  assert(manifest.accounts.every(a=>a.status==='created'));
  assert(!JSON.stringify(saves).includes('MOCK_SECRET_HASH'));
});
test('uncertain failure stops after first account; no retry or automatic cleanup',async()=>{
  const {users,manifest}=setup();let calls=0;
  await assert.rejects(createAccounts({users,manifest,save:async()=>{},createUser:async()=>{calls++;throw new Error('network timeout');}}),/uncertain/);
  assert.equal(calls,1);assert.equal(manifest.accounts[0].status,'request_pending');
  assert.equal(manifest.accounts[1].status,'planned');
});
test('provider collision and normalized-email mismatch abort immediately',async()=>{
  for(const collision of [true,false]) {
    const {users,manifest}=setup();let calls=0;
    await assert.rejects(createAccounts({users,manifest,save:async()=>{},createUser:async p=>{
      calls++;
      return collision ? {error:{message:'collision'}} : {data:{user:{id:p.id,email:'changed@example.com',email_confirmed_at:'confirmed'}}};
    }}));
    assert.equal(calls,1);
  }
});
test('manifest write failure prevents external API call',async()=>{
  const {users,manifest}=setup();let calls=0;
  await assert.rejects(createAccounts({users,manifest,save:async()=>{throw new Error('disk full');},createUser:async()=>{calls++;}}));
  assert.equal(calls,0);
});
