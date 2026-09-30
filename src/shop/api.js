import { requireShopClient, supabaseUrl, publishableKey } from './client.js';
export class ShopError extends Error{constructor(code,message,details){super(message);this.code=code;this.details=details;}}
export async function request(name,{method='GET',body,session}={}){
 const client=requireShopClient();const current=session??(await client.auth.getSession()).data.session;
 if(!current)throw new ShopError('AUTH_REQUIRED','Please sign in to continue.');
 const response=await fetch(`${supabaseUrl}/functions/v1/${name}`,{method,headers:{'Content-Type':'application/json',apikey:publishableKey,Authorization:`Bearer ${current.access_token}`},...(body?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{throw new ShopError('SERVICE_UNAVAILABLE','The shop could not respond. Please retry.');}
 if(!response.ok||data?.error)throw new ShopError(data?.error?.code??'REQUEST_FAILED',data?.error?.message??'Unable to complete this action.',data?.error?.details);
 return data;
}
export async function getCart(session){const client=requireShopClient();const current=session??(await client.auth.getSession()).data.session;if(!current)return {id:null,revision:0,lines:[],subtotalKobo:0};return request('cart',{session:current});}
export const updateCart=(input,session)=>request('cart',{method:'POST',body:input,session});
export const prepareHandoff=session=>request('cart-handoff',{method:'POST',body:{action:'prepare'},session});
export const redeemHandoff=token=>request('cart-handoff',{method:'POST',body:{action:'redeem',token}});
export const getQuote=()=>request('quote');
export const placeOrder=input=>request('checkout',{method:'POST',body:input});
export const getOrder=id=>request(`orders?id=${encodeURIComponent(id)}`);
export const findOrderByRequest=key=>request(`orders?requestKey=${encodeURIComponent(key)}`);
export const listOrders=()=>request('orders');
