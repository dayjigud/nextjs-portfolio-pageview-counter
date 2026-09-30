import { isConfigured, requireShopClient } from './client.js';
import { getCart,updateCart,prepareHandoff,redeemHandoff } from './api.js';
import { safeReturnPath } from './contracts.js';
import { readHandoff,readHandoffRecovery,writeHandoff,clearHandoff,clearOrderKey } from './auth-state.js';
export { isConfigured };
export async function getAuthState(){
 if(!isConfigured())return {isAnonymous:true,user:null};
 const {data,error}=await requireShopClient().auth.getUser();
 if(error||!data.user)return {isAnonymous:true,user:null};return {user:data.user,isAnonymous:Boolean(data.user.is_anonymous)};
}
export async function ensureGuestSession(){const client=requireShopClient();const {data}=await client.auth.getSession();if(data.session)return data.session;
 const result=await client.auth.signInAnonymously();if(result.error)throw new Error('Your guest cart could not be started. Please retry.');return result.data.session;}
async function beginGoogle(returnTo, emptyBagHome=false){
 const client=requireShopClient();const {data}=await client.auth.getSession();
 if(data.session?.user.is_anonymous){const cart=await getCart();if(cart.lines.length){const handoff=await prepareHandoff();writeHandoff(sessionStorage,{...handoff,returnTo:safeReturnPath(returnTo),guestSession:data.session});}}
 const redirectTo=new URL('/projects/shop/auth/callback/',location.origin);redirectTo.searchParams.set('next',safeReturnPath(returnTo));if(emptyBagHome)redirectTo.searchParams.set('emptyBagHome','1');
 const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectTo.href}});if(error)throw new Error('Google sign-in could not start. Your cart is unchanged.');
}
export async function signInShop(returnTo){await beginGoogle(safeReturnPath(returnTo??'/projects/shop/cart/'),returnTo===undefined);}
async function returnAfterGoogle(returnTo,params){
 let destination=safeReturnPath(returnTo);
 if(params.get('emptyBagHome')==='1'&&destination==='/projects/shop/cart/'&&!(await getCart()).lines.length)destination='/projects/shop/';
 location.replace(destination);
}
export async function startCheckout(){const state=await getAuthState();if(state.user&&!state.isAnonymous){location.assign('/projects/shop/checkout/');return;}await beginGoogle('/projects/shop/checkout/');}
export async function completeOAuthCallback(){
 const client=requireShopClient();const params=new URLSearchParams(location.search);const recovery=readHandoffRecovery(sessionStorage);const handoff=readHandoff(sessionStorage);
 if(!handoff&&recovery){
  writeHandoff(sessionStorage,recovery);
  const restored=await client.auth.setSession(recovery.guestSession);history.replaceState(null,'',location.pathname);
  if(restored.error)throw new Error('The transfer expired and guest sign-in could not be restored. Please retry.');
  clearHandoff(sessionStorage);
  throw new Error('Your cart transfer expired. Your guest bag is restored. Return to your bag and start Google sign-in again.');
 }
 if(params.has('error')||!params.get('code')){
  if(!params.has('error')&&(await getAuthState()).user?.is_anonymous===false){
   if(handoff){await redeemHandoff(handoff.token);clearHandoff(sessionStorage);}
   await returnAfterGoogle(handoff?.returnTo??params.get('next'),params);return;
  }
  if(handoff?.guestSession)await client.auth.setSession(handoff.guestSession);
  clearHandoff(sessionStorage);history.replaceState(null,'',location.pathname);
  throw new Error('Sign-in was canceled or could not finish. Your guest cart is unchanged.');
 }
 const result=await client.auth.exchangeCodeForSession(params.get('code'));
 history.replaceState(null,'',location.pathname);
 if(result.error){if(handoff?.guestSession)await client.auth.setSession(handoff.guestSession);clearHandoff(sessionStorage);throw new Error('Google sign-in could not finish. Your guest bag is preserved. Return to your cart and try again.');}
 if(handoff){try{await redeemHandoff(handoff.token);clearHandoff(sessionStorage);}catch(error){
  throw error;
 }}
 await returnAfterGoogle(handoff?.returnTo??params.get('next'),params);
}
export async function getTransferReview(){
 const state=readHandoff(sessionStorage);if(!state?.guestSession)throw new Error('This cart transfer has expired.');
 const [guest,account]=await Promise.all([getCart(state.guestSession),getCart()]);return {guest,account};
}
export async function reviseGuestTransfer(input){
 const state=readHandoff(sessionStorage);if(!state?.guestSession)throw new Error('This cart transfer has expired.');
 await updateCart(input,state.guestSession);const fresh=await prepareHandoff(state.guestSession);
 writeHandoff(sessionStorage,{...state,...fresh});
}
export async function retryGuestTransfer(){
 const state=readHandoff(sessionStorage);if(!state)throw new Error('This cart transfer has expired.');
 const fresh=await prepareHandoff(state.guestSession);writeHandoff(sessionStorage,{...state,...fresh});
 await redeemHandoff(fresh.token);clearHandoff(sessionStorage);location.replace(safeReturnPath(state.returnTo));
}
export async function signOutShop(){const {error}=await requireShopClient().auth.signOut();if(error)throw error;clearHandoff(sessionStorage);clearOrderKey(sessionStorage);location.assign('/projects/shop/');}
