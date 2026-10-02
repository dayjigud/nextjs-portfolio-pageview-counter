export function createRefreshCoordinator({refresh,waitForWrites,delayMs=250}) {
 let timer,dirty=false,disposed=false,running;
 async function run(){
  if(disposed)return;
  if(running)return running;
  running=(async()=>{while(dirty&&!disposed){dirty=false;await waitForWrites();if(!disposed)await refresh();}})().finally(()=>{running=null;});
  return running;
 }
 return {
  invalidate(){if(disposed)return;dirty=true;clearTimeout(timer);timer=setTimeout(()=>{timer=null;void run().catch(()=>{});},delayMs);},
  async flush(){if(disposed)return;clearTimeout(timer);timer=null;await run();},
  dispose(){disposed=true;dirty=false;clearTimeout(timer);}
 };
}
