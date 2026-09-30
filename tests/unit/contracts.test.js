import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, escapeHtml, safeReturnPath } from '../../src/shop/contracts.js';
test('formats kobo as naira and rejects unsafe amounts', () => {
  assert.match(formatMoney(14750000), /147,500/);
  assert.throws(() => formatMoney(-1));
  assert.throws(() => formatMoney(Number.MAX_SAFE_INTEGER + 1));
});
test('escapes product and customer input', () => {
  assert.equal(escapeHtml('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
});
test('OAuth return route cannot leave shop or accept protocol-relative URL', () => {
  assert.equal(safeReturnPath('https://evil.example'), '/projects/shop/cart/');
  assert.equal(safeReturnPath('//evil.example'), '/projects/shop/cart/');
  assert.equal(safeReturnPath('/projects/shop/checkout/'), '/projects/shop/checkout/');
  assert.equal(safeReturnPath('/projects/shop/../account/'), '/projects/shop/cart/');
  assert.equal(safeReturnPath('/projects/shop/confirmation/?order=11111111-1111-4111-8111-111111111111'), '/projects/shop/confirmation/?order=11111111-1111-4111-8111-111111111111');
  assert.equal(safeReturnPath('/projects/shop/confirmation/?order=x&next=https://evil.example'), '/projects/shop/cart/');
});
