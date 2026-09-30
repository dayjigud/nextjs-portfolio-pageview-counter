import test from 'node:test';
import assert from 'node:assert/strict';
import { readHandoff, readHandoffRecovery, writeHandoff, clearHandoff, orderRequestKey, pendingOrderKey, clearOrderKey } from '../../src/shop/auth-state.js';
const storage = () => { const map = new Map(); return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}; };
test('guest handoff is recovered only during its lifetime', () => {
 const store=storage();writeHandoff(store,{token:'a'.repeat(64),expiresAt:new Date(10000).toISOString(),returnTo:'/projects/shop/checkout/',guestSession:{access_token:'private',refresh_token:'private'}});
 assert.equal(readHandoff(store,9000).token,'a'.repeat(64));assert.equal(readHandoff(store,11000),null);assert.equal(store.getItem('luma-auth-handoff-v1'),null);
});
test('malformed auth storage is removed instead of executing return data', () => {const store=storage();store.setItem('luma-auth-handoff-v1','bad');assert.equal(readHandoff(store),null);});
test('expired transfer recovery can restore anonymous credentials before transfer token is removed',()=>{
 const store=storage();writeHandoff(store,{token:'a'.repeat(64),expiresAt:new Date(10000).toISOString(),guestSession:{access_token:'a',refresh_token:'r',user:{is_anonymous:true}}});
 const recovery=readHandoffRecovery(store);assert.equal(readHandoff(store,11000),null);assert.equal(recovery.guestSession.refresh_token,'r');
});
test('checkout key is stable for a retry but changes with owner or revision', () => {const store=storage();const a=orderRequestKey(store,'u',1);assert.equal(orderRequestKey(store,'u',1),a);assert.notEqual(orderRequestKey(store,'v',1),a);clearHandoff(store);});
test('pending checkout can be recovered after its cart was cleared, only by its owner', () => {
 const store=storage();const key=orderRequestKey(store,'u',1);
 assert.equal(pendingOrderKey(store,'u'),key);assert.equal(pendingOrderKey(store,'v'),null);
 clearOrderKey(store);assert.equal(pendingOrderKey(store,'u'),null);
 store.setItem('luma-order-request-v1','bad');assert.equal(pendingOrderKey(store,'u'),null);
});
