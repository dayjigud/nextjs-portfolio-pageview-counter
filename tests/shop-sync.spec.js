import {test,expect} from '@playwright/test';
import {shopFixture,fillCheckout} from './helpers/shop-fixture.js';
test('remote cart event refreshes bag without a page reload',async({page})=>{
 const fixture=await shopFixture(page,{account:true,filled:true});await page.goto('/projects/shop/cart/');await expect(page.locator('[data-quantity]')).toHaveValue('1');await expect.poll(()=>fixture.sockets.length).toBeGreaterThan(0);fixture.remoteCart(2);await expect(page.locator('[data-quantity]')).toHaveValue('2');await expect(page.locator('[data-cart-count]').first()).toHaveText('2');
});
test('remote edit preserves checkout draft and focus until quote review',async({page})=>{
 const fixture=await shopFixture(page,{account:true,filled:true});await page.goto('/projects/shop/checkout/');await fillCheckout(page);const city=page.getByLabel('City',{exact:true});await city.focus();await expect.poll(()=>fixture.sockets.length).toBeGreaterThan(0);fixture.remoteCart(2);await expect(page.getByRole('button',{name:'Review updated total'})).toBeVisible();await expect(city).toHaveValue('Demo City');await expect(city).toBeFocused();await expect(page.getByRole('button',{name:'Place demo order'})).toBeDisabled();await page.getByRole('button',{name:'Review updated total'}).click();await expect(city).toHaveValue('Demo City');await expect(page.getByRole('button',{name:'Place demo order'})).toBeEnabled();expect(fixture.state.checkoutRequests).toHaveLength(0);
});
test('focus catches missed remote cart state',async({page})=>{
 const fixture=await shopFixture(page,{account:true,filled:true});await page.goto('/projects/shop/cart/');await expect(page.locator('[data-quantity]')).toHaveValue('1');const cart=fixture.carts.get(fixture.accountId);cart.lines[0].quantity=3;cart.subtotalKobo=43500000;cart.revision++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-quantity]')).toHaveValue('3');
});
