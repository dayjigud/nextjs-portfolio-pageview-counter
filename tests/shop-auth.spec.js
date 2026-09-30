import { test, expect } from '@playwright/test';
import { shopFixture, sessionFor } from './helpers/shop-fixture.js';

test('browsing does not create an anonymous account or start Google OAuth', async ({ page }) => {
  const { state } = await shopFixture(page);
  await page.goto('/projects/shop/');
  await expect(page.getByRole('button', { name: 'Add Halo Headphones to bag' })).toBeVisible();
  expect(state.signups).toBe(0);
  expect(state.oauth).toHaveLength(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('guests add view edit reload and remove a persisted bag without Google', async ({ page }) => {
  const { state } = await shopFixture(page);
  await page.goto('/projects/shop/');
  await page.getByRole('button', { name: 'Add Halo Headphones to bag' }).click();
  await expect(page.getByRole('link', { name: /Bag/ })).toHaveText('Bag 1');
  await page.getByRole('link', { name: /Bag/ }).click();
  await expect(page.getByRole('heading', { name: 'Halo Headphones', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Quantity', exact: true }).selectOption('3');
  await expect(page.getByRole('link', { name: /Bag/ })).toHaveText('Bag 3');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('3');
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('Your bag is empty.', { exact: false })).toBeVisible();
  expect(state.signups).toBe(1);
  expect(state.mutations.map(mutation => mutation.quantity)).toEqual([1, 3, 0]);
  expect(state.oauth).toHaveLength(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('checkout prompts Google only after an explicit checkout click and cancellation preserves bag', async ({ page }) => {
  const { state } = await shopFixture(page, { filled: true });
  await page.goto('/projects/shop/cart/');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One last step.' })).toBeVisible();
  expect(state.oauth).toHaveLength(0);
  await page.getByRole('button', { name: 'Close sign-in' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('1');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  await waitForGoogleNavigation(page, state);
  expect(state.oauth[0].searchParams.get('provider')).toBe('google');
  expect(state.handoffs).toEqual([{ action: 'prepare' }]);
});

test('signout hides account orders and starts with an empty guest bag', async ({ page }) => {
  const { state } = await shopFixture(page, { account: true, filled: true });
  state.orders.push({ id: 'account-private-order', reference: 'PRIVATE-ACCOUNT-ORDER', totalKobo: 14750000, createdAt: new Date().toISOString() });
  await page.goto('/projects/shop/account/');
  await expect(page.getByText('PRIVATE-ACCOUNT-ORDER', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/shop\/$/);
  await expect(page.getByRole('link', { name: /Bag/ })).toHaveText('Bag 0');
  await page.goto('/projects/shop/account/');
  await expect(page.getByText('PRIVATE-ACCOUNT-ORDER', { exact: true })).toHaveCount(0);
  await expect(page.getByText('demo@example.test', { exact: true })).toHaveCount(0);
  await page.goto('/projects/shop/cart/');
  await expect(page.getByText('Your bag is empty.', { exact: false })).toBeVisible();
  expect(state.signups).toBe(0);
});

async function beginGuestCheckout(page, state) {
  await page.goto('/projects/shop/cart/');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  await waitForGoogleNavigation(page, state);
}

async function waitForGoogleNavigation(page, state) {
  // Seeing the intercepted request alone does not mean Chromium committed the
  // redirect. Wait for its URL and rendered document before simulating callback.
  await expect.poll(() => state.oauth.length).toBe(1);
  await page.waitForURL(/\/auth\/v1\/authorize\?/, { waitUntil: 'load' });
  await expect(page.getByRole('heading', { name: 'Google OAuth fixture', exact: true })).toBeVisible();
}

test('Google callback transfers guest bag into an existing account without placing an order', async ({ page }) => {
  const { state, carts, guestId, accountId } = await shopFixture(page, { filled: true, accountQuantity: 2 });
  await beginGuestCheckout(page, state);
  await page.goto('/projects/shop/auth/callback/?code=fixture-code&next=%2Fprojects%2Fshop%2Fcheckout%2F');
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  await expect(page.getByText('demo@example.test', { exact: true })).toBeVisible();
  expect(carts.get(accountId).lines[0].quantity).toBe(3);
  expect(carts.get(guestId).lines).toHaveLength(0);
  expect(state.checkoutRequests).toHaveLength(0);
  expect(await page.evaluate(() => sessionStorage.getItem('luma-auth-handoff-v1'))).toBeNull();
});

test('oversized merge preserves both bags and allows an explicit revised merge', async ({ page }) => {
  const { state, carts, guestId, accountId } = await shopFixture(page, { filled: true, guestQuantity: 6, accountQuantity: 6 });
  await beginGuestCheckout(page, state);
  await page.goto('/projects/shop/auth/callback/?code=fixture-code');
  await expect(page.getByRole('heading', { name: 'A little bag review.' })).toBeVisible();
  expect(carts.get(guestId).lines[0].quantity).toBe(6);
  expect(carts.get(accountId).lines[0].quantity).toBe(6);
  const quantity = page.getByRole('spinbutton', { name: 'Guest quantity' });
  await quantity.fill('4');
  await quantity.blur();
  await expect.poll(() => carts.get(guestId).lines[0].quantity).toBe(4);
  await expect(page.getByRole('button', { name: 'Combine bags and continue' })).toBeEnabled();
  expect(carts.get(accountId).lines[0].quantity).toBe(6);
  await page.getByRole('button', { name: 'Combine bags and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  expect(carts.get(accountId).lines[0].quantity).toBe(10);
  expect(carts.get(guestId).lines).toHaveLength(0);
  expect(state.checkoutRequests).toHaveLength(0);
});

test('callback reload replays a pending transfer without reusing the Google code or double merging', async ({ page }) => {
  const { state, carts, accountId } = await shopFixture(page, { filled: true, accountQuantity: 2, loseFirstHandoffResponse: true });
  await beginGuestCheckout(page, state);
  await page.goto('/projects/shop/auth/callback/?code=fixture-code');
  await expect(page.getByRole('heading', { name: 'A little pause.' })).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback\/$/);
  expect(carts.get(accountId).lines[0].quantity).toBe(3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  expect(carts.get(accountId).lines[0].quantity).toBe(3);
  expect(state.exchanges).toBe(1);
  expect(state.handoffs.filter(item => item.action === 'redeem')).toHaveLength(2);
});

test('failed Google exchange restores the original guest session and saved bag', async ({ page }) => {
  const { state } = await shopFixture(page, { filled: true, failExchange: true });
  await beginGuestCheckout(page, state);
  await page.goto('/projects/shop/auth/callback/?code=expired-code');
  await expect(page.getByRole('heading', { name: 'A little pause.' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to your bag' }).click();
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('luma-auth-handoff-v1'))).toBeNull();
  expect(state.handoffs.filter(item => item.action === 'redeem')).toHaveLength(0);
});

test('expired OAuth handoff restores the guest bag and explicitly asks for sign-in retry', async ({ page }) => {
  const { state, carts, guestId, accountId } = await shopFixture(page, { filled: true });
  await beginGuestCheckout(page, state);
  await page.clock.setFixedTime(new Date(Date.now() + 16 * 60 * 1000));
  await page.goto('/projects/shop/auth/callback/?code=late-code');
  await expect(page.locator('[data-shop-notice]')).toContainText(/expired/i);
  await expect(page.locator('[data-shop-notice]')).toContainText(/try again|retry|sign-in again/i);
  await page.getByRole('link', { name: 'Back to your bag' }).click();
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  expect(carts.get(guestId).lines[0].quantity).toBe(1);
  expect(carts.get(accountId).lines).toHaveLength(0);
  expect(await page.evaluate(() => sessionStorage.getItem('luma-auth-handoff-v1'))).toBeNull();
});

test('signed-out receipt Google sign-in returns to the original private receipt', async ({ page }) => {
  const { state } = await shopFixture(page);
  const id = '55555555-5555-4555-8555-555555555555';
  state.orders.push({ id, reference: 'LUMA-PRIVATE-RECEIPT', createdAt: new Date().toISOString(), items: [], subtotalKobo: 14500000, deliveryKobo: 250000, totalKobo: 14750000, currency: 'NGN', emailStatus: 'pending' });
  const path = `/projects/shop/confirmation/?order=${id}`;
  await page.goto(path);
  await expect(page.getByRole('heading', { name: 'Your receipt is private.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click();
  await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  await waitForGoogleNavigation(page, state);
  const callback = new URL(state.oauth[0].searchParams.get('redirect_to'));
  expect(callback.searchParams.get('next')).toBe(path);
  callback.searchParams.set('code', 'receipt-code');
  await page.goto(callback.href);
  await expect(page).toHaveURL(new RegExp(`/confirmation/\\?order=${id}$`));
  await expect(page.getByText('LUMA-PRIVATE-RECEIPT', { exact: true })).toBeVisible();
  expect(state.checkoutRequests).toHaveLength(0);
});

test('stale guest revision is reviewed and explicitly re-prepared with the guest session', async ({ page }) => {
  const { state, carts, guestId, accountId } = await shopFixture(page, { filled: true, accountQuantity: 2 });
  await beginGuestCheckout(page, state);
  // Another browser tab changed the source after the OAuth handoff was prepared.
  carts.get(guestId).revision++;
  await page.goto('/projects/shop/auth/callback/?code=stale-source-code');
  await expect(page.getByRole('heading', { name: 'A little bag review.' })).toBeVisible();
  expect(carts.get(guestId).lines[0].quantity).toBe(1);
  expect(carts.get(accountId).lines[0].quantity).toBe(2);
  await page.getByRole('button', { name: 'Combine bags and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible();
  expect(state.handoffs.map(item => item.action)).toEqual(['prepare', 'redeem', 'prepare', 'redeem']);
  expect(state.handoffOwners).toEqual([guestId, accountId, guestId, accountId]);
  expect(state.handoffs[3].token).not.toBe(state.handoffs[1].token);
  expect(carts.get(accountId).lines[0].quantity).toBe(3);
  expect(carts.get(guestId).lines).toHaveLength(0);
});

test('an expired transfer retains guest recovery if restoration fails and restores on reload', async ({ page }) => {
  const { state } = await shopFixture(page, { filled: true });
  await beginGuestCheckout(page, state);
  // Model returning with a permanent session while the original guest session
  // is held only in the recovery record. The first restoration is rejected.
  await page.goto('/projects/shop/');
  await page.evaluate(session => localStorage.setItem('luma-supabase-session', JSON.stringify(session)), sessionFor());
  state.failGuestUserRead = state.guestUserReads + 1;
  await page.clock.setFixedTime(new Date(Date.now() + 16 * 60 * 1000));
  await page.goto('/projects/shop/auth/callback/?code=late-code');
  await expect(page.locator('[data-shop-notice]')).toContainText('guest sign-in could not be restored');
  const recovery = await page.evaluate(() => JSON.parse(sessionStorage.getItem('luma-auth-handoff-v1')));
  expect(recovery?.guestSession?.user?.is_anonymous).toBe(true);
  await page.reload();
  await expect(page.locator('[data-shop-notice]')).toContainText('Your guest bag is restored.');
  expect(await page.evaluate(() => sessionStorage.getItem('luma-auth-handoff-v1'))).toBeNull();
  await page.getByRole('link', { name: 'Back to your bag' }).click();
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
});

for (const account of [false, true]) {
  test(`${account ? 'account' : 'guest'} add updates the badge immediately without redundant cart or auth reads`, async ({ page }) => {
    await shopFixture(page, { account, filled: true });
    await page.goto('/projects/shop/');
    await expect(page.locator('[data-cart-count]')).toHaveText('1');
    const requests = [];
    page.on('request', request => {
      if (/\/(functions\/v1\/cart|auth\/v1\/user)$/.test(new URL(request.url()).pathname)) requests.push(request.method() + ' ' + new URL(request.url()).pathname);
    });
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route('**/functions/v1/cart', async route => {
      if (route.request().method() === 'POST') await held;
      await route.fallback();
    });
    const add = page.getByRole('button', { name: 'Add Halo Headphones to bag' });
    await add.click();
    try {
      await expect(page.locator('[data-cart-count]')).toHaveText('2', { timeout: 1000 });
      await expect(page.locator('[data-shop-notice]')).toContainText('Saving');
    } finally { release(); }
    await expect(page.locator('[data-shop-notice]')).toContainText('Added to your bag');
    expect(requests).toEqual(['POST /functions/v1/cart']);
    await add.click();
    await expect(page.locator('[data-shop-notice]')).toContainText('Added to your bag');
    await expect(add).toBeEnabled();
    await page.reload();
    await expect(page.locator('[data-cart-count]')).toHaveText('3');
  });
}

test('a rejected add reconciles the immediate badge and allows retry', async ({ page }) => {
  await shopFixture(page, { account: true, filled: true });
  await page.goto('/projects/shop/');
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
  await page.route('**/functions/v1/cart', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: { code: 'CART_CONFLICT', message: 'Your bag changed. Please retry.' } }) });
  });
  const add = page.getByRole('button', { name: 'Add Halo Headphones to bag' });
  await add.click();
  await expect(page.locator('[data-shop-notice]')).toContainText('Your bag changed');
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
  await expect(add).toBeEnabled();
});

test('queued adds preserve quantities and opening the bag waits for saving', async ({ page }) => {
  const { state } = await shopFixture(page, { filled: true });
  await page.goto('/projects/shop/');
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/functions/v1/cart', async route => {
    if (route.request().method() === 'POST') await held;
    await route.fallback();
  });
  await page.getByRole('button', { name: 'Add Halo Headphones to bag' }).click();
  // Filtering replaces the card while its original add is still in flight.
  await page.getByRole('button', { name: 'Audio', exact: true }).click();
  await page.getByRole('button', { name: 'Add Halo Headphones to bag' }).click();
  await expect(page.locator('[data-cart-count]')).toHaveText('3');
  await page.getByRole('link', { name: /Bag/ }).click();
  await expect(page).toHaveURL(/\/shop\/$/);
  release();
  await expect(page).toHaveURL(/\/cart\/$/);
  await expect(page.getByRole('combobox', { name: 'Quantity', exact: true })).toHaveValue('3');
  expect(state.mutations.map(input => [input.quantity, input.expectedRevision])).toEqual([[2, 1], [3, 2]]);
});

test('product quantity gets immediate feedback and a lost add response is reconciled without replay', async ({ page }) => {
  const { state, carts, guestId } = await shopFixture(page, { filled: true });
  await page.goto('/projects/shop/product/?slug=halo-headphones');
  await expect(page.locator('[data-cart-count]')).toHaveText('1');
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/functions/v1/cart', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    await held;
    const body = route.request().postDataJSON();
    state.mutations.push(body);
    const cart = carts.get(guestId);
    cart.lines[0].quantity = body.quantity;
    cart.revision++;
    cart.subtotalKobo = cart.lines[0].priceKobo * body.quantity;
    await route.abort('failed');
  });
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('3');
  const add = page.getByRole('button', { name: /Add to bag/ });
  await add.click();
  await expect(page.locator('[data-cart-count]')).toHaveText('4');
  release();
  await expect(add).toBeEnabled();
  await expect(page.locator('[data-cart-count]')).toHaveText('4');
  expect(state.mutations).toHaveLength(1);
  await page.reload();
  await expect(page.locator('[data-cart-count]')).toHaveText('4');
});
