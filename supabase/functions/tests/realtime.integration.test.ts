// Dedicated isolated backend and existing disposable test identities only.
// No checkout, outbox, provider email, production writes, or user deletion.
import postgres from 'npm:postgres@3.4.7';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
const env=(key:string)=>Deno.env.get(key)??'';
const configured=env('LUMA_TEST_ISOLATED')==='true'&&['LUMA_TEST_ADMIN_DATABASE_URL','LUMA_TEST_SUPABASE_URL','LUMA_TEST_PUBLISHABLE_KEY','LUMA_REALTIME_OWNER_TOKEN','LUMA_REALTIME_OUTSIDER_TOKEN'].every(key=>Boolean(env(key)));
function assert(value:unknown,message:string){if(!value)throw new Error(message);}
Deno.test({name:'isolated Realtime owner delivery, outsider denial and reconnect snapshot',ignore:!configured,sanitizeOps:false,sanitizeResources:false,fn:async()=>{
 const url=env('LUMA_TEST_SUPABASE_URL');assert(new URL(url).hostname!=='xiunfinvgxoquxiqnnyj.supabase.co','Never test against shared Luma project');
 const make=(token:string)=>createClient(url,env('LUMA_TEST_PUBLISHABLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
 const owner=make(env('LUMA_REALTIME_OWNER_TOKEN')),outsider=make(env('LUMA_REALTIME_OUTSIDER_TOKEN'));
 const ownerUser=(await owner.auth.getUser(env('LUMA_REALTIME_OWNER_TOKEN'))).data.user;
 const otherUser=(await outsider.auth.getUser(env('LUMA_REALTIME_OUTSIDER_TOKEN'))).data.user;
 assert(ownerUser&&otherUser&&ownerUser.is_anonymous===false&&otherUser.is_anonymous===false&&ownerUser.id!==otherUser.id,'Need two distinct verified disposable users');const id=ownerUser!.id;
 const db=postgres(env('LUMA_TEST_ADMIN_DATABASE_URL'),{max:1,prepare:false,ssl:'require'});let created=false;let previous:number|undefined;let owned=0,ownedOrders=0,foreign=0;const orderId=crypto.randomUUID();let orderCreated=false;
 const join=async(client:typeof owner,counter:()=>void)=>{
  await client.realtime.setAuth(client===owner?env('LUMA_REALTIME_OWNER_TOKEN'):env('LUMA_REALTIME_OUTSIDER_TOKEN'));
  const channel=client.channel(`luma-test:${crypto.randomUUID()}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'carts',filter:`user_id=eq.${id}`},counter).on('postgres_changes',{event:'INSERT',schema:'public',table:'orders',filter:`user_id=eq.${id}`},()=>{if(client===owner)ownedOrders++;else foreign++;});
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Subscription timeout')),12000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);resolve();}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timer);reject(new Error('Subscription rejected'));}});});return channel;
 };
 try{
  const [row]=await db`select revision from public.carts where user_id=${id}`;previous=row?.revision;
  if(previous===undefined){await db`insert into public.carts(user_id) values(${id})`;previous=0;created=true;}
  let channel=await join(owner,()=>owned++);await join(outsider,()=>foreign++);
  await db`update public.carts set revision=revision+1 where user_id=${id}`;
  const deadline=Date.now()+10000;while(owned===0&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));assert(owned>0,'Owner must receive actual update');await new Promise(r=>setTimeout(r,1000));assert(foreign===0,'Outsider received owner payload');
  await db`insert into public.orders(id,reference,user_id,subtotal_kobo,delivery_kobo,total_kobo,recipient_email,delivery,idempotency_key,request_fingerprint) values(${orderId},${'LUMA-REALTIME-'+orderId},${id},100,250000,250100,'fixture@example.invalid','{}',${crypto.randomUUID()},${'a'.repeat(64)})`;orderCreated=true;
  const orderDeadline=Date.now()+10000;while(ownedOrders===0&&Date.now()<orderDeadline)await new Promise(r=>setTimeout(r,100));assert(ownedOrders>0,'Owner must receive actual order insert');await new Promise(r=>setTimeout(r,1000));assert(foreign===0,'Outsider received private order');
  await owner.removeChannel(channel);await db`update public.carts set revision=revision+1 where user_id=${id}`;channel=await join(owner,()=>owned++);
  const snapshot=await owner.from('carts').select('revision').eq('user_id',id).single();assert(!snapshot.error&&snapshot.data.revision===previous!+2,'Reconnect snapshot missed changes');
 }finally{
  await owner.removeAllChannels();await outsider.removeAllChannels();
  if(orderCreated)await db`delete from public.orders where id=${orderId}`;
  if(created)await db`delete from public.carts where user_id=${id}`;else if(previous!==undefined)await db`update public.carts set revision=${previous} where user_id=${id}`;
  await db.end();
 }
}});
