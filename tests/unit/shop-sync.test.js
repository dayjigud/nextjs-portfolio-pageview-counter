import test from 'node:test';
import assert from 'node:assert/strict';
import { watchShopChanges } from '../../src/shop/sync.js';
import { createRefreshCoordinator } from '../../src/shop/refresh-coordinator.js';
test('owner subscriptions invalidate only while active and clean up',()=>{
 const bindings=[];let status;let removed=0;const events=[];const channel={on(event,filter,callback){bindings.push({event,filter,callback});return this;},subscribe(callback){status=callback;return this;}};
 const stop=watchShopChanges({client:{channel:()=>channel,removeChannel:()=>{removed++;}},userId:'owner',onInvalidate:event=>events.push(event.kind),onSubscribed:()=>events.push('subscribed'),onError:()=>events.push('error')});
 assert.deepEqual(bindings.map(x=>[x.filter.table,x.filter.event,x.filter.filter]),[['carts','INSERT','user_id=eq.owner'],['carts','UPDATE','user_id=eq.owner'],['orders','INSERT','user_id=eq.owner']]);
 status('SUBSCRIBED');bindings[1].callback({});assert.deepEqual(events,['subscribed','cart']);stop();bindings[1].callback({});status('SUBSCRIBED');assert.equal(events.length,2);assert.equal(removed,1);
});
test('burst refresh waits for writes and disposal ignores late refresh',async()=>{
 let release;const writes=new Promise(resolve=>release=resolve);let refreshes=0;const coordinator=createRefreshCoordinator({refresh:async()=>{refreshes++;},waitForWrites:()=>writes,delayMs:5});
 for(let i=0;i<20;i++)coordinator.invalidate();await new Promise(r=>setTimeout(r,15));assert.equal(refreshes,0);release();await coordinator.flush();assert.equal(refreshes,1);coordinator.dispose();coordinator.invalidate();await coordinator.flush();assert.equal(refreshes,1);
});
test('invalidation during refresh gets one later snapshot',async()=>{
 let release;let calls=0;const first=new Promise(resolve=>release=resolve);const coordinator=createRefreshCoordinator({refresh:async()=>{if(++calls===1)await first;},waitForWrites:async()=>{},delayMs:0});coordinator.invalidate();await new Promise(r=>setTimeout(r,5));coordinator.invalidate();release();await coordinator.flush();assert.equal(calls,2);coordinator.dispose();
});
