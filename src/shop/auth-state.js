const HANDOFF='luma-auth-handoff-v1';
const ORDER='luma-order-request-v1';
export function writeHandoff(storage,state){storage.setItem(HANDOFF,JSON.stringify(state));}
export function clearHandoff(storage){storage.removeItem(HANDOFF);}
export function readHandoffRecovery(storage){
 try{const value=JSON.parse(storage.getItem(HANDOFF));const session=value?.guestSession;
 return typeof value?.token==='string'&&Number.isFinite(Date.parse(value.expiresAt))&&session?.user?.is_anonymous===true&&typeof session.access_token==='string'&&typeof session.refresh_token==='string'?value:null;
 }catch{return null;}
}
export function readHandoff(storage,now=Date.now()){
 try {const value=JSON.parse(storage.getItem(HANDOFF));if(!value)return null;
 if(typeof value.token!=='string'||!Number.isFinite(Date.parse(value.expiresAt))||Date.parse(value.expiresAt)<=now){clearHandoff(storage);return null;}return value;
 }catch{clearHandoff(storage);return null;}
}
export function orderRequestKey(storage,userId,revision){
 let prior;try{prior=JSON.parse(storage.getItem(ORDER));}catch{}
 if(prior?.userId===userId&&prior.revision===revision)return prior.key;
 const key=crypto.randomUUID();storage.setItem(ORDER,JSON.stringify({key,userId,revision}));return key;
}
export function clearOrderKey(storage){storage.removeItem(ORDER);}
export function pendingOrderKey(storage,userId){
 try{const prior=JSON.parse(storage.getItem(ORDER));return prior?.userId===userId&&typeof prior.key==='string'?prior.key:null;}catch{return null;}
}
