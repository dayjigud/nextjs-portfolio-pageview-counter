// Public catalog only. Never store sessions, carts, quotes, orders, or customer data here.
export const CATALOG_CACHE_KEY = 'luma-public-catalog-v1';
export const CATALOG_CACHE_TTL = 2 * 60 * 1000;
export function readCatalogCache(storage, project, now = Date.now()) {
 try {
  const value = JSON.parse(storage.getItem(CATALOG_CACHE_KEY));
  if(value?.project !== project || !Number.isFinite(value.savedAt) || now < value.savedAt || now - value.savedAt >= CATALOG_CACHE_TTL || !Array.isArray(value.rows))return null;
  if(!value.rows.every(row=>row && typeof row.name==='string' && typeof row.slug==='string' && Array.isArray(row.product_variants) && Array.isArray(row.product_images)))return null;
  return value.rows;
 } catch { return null; }
}
export function writeCatalogCache(storage, project, rows, now = Date.now()) {
 try { storage.setItem(CATALOG_CACHE_KEY, JSON.stringify({project,savedAt:now,rows})); } catch { /* Browsing works without storage. */ }
}
