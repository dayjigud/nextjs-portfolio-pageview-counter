import { test, expect } from '@playwright/test';
import { shopFixture, fillCheckout } from './helpers/shop-fixture.js';

test('permanent account checks out without OAuth and sees authoritative demo receipt', async ({ page }) => {
  const { state } = await shopFixture(page, { account: true, filled: true });
  await page.goto('/projects/shop/cart/');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/projects\/shop\/checkout\/$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('demo@example.test', { exact: true })).toBeVisible();
  await expect(page.locator('input[autocomplete="cc-number"],input[name*=card]')).toHaveCount(0);
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.getByRole('heading', { name: /Good things,\s*all wrapped up/ })).toBeVisible();
  await expect(page.getByText('LUMA-DEMO-001', { exact: true })).toBeVisible();
  await expect(page.getByText('No payment was collected. No shipment will occur.')).toBeVisible();
  expect(state.oauth).toHaveLength(0);
  expect(state.checkoutRequests).toHaveLength(1);
  expect(state.checkoutRequests[0].delivery).toEqual({ recipientName: 'Example Shopper', city: 'Demo City', address: '12 Example Street' });
  expect(state.checkoutRequests[0]).not.toHaveProperty('email');
  expect(state.checkoutRequests[0]).not.toHaveProperty('totalKobo');
  await page.reload();
  await expect(page.getByText('LUMA-DEMO-001', { exact: true })).toBeVisible();
});

test('lost response after committed order retries the same idempotency key', async ({ page }) => {
  const { state } = await shopFixture(page, { account: true, filled: true, loseFirstOrderResponse: true });
  await page.goto('/projects/shop/checkout/');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.locator('[data-shop-notice]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place demo order' })).toBeEnabled();
  expect(state.orders).toHaveLength(1);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.getByText('LUMA-DEMO-001', { exact: true })).toBeVisible();
  expect(state.checkoutRequests).toHaveLength(2);
  expect(state.checkoutRequests[1].idempotencyKey).toBe(state.checkoutRequests[0].idempotencyKey);
  expect(state.orders).toHaveLength(1);
});

test('retry after reload preserves the checkout key rather than starting another order', async ({ page }) => {
  const { state } = await shopFixture(page, { account: true, filled: true, failFirstOrder: true });
  await page.goto('/projects/shop/checkout/');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.getByText('Connection interrupted. Please retry.')).toBeVisible();
  await page.reload();
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.getByText('LUMA-DEMO-001', { exact: true })).toBeVisible();
  expect(state.checkoutRequests[1].idempotencyKey).toBe(state.checkoutRequests[0].idempotencyKey);
});

test('a committed order with a lost response is recoverable after reload', async ({ page }) => {
  const { state } = await shopFixture(page, { account: true, filled: true, loseFirstOrderResponse: true });
  await page.goto('/projects/shop/checkout/');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await expect(page.locator('[data-shop-notice]')).toBeVisible();
  expect(state.orders).toHaveLength(1);
  await page.reload();
  // Recovery looks up the original request despite the server clearing the
  // cart during the committed transaction; it must not create another order.
  await expect(page.getByText('LUMA-DEMO-001', { exact: true })).toBeVisible();
  expect(state.checkoutRequests).toHaveLength(1);
  expect(state.orders).toHaveLength(1);
});
