import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Luma follows Donewell and keeps saved tasks intact', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.getByRole('heading', { name: 'Luma.', exact: true })).toBeVisible();
  expect(await page.locator('.project-heading h2').allTextContents()).toEqual(['Donewell.', 'Luma.']);
  await page.locator('#task-title').fill('Keep my local task');
  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByRole('link', { name: 'Open full shop' }).click();
  await page.goto('/projects/');
  await expect(page.locator('.task-list')).toContainText('Keep my local task');
});

for (const route of ['', 'product/?slug=missing', 'cart/', 'checkout/', 'confirmation/?order=missing', 'account/', 'auth/callback/']) {
  test(`shop route loads directly: ${route || 'catalog'}`, async ({ page }) => {
    await page.goto(`/projects/shop/${route}`);
    await expect(page.getByRole('link', { name: 'Luma shop home' })).toBeVisible();
    await expect(page.getByText('Portfolio demo — no payment or shipment.', { exact: true }).first()).toBeVisible();
    await expect(page.locator('[data-shop-content]')).not.toBeEmpty();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}

test('unconfigured shop explains availability without prompting guest authentication', async ({ page }) => {
  await page.goto('/projects/shop/');
  await expect(page.getByRole('heading', { name: 'Good tech. Great energy.' })).toBeVisible();
  await expect(page.getByText('The shop is not connected yet.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const results = await new AxeBuilder({ page }).include('.luma').analyze();
  expect(results.violations).toEqual([]);
});
