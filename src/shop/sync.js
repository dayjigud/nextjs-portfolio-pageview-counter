// Events invalidate a snapshot; bearer checks and RLS remain authoritative.
export function watchShopChanges({client,userId,onInvalidate,onSubscribed,onError}) {
 let active=true;
 const channel=client.channel(`luma-web:${userId}`);
 const register=(table,event,kind)=>channel.on('postgres_changes',{event,schema:'public',table,filter:`user_id=eq.${userId}`},()=>{if(active)onInvalidate({kind});});
 register('carts','INSERT','cart');register('carts','UPDATE','cart');register('orders','INSERT','orders');
 channel.subscribe(status=>{if(!active)return;if(status==='SUBSCRIBED')onSubscribed();else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))onError?.();});
 return ()=>{if(!active)return;active=false;void client.removeChannel(channel);};
}
