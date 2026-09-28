import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('loads cleanly with valid navigation targets and local images', async ({ page }) => {
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith('http://127.0.0.1:4173')) failedRequests.push(request.url());
  });

  await page.goto('/');

  const targetIds = await page.locator('nav a[href^="#"]').evaluateAll((links) =>
    [...new Set(links.map((link) => link.hash.slice(1)))],
  );
  for (const id of targetIds) {
    await expect(page.locator(`#${id}`), `Missing target for #${id}`).toHaveCount(1);
  }

  const imageResults = await page.locator('img').evaluateAll(async (images) =>
    Promise.all(images.map(async (image) => ({
      src: image.getAttribute('src'),
      ok: (await fetch(image.currentSrc)).ok,
    }))),
  );
  expect(imageResults.filter(({ ok }) => !ok)).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('skip link targets the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('project disclosures support keyboard interaction', async ({ page }) => {
  await page.goto('/');
  const project = page.locator('details.project').first();
  const summary = project.locator('summary');

  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(project).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(project).not.toHaveAttribute('open', '');
});

test('reduced motion leaves content visible and animations disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('.reveal').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.marquee-track')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.stat-num > span').first()).toBeVisible();
});

test('has no serious or critical accessibility violations', async ({ page }, testInfo) => {
  await page.goto('/');

  if (testInfo.project.name.startsWith('mobile')) {
    await page.locator('.nav-toggle').click();
    await expect(page.locator('#mobile-navigation')).toBeVisible();
  }

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const seriousViolations = results.violations.filter(({ impact }) =>
    impact === 'serious' || impact === 'critical',
  );

  expect(seriousViolations).toEqual([]);
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile viewport only');

  test('closes after navigation, on Escape, and at the desktop breakpoint', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('#nav-toggle');
    const panel = page.locator('#mobile-navigation');

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await panel.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/#about$/);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

    await button.click();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    await button.click();
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('private projects page', () => {
  test('supports a persistent task workflow without linking from the portfolio', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/projects"]')).toHaveCount(0);

    await page.goto('/projects/');
    await expect(page.getByRole('heading', { name: 'Donewell.' })).toBeVisible();
    await page.getByPlaceholder('What needs doing?').fill('Ship a thoughtful side project');
    await page.getByRole('button', { name: /Add task/ }).click();
    const task = page.locator('.task-row').filter({ hasText: 'Ship a thoughtful side project' });
    await expect(task).toBeVisible();
    await task.getByRole('button', { name: /Mark .* complete/ }).click();
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(task).toHaveClass(/done/);

    await page.reload();
    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page.locator('.task-row').filter({ hasText: 'Ship a thoughtful side project' })).toBeVisible();
  });
});
