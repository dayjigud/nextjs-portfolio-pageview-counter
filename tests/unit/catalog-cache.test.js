import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogCache, writeCatalogCache, CATALOG_CACHE_TTL, CATALOG_CACHE_KEY } from '../../src/shop/catalog-cache.js';
import { product } from '../helpers/shop-fixture.js';
const storage = () => { const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}; };

test('public catalog cache expires and cannot cross Supabase projects', () => {
 const store=storage();writeCatalogCache(store,'project-a',[product],1000);
 assert.deepEqual(readCatalogCache(store,'project-a',1100),[product]);
 assert.equal(readCatalogCache(store,'project-b',1100),null);
 assert.equal(readCatalogCache(store,'project-a',1000+CATALOG_CACHE_TTL),null);
 assert.equal(readCatalogCache(store,'project-a',999),null);
});

test('corrupt catalog cache and unavailable browser storage fall back to the service', () => {
 const store=storage();store.setItem(CATALOG_CACHE_KEY,'invalid json');
 assert.equal(readCatalogCache(store,'project-a'),null);
 writeCatalogCache(store,'project-a',[{name:'Bad row',slug:'bad'}],1000);
 assert.equal(readCatalogCache(store,'project-a',1100),null);
 const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');}};
 assert.equal(readCatalogCache(blocked,'project-a'),null);
 assert.doesNotThrow(()=>writeCatalogCache(blocked,'project-a',[product]));
});
