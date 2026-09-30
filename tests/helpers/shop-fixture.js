// These fixtures replace external services; browser code, sessions, forms and
// navigation remain the production implementation. No test hooks are shipped.
export const product = {
  id: '11111111-1111-4111-8111-111111111111', slug: 'halo-headphones',
  name: 'Halo Headphones', description: 'Wireless headphones for your everyday.',
  categories: { slug: 'audio' }, specifications: { Battery: '40 hours' },
  product_images: [], product_variants: [{ id: '22222222-2222-4222-8222-222222222222', label: 'Lavender', price_kobo: 14500000, currency: 'NGN', active: true }],
};
const guestId = '33333333-3333-4333-8333-333333333333';
const accountId = '44444444-4444-4444-8444-444444444444';
export function sessionFor(anonymous = false) {
  const id = anonymous ? guestId : accountId;
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: expires, role: 'authenticated', is_anonymous: anonymous })}.fixture`,
    refresh_token: `fixture-refresh-${id}`, token_type: 'bearer', expires_in: 3600, expires_at: expires,
    user: { id, aud: 'authenticated', role: 'authenticated', is_anonymous: anonymous,
      email: anonymous ? '' : 'demo@example.test', email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: anonymous ? 'anonymous' : 'google', providers: [anonymous ? 'anonymous' : 'google'] },
      user_metadata: anonymous ? {} : { full_name: 'Demo Shopper' },
      identities: anonymous ? [] : [{ provider: 'google', user_id: id }], created_at: new Date().toISOString() },
  };
}

export async function shopFixture(page, { account = false, filled = false, loseFirstOrderResponse = false, failFirstOrder = false, guestQuantity, accountQuantity, loseFirstHandoffResponse = false, failExchange = false } = {}) {
  const sessions = { guest: sessionFor(true), account: sessionFor() };
  const carts = new Map();
  const empty = id => ({ id: `cart-${id}`, revision: 0, lines: [], subtotalKobo: 0 });
  carts.set(guestId, empty(guestId)); carts.set(accountId, empty(accountId));
  const state = { oauth: [], signups: 0, mutations: [], orders: [], checkoutRequests: [], handoffs: [], handoffOwners: [], exchanges: 0, guestUserReads: 0, failGuestUserRead: null };
  let redeemed;
  const transferRevisions = new Map();
  function putLine(cart, quantity) {
    cart.lines = quantity ? [{ variantId: product.product_variants[0].id, productName: product.name, variantLabel: 'Lavender', priceKobo: 14500000, quantity, active: true }] : [];
    cart.subtotalKobo = 14500000 * quantity; cart.revision++;
  }
  if (filled) putLine(carts.get(account ? accountId : guestId), 1);
  if (guestQuantity !== undefined) putLine(carts.get(guestId), guestQuantity);
  if (accountQuantity !== undefined) putLine(carts.get(accountId), accountQuantity);
  if (account || filled) await page.addInitScript(session => {
    if (!sessionStorage.getItem('fixture-session-installed')) {
      localStorage.setItem('luma-supabase-session', JSON.stringify(session));
      sessionStorage.setItem('fixture-session-installed', 'yes');
    }
  }, account ? sessions.account : sessions.guest);
  const json = (route, body, status = 200) => route.fulfill({ status, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify(body) });
  await page.route(/https:\/\/[^/]+\/(auth|rest|functions)\/v1\//, async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    const body = request.postDataJSON();
    const token = (request.headers().authorization ?? '').replace(/^Bearer /, '');
    let subject;
    try { subject = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub; } catch { /* Public catalog requests have no user token. */ }
    const identity = subject === accountId ? accountId : guestId;
    const cart = carts.get(identity);
    if (path.endsWith('/auth/v1/signup')) { state.signups++; return json(route, sessions.guest); }
    if (path.endsWith('/auth/v1/user')) {
      if (identity === guestId) {
        state.guestUserReads++;
        if (state.guestUserReads === state.failGuestUserRead) return json(route, { code: 'unexpected_failure', message: 'Guest session restoration temporarily unavailable.' }, 400);
      }
      return json(route, identity === accountId ? sessions.account.user : sessions.guest.user);
    }
    if (path.endsWith('/auth/v1/logout')) return json(route, {});
    if (path.endsWith('/auth/v1/token')) {
      state.exchanges++;
      if (failExchange) return json(route, { error: 'invalid_grant', error_description: 'The authorization code expired.' }, 400);
      return json(route, sessions.account);
    }
    if (path.endsWith('/auth/v1/authorize')) { state.oauth.push(url); return route.fulfill({ contentType: 'text/html', body: '<h1>Google OAuth fixture</h1>' }); }
    if (path.endsWith('/rest/v1/products')) return json(route, [product]);
    if (path.endsWith('/functions/v1/cart')) {
      if (request.method() === 'POST') {
        state.mutations.push(body);
        if (body.expectedRevision !== cart.revision) return json(route, { error: { code: 'CART_CONFLICT', message: 'Your bag changed. Please review it.' } }, 409);
        putLine(cart, body.quantity);
      }
      return json(route, cart);
    }
    if (path.endsWith('/functions/v1/cart-handoff')) {
      state.handoffs.push(body);
      state.handoffOwners.push(identity);
      if (body.action === 'prepare') {
        if (identity !== guestId) return json(route, { error: { code: 'VALIDATION_FAILED', message: 'Only the guest session can prepare its transfer.' } }, 403);
        const token = `fixture-handoff-token-${transferRevisions.size + 1}`;
        transferRevisions.set(token, carts.get(guestId).revision);
        return json(route, { token, expiresAt: new Date(Date.now() + 900000).toISOString() });
      }
      if (!redeemed) {
        const source = carts.get(guestId), destination = carts.get(accountId);
        if (source.revision !== transferRevisions.get(body.token)) return json(route, { error: { code: 'CART_CONFLICT', message: 'The source bag changed after sign-in started. Review and retry.' } }, 409);
        const quantity = (source.lines[0]?.quantity ?? 0) + (destination.lines[0]?.quantity ?? 0);
        if (quantity > 10) return json(route, { error: { code: 'MERGE_CONFLICT', message: 'The combined quantity exceeds 10. Both bags are saved.' } }, 409);
        putLine(destination, quantity); putLine(source, 0); redeemed = structuredClone(destination);
      }
      if (loseFirstHandoffResponse && state.handoffs.filter(item => item.action === 'redeem').length === 1) return route.abort('failed');
      return json(route, redeemed);
    }
    if (path.endsWith('/functions/v1/quote')) return json(route, { cartId: cart.id, cartRevision: cart.revision, fingerprint: `quote-${cart.revision}`, subtotalKobo: cart.subtotalKobo, deliveryKobo: 250000, totalKobo: cart.subtotalKobo + 250000, currency: 'NGN' });
    if (path.endsWith('/functions/v1/checkout')) {
      state.checkoutRequests.push(body);
      if (failFirstOrder && state.checkoutRequests.length === 1) return json(route, { error: { code: 'SERVICE_UNAVAILABLE', message: 'Connection interrupted. Please retry.' } }, 503);
      let order = state.orders.find(order => order.key === body.idempotencyKey);
      if (!order) {
        order = { id: '55555555-5555-4555-8555-555555555555', reference: 'LUMA-DEMO-001', key: body.idempotencyKey, createdAt: new Date().toISOString(), demo: true, status: 'confirmed', items: structuredClone(cart.lines), subtotalKobo: cart.subtotalKobo, deliveryKobo: 250000, totalKobo: cart.subtotalKobo + 250000, currency: 'NGN', emailStatus: 'pending' };
        state.orders.push(order); putLine(cart, 0);
      }
      if (loseFirstOrderResponse && state.checkoutRequests.length === 1) return route.abort('failed');
      return json(route, order);
    }
    if (path.endsWith('/functions/v1/orders')) {
      if (url.searchParams.has('requestKey')) {
        const order = state.orders.find(item => item.key === url.searchParams.get('requestKey'));
        return order ? json(route, order) : json(route, { error: { code: 'ORDER_NOT_FOUND', message: 'No saved order exists for this request.' } }, 404);
      }
      return json(route, url.searchParams.has('id') ? state.orders[0] : state.orders);
    }
    return json(route, { error: { message: `Unmocked endpoint: ${path}` } }, 500);
  });
  return { state, carts, guestId, accountId };
}

export async function fillCheckout(page) {
  await page.getByLabel('Recipient name', { exact: true }).fill('Example Shopper');
  await page.getByLabel('City', { exact: true }).fill('Demo City');
  await page.getByLabel('Fictional address', { exact: true }).fill('12 Example Street');
  await page.getByLabel('I understand this is a demo order with no payment or shipment.').check();
}
