import { requireShopClient, supabaseUrl } from './client.js';
import { readCatalogCache, writeCatalogCache } from './catalog-cache.js';
let catalogRequest;
async function loadCatalog(){
 let cached;try{cached=readCatalogCache(sessionStorage,supabaseUrl);}catch{}
 if(cached)return cached;
 catalogRequest??=requireShopClient().from('products').select('*, categories(slug), product_images(*), product_variants(*)').eq('active',true).order('name').then(({data,error})=>{
  if(error)throw new Error('Products could not load. Please retry.');
  try{writeCatalogCache(sessionStorage,supabaseUrl,data);}catch{}
  return data;
 }).finally(()=>{catalogRequest=null;});
 return catalogRequest;
}
function mapProduct(row){const client=requireShopClient();return {id:row.id,slug:row.slug,name:row.name,description:row.description,categorySlug:row.categories?.slug,specifications:row.specifications??{},images:(row.product_images??[]).sort((a,b)=>a.sort_order-b.sort_order).map(image=>({url:client.storage.from('luma-catalog').getPublicUrl(image.storage_path).data.publicUrl,alt:image.alt_text??row.name})),variants:(row.product_variants??[]).filter(v=>v.active).map(v=>({id:v.id,label:v.label,priceKobo:v.price_kobo,currency:v.currency,active:v.active}))};}
export async function getCatalog({query='',category=null}={}){return (await loadCatalog()).map(mapProduct).filter(p=>(!category||p.categorySlug===category)&&(!query||`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())));}
export async function getProduct(slug){return (await getCatalog()).find(p=>p.slug===slug)??null;}
