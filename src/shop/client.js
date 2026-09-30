import { createClient } from '@supabase/supabase-js';
const env=import.meta.env ?? {};
export const supabaseUrl=env.VITE_SUPABASE_URL ?? '';
export const publishableKey=env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
let client;
export function isConfigured(){return Boolean(supabaseUrl&&publishableKey);}
export function createShopClient(){
 if(!isConfigured())return null;
 client ??= createClient(supabaseUrl,publishableKey,{auth:{flowType:'pkce',storageKey:'luma-supabase-session',detectSessionInUrl:false}});
 return client;
}
export function requireShopClient(){const value=createShopClient();if(!value)throw new Error('The shop is not connected yet. Please try again later.');return value;}
