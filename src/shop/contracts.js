export const SHOP_ROOT = '/projects/shop/';
export const DELIVERY_KOBO = 250000;
export const MAX_QUANTITY = 10;
export const MAX_LINES = 20;
export function formatMoney(kobo) {
  if (!Number.isSafeInteger(kobo) || kobo < 0) throw new TypeError('Invalid amount');
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: kobo % 100 ? 2 : 0 }).format(kobo / 100);
}
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
}
export function safeReturnPath(value) {
  const allowed = ['/projects/shop/', '/projects/shop/cart/', '/projects/shop/checkout/', '/projects/shop/account/'];
  if(typeof value==='string'&&/^\/projects\/shop\/confirmation\/\?order=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))return value;
  return allowed.includes(value) ? value : '/projects/shop/cart/';
}
