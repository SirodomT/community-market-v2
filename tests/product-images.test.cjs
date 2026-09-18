/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
const {drizzle}=require('drizzle-orm/pglite');
const {eq}=require('drizzle-orm');
const {createClient}=require('@supabase/supabase-js');
const {randomUUID}=require('node:crypto');
require('dotenv').config({path:'.env.local',quiet:true});
const live=process.env.TEST_LIVE_STORAGE==='1';
function load(file,mocks={}) {
  const exports={};
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(source,{exports,Error,Date,URL,RegExp,Number,Buffer,File,process,console,require:name=>name in mocks?mocks[name]:require(name)},{filename:file});
  return exports;
}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
test(live?'seller image lifecycle: isolated PostgreSQL + live Storage':'seller image lifecycle and failure safety: isolated PostgreSQL + fake Storage',async t=>{
  const engine=new PGlite();const objects=new Map();const removed=[];let failUpload=false;
  const uploaded=[];
  try {
    await engine.exec('CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);');
    await engine.exec(fs.readFileSync('drizzle-postgres/0000_supabase_marketplace.sql','utf8'));
    const db=drizzle(engine),schema=load('src/db/schema.ts');
    const {users,shops,products}=schema;
    const [seller]=await db.insert(users).values({username:'Storage fixture',email:'fixture@example.invalid',passwordHash:'fixture',role:'SELLER'}).returning();
    const [shop]=await db.insert(shops).values({ownerId:seller.id,name:'Fixture',description:'Fixture',phone:'000',address:'Fixture'}).returning();
    let actor=seller;
    const fake={upload:async(path,bytes)=>{if(failUpload)return {error:{}};objects.set(path,bytes);uploaded.push(path);return {error:null};},getPublicUrl:path=>({data:{publicUrl:`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`}}),remove:async paths=>{for(const p of paths){objects.delete(p);removed.push(p);}return {error:null};}};
    const sdk=live?{createClient:(...args)=>{
      const c=createClient(...args);const original=c.storage.from.bind(c.storage);
      c.storage.from=(bucket)=>{const s=original(bucket),upload=s.upload.bind(s);s.upload=async(path,...rest)=>{uploaded.push(path);return upload(path,...rest);};return s;};return c;
    }}:{createClient:()=>({storage:{from:()=>fake}})};
    const helper=load('src/lib/product-images.ts',{'server-only':{},'@/db':{db},'@/db/schema':schema,'@supabase/supabase-js':sdk});
    const mocks={'@/db':{db},'@/db/schema':schema,'@/lib/product-images':helper,'@/lib/auth':{requireRole:async roles=>{assert(roles.includes(actor.role));return actor;}},'next/cache':{revalidatePath(){}},'next/navigation':{redirect:p=>{throw new Error(`REDIRECT:${p}`);}}};
    const create=load('src/app/seller/products/new/actions.ts',mocks).createProduct;
    const edit=load('src/app/seller/products/[id]/edit/actions.ts',mocks).updateProduct;
    const remove=load('src/app/seller/products/actions.ts',mocks).deleteProduct;
    const form=(id,image)=>{const f=new FormData();for(const [k,v] of Object.entries({name:'Fixture product',description:'Fixture',price:'12.50',stock:'7',...(id?{productId:String(id)}:{})}))f.set(k,v);if(image)f.set('image',image);return f;};
    const image=()=>new File([png],'fixture.png',{type:'image/png'});
    let product;
    await t.test('new product upload succeeds before URL is saved',async()=>{
      await assert.rejects(create(form(null,image())),/REDIRECT:\/seller\/products$/);
      [product]=await db.select().from(products);
      assert(helper.ownedProductImagePath(product.imageUrl,shop.id));assert.equal(product.stock,7);
    });
    await t.test('public image fetch and Next image rendering',{skip:!live},async()=>{
      const response=await fetch(product.imageUrl);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
      const rendered=await fetch(`http://localhost:3100/_next/image?url=${encodeURIComponent(product.imageUrl)}&w=640&q=75`);
      assert.equal(rendered.status,200);assert(rendered.headers.get('content-type').startsWith('image/'));assert((await rendered.arrayBuffer()).byteLength>0);
    });
    await t.test('anonymous browser credentials cannot upload',{skip:!live},async()=>{
      const path=`products/${shop.id}/${randomUUID()}.png`;uploaded.push(path);
      const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
      const {error}=await anon.storage.from('product-images').upload(path,png,{contentType:'image/png',upsert:false});
      assert(error,'Anonymous upload must be denied');
    });
    await t.test('edit without image retains exact URL and stock',async()=>{
      await assert.rejects(edit(form(product.id)),/REDIRECT:/);
      const [p]=await db.select().from(products);assert.equal(p.imageUrl,product.imageUrl);assert.equal(p.stock,product.stock);
    });
    await t.test('replacement stores new URL then retires old object',async()=>{
      const old=product.imageUrl;
      await assert.rejects(edit(form(product.id,image())),/REDIRECT:/);
      [product]=await db.select().from(products);assert.notEqual(product.imageUrl,old);
      if(live) {
        const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
        const {error}=await c.storage.from('product-images').download(helper.ownedProductImagePath(old,shop.id));assert(error);
      } else assert(removed.includes(helper.ownedProductImagePath(old,shop.id)));
    });
    await t.test('reject local, foreign, traversal, other-shop and query-string deletions',async()=>{
      for(const url of ['/uploads/products/keep.png','https://evil.invalid/file.png',product.imageUrl+'?x=1',product.imageUrl.replace('/products/1/','/products/2/'),product.imageUrl.replace('/products/1/','/products/1/../')])assert.equal(helper.ownedProductImagePath(url,shop.id),null);
      await helper.removeUnusedProductImage('/uploads/products/keep.png',shop.id);
      await helper.removeUnusedProductImage(product.imageUrl,shop.id); // Still referenced: keep it.
      if(!live) assert(objects.has(helper.ownedProductImagePath(product.imageUrl,shop.id)));
    });
    await t.test('legacy local URL preserved on no-image edit; replacement never deletes local file',async()=>{
      const [legacy]=await db.insert(products).values({shopId:shop.id,name:'Legacy',description:'Fixture',price:'1.00',stock:7,imageUrl:'/uploads/products/keep.png'}).returning();
      await assert.rejects(edit(form(legacy.id)),/REDIRECT:/);
      assert.equal((await db.select().from(products).where(eq(products.id,legacy.id)))[0].imageUrl,'/uploads/products/keep.png');
      await assert.rejects(edit(form(legacy.id,image())),/REDIRECT:/);
      await remove(form(legacy.id));
    });
    await t.test('invalid MIME, oversized image and unauthorized seller rejected',async()=>{
      const before=uploaded.length;
      await assert.rejects(create(form(null,new File(['x'],'bad.svg',{type:'image/svg+xml'}))),/error=image/);
      await assert.rejects(create(form(null,new File([Buffer.alloc(921601)],'big.png',{type:'image/png'}))),/error=image-size/);
      actor={...seller,role:'USER'};await assert.rejects(create(form(null,image())));actor=seller;
      assert.equal(uploaded.length,before);
    });
    if(!live) await t.test('failed upload leaves existing product URL untouched',async()=>{
      failUpload=true;await assert.rejects(edit(form(product.id,image())),/upload failed/);failUpload=false;
      assert.equal((await db.select().from(products).where(eq(products.id,product.id)))[0].imageUrl,product.imageUrl);
    });
    if(!live) await t.test('failed product insert cleans only the new unreferenced object',async()=>{
      const before=objects.size;
      const broken=load('src/app/seller/products/new/actions.ts',{...mocks,'@/db':{db:new Proxy(db,{get(target,key){if(key==='insert')return ()=>({values:async()=>{throw new Error('INSERT_FAILED');}});const value=target[key];return typeof value==='function'?value.bind(target):value;}})}}).createProduct;
      await assert.rejects(broken(form(null,image())),/INSERT_FAILED/);
      assert.equal(objects.size,before);
    });
    if(!live) await t.test('lost insert acknowledgement retains the committed image',async()=>{
      const uncertain=load('src/app/seller/products/new/actions.ts',{...mocks,'@/db':{db:new Proxy(db,{get(target,key){if(key==='insert')return table=>({values:async values=>{await target.insert(table).values(values);throw new Error('ACK_LOST');}});const value=target[key];return typeof value==='function'?value.bind(target):value;}})}}).createProduct;
      await assert.rejects(uncertain(form(null,image())),/ACK_LOST/);
      const rows=await db.select().from(products);const inserted=rows.find(p=>p.id!==product.id);
      assert(objects.has(helper.ownedProductImagePath(inserted.imageUrl,shop.id)));
      await remove(form(inserted.id));
    });
    if(!live) await t.test('stale replacement aborts and cleans new upload, not concurrent image',async()=>{
      const prior=product.imageUrl;
      const racingHelper={...helper,uploadProductImage:async(...args)=>{
        const url=await helper.uploadProductImage(...args);
        await db.update(products).set({imageUrl:null}).where(eq(products.id,product.id));
        return url;
      }};
      const racingEdit=load('src/app/seller/products/[id]/edit/actions.ts',{...mocks,'@/lib/product-images':racingHelper}).updateProduct;
      const before=objects.size;
      await assert.rejects(racingEdit(form(product.id,image())),/Product changed/);
      assert.equal((await db.select().from(products).where(eq(products.id,product.id)))[0].imageUrl,null);
      assert.equal(objects.size,before);
      assert(objects.has(helper.ownedProductImagePath(prior,shop.id)));
      await db.update(products).set({imageUrl:prior}).where(eq(products.id,product.id));
    });
    await t.test('delete product removes only its now-unreferenced image',async()=>{
      await remove(form(product.id));assert.equal((await db.select().from(products)).length,0);
      if(!live) assert.equal(objects.size,0);
    });
  }finally {
    if(live && uploaded.length) {
      const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
      const {error}=await c.storage.from('product-images').remove(uploaded);assert.equal(error,null);
    }
    await engine.close();
  }
});
