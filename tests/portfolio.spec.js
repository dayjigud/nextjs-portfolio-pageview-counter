import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function chooseDueDate(scope, value) {
  const field = scope.locator('.date-field');
  await field.getByRole('button', { name: 'Choose due date' }).click();
  await field.getByRole('combobox', { name: 'Year' }).selectOption(value.slice(0, 4));
  await field.getByRole('combobox', { name: 'Month' }).selectOption(String(Number(value.slice(5, 7)) - 1));
  await field.locator(`.date-day[data-date="${value}"]`).click();
  await expect(field.locator('input[name="due"]')).toHaveValue(value);
}

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
  test('starts empty, loads samples into every view, and returns to empty', async ({ page }) => {
    await page.goto('/projects/');
    await expect(page.locator('.task-row')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
    await page.getByRole('button', { name: 'Load sample data' }).click();
    await expect(page.locator('.task-row')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const filter of ['today', 'overdue', 'upcoming', 'completed']) {
      await page.locator(`.filter[data-filter="${filter}"]`).click();
      await expect(page.locator('.task-row').first()).toBeVisible();
    }
    await page.getByRole('button', { name: 'Clear sample data' }).click();
    await expect(page.locator('.task-row')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
    await page.reload();
    await expect(page.locator('.task-row')).toHaveCount(0);
    await page.getByRole('button', { name: 'Load sample data' }).click();
    await page.reload();
    await expect(page.locator('.task-row')).toHaveCount(0);
  });

  test('preserves saved tasks while sample data is explored and changed', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByPlaceholder('What needs doing?').fill('My saved task');
    await page.getByRole('button', { name: /Add task/ }).click();
    const stored = await page.evaluate(() => localStorage.getItem('donewell-tasks-v1'));
    await page.getByRole('button', { name: 'Load sample data' }).click();
    await page.getByRole('button', { name: 'Delete Plan the week with intention' }).click();
    await page.getByRole('button', { name: 'Back to my tasks' }).click();
    await expect(page.locator('.task-row')).toHaveCount(1);
    await expect(page.locator('.task-row')).toContainText('My saved task');
    await expect(page.getByRole('button', { name: 'Undo' })).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('donewell-tasks-v1'))).toBe(stored);
    await page.reload();
    await expect(page.locator('.task-row')).toContainText('My saved task');
  });

  test('keeps the mobile calendar below its field and clear of other controls', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile viewport only');
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/projects/');
    await page.getByRole('button', { name: 'Load sample data' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const checkLayout = async (field, priority, container) => {
      await field.getByRole('button', { name: 'Choose due date' }).click();
      const pickerBox = await field.locator('.date-picker').boundingBox();
      const priorityBox = await priority.boundingBox();
      const containerBox = await container.boundingBox();
      const monthBox = await field.locator('.calendar-month').boundingBox();
      expect(pickerBox.x).toBeGreaterThanOrEqual(containerBox.x - 1);
      expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 1);
      expect(pickerBox.y + pickerBox.height).toBeLessThanOrEqual(priorityBox.y + 1);
      expect(monthBox.width).toBeGreaterThanOrEqual(80);
      await page.keyboard.press('Escape');
    };

    await checkLayout(page.locator('.task-form .date-field'), page.locator('.task-options > label'), page.locator('.task-form'));
    await page.locator('.task-row').first().getByRole('button', { name: /^Edit/ }).click();
    const editor = page.locator('.task-edit-form');
    await checkLayout(editor.locator('.date-field'), editor.getByLabel('Priority'), editor);
  });

  test('chooses and clears dates with the calendar, and requires one for repeating tasks', async ({ page }) => {
    await page.goto('/projects/');
    const field = page.locator('.task-form .date-field');
    const trigger = field.getByRole('button', { name: 'Choose due date' });
    const today = await page.evaluate(() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    await trigger.click();
    await expect(field.getByRole('dialog', { name: 'Choose due date' })).toBeVisible();
    await field.getByRole('button', { name: 'Today', exact: true }).click();
    await expect(field.locator('input[name="due"]')).toHaveValue(today);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(field.getByRole('dialog', { name: 'Choose due date' })).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    const tomorrow = await page.evaluate(() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    await field.locator(`.date-day[data-date="${today}"]`).press('ArrowRight');
    await expect(field.locator(`.date-day[data-date="${tomorrow}"]`)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(field.locator('input[name="due"]')).toHaveValue(tomorrow);
    await trigger.click();
    await field.getByRole('button', { name: 'Clear' }).click();
    await expect(field.locator('input[name="due"]')).toHaveValue('');

    await page.getByPlaceholder('What needs doing?').fill('Repeat with a date');
    await page.locator('.task-more summary').click();
    await page.locator('.task-form select[name="repeat"]').selectOption('weekly');
    await page.getByRole('button', { name: /Add task/ }).click();
    await expect(page.locator('.task-row').filter({ hasText: 'Repeat with a date' })).toHaveCount(0);
    await expect(field.getByRole('dialog', { name: 'Choose due date' })).toBeVisible();
  });

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
    await page.locator('.filter[data-filter="completed"]').click();
    await expect(task).toHaveClass(/done/);

    await page.reload();
    await page.locator('.filter[data-filter="completed"]').click();
    await expect(page.locator('.task-row').filter({ hasText: 'Ship a thoughtful side project' })).toBeVisible();
  });

  test('edits task details, cancels changes, and keeps saved edits after reload', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByPlaceholder('What needs doing?').fill('Plan the week with intention');
    await page.getByRole('button', { name: /Add task/ }).click();
    const task = page.locator('.task-row').filter({ hasText: 'Plan the week with intention' });
    await task.getByRole('button', { name: 'Edit Plan the week with intention' }).click();
    const editor = page.getByRole('form', { name: 'Edit Plan the week with intention' });
    await editor.getByRole('textbox', { name: 'Task title' }).fill('Plan the month');
    await editor.getByRole('button', { name: 'Cancel' }).click();
    await expect(task).toContainText('Plan the week with intention');

    await task.getByRole('button', { name: 'Edit Plan the week with intention' }).click();
    await editor.getByRole('textbox', { name: 'Task title' }).fill('Plan the month');
    await chooseDueDate(editor, '2026-10-15');
    await editor.getByLabel('Priority').selectOption('low');
    await editor.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.task-row').filter({ hasText: 'Plan the month' })).toContainText('low');

    await page.reload();
    const saved = page.locator('.task-row').filter({ hasText: 'Plan the month' });
    await expect(saved).toBeVisible();
    await saved.getByRole('button', { name: 'Edit Plan the month' }).click();
    await expect(page.getByRole('form', { name: 'Edit Plan the month' }).locator('input[name="due"]')).toHaveValue('2026-10-15');
    await expect(page.getByRole('form', { name: 'Edit Plan the month' }).getByLabel('Priority')).toHaveValue('low');
  });

  test('moves a completed repeating task forward and keeps a completed occurrence', async ({ page }) => {
    await page.goto('/projects/');
    const yesterday = await page.evaluate(() => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    await page.getByPlaceholder('What needs doing?').fill('Daily review');
    await chooseDueDate(page.locator('.task-form'), yesterday);
    await page.locator('.task-more summary').click();
    await page.locator('.task-form select[name="repeat"]').selectOption('daily');
    await page.getByRole('button', { name: /Add task/ }).click();
    await page.locator('.filter[data-filter="overdue"]').click();
    const overdue = page.locator('.task-row').filter({ hasText: 'Daily review' });
    await expect(overdue).toBeVisible();
    await overdue.getByRole('button', { name: 'Mark Daily review complete' }).click();
    await expect(overdue).toHaveCount(0);

    await page.locator('.filter[data-filter="all"]').click();
    const next = page.locator('.task-row').filter({ hasText: 'Daily review' });
    await next.getByRole('button', { name: 'Edit Daily review' }).click();
    const nextDue = await page.getByRole('form', { name: 'Edit Daily review' }).locator('input[name="due"]').inputValue();
    expect(nextDue > yesterday).toBe(true);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.locator('.filter[data-filter="completed"]').click();
    await expect(page.locator('.task-row').filter({ hasText: 'Daily review' })).toBeVisible();
  });

  test('searches notes, filters labels, and sorts matching tasks by due date', async ({ page }) => {
    await page.goto('/projects/');
    await page.locator('.task-more summary').click();
    for (const [title, due, notes] of [
      ['Later report', '2026-11-20', 'Prepare numbers'],
      ['Earlier report', '2026-11-10', 'Review numbers'],
    ]) {
      await page.getByPlaceholder('What needs doing?').fill(title);
      await chooseDueDate(page.locator('.task-form'), due);
      await page.locator('.task-form input[name="tag"]').fill('Work');
      await page.locator('.task-form textarea[name="notes"]').fill(notes);
      await page.getByRole('button', { name: /Add task/ }).click();
    }
    await page.locator('.tag-filter').selectOption('Work');
    await page.locator('.task-sort').selectOption('due');
    await expect(page.locator('.task-row').first()).toContainText('Earlier report');
    await page.getByPlaceholder('Search tasks…').fill('Prepare numbers');
    await expect(page.locator('.task-row')).toHaveCount(1);
    await expect(page.locator('.task-row')).toContainText('Later report');
  });

  test('undoes deletion and restores a downloaded backup', async ({ page }) => {
    await page.goto('/projects/');
    await page.getByPlaceholder('What needs doing?').fill('Keep this task');
    await page.getByRole('button', { name: /Add task/ }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export backup' }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    const backup = JSON.parse(await readFile(backupPath, 'utf8'));
    expect(backup.tasks.some((task) => task.title === 'Keep this task')).toBe(true);

    const task = page.locator('.task-row').filter({ hasText: 'Keep this task' });
    await task.getByRole('button', { name: 'Delete Keep this task' }).click();
    await expect(task).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(task).toBeVisible();

    await page.getByPlaceholder('What needs doing?').fill('Temporary task');
    await page.getByRole('button', { name: /Add task/ }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.import-file').setInputFiles(backupPath);
    await expect(page.locator('.task-row').filter({ hasText: 'Temporary task' })).toHaveCount(0);
    await expect(task).toBeVisible();
  });
});

test.describe('portfolio product showcase', () => {
  test('featured case links open the matching disclosure, including direct URLs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (const slug of ['waybl', 'ara', 'safetrip']) {
      await page.locator(`.feature-${slug} .feature-actions a`).click();
      await expect(page.locator(`#case-${slug}`)).toHaveAttribute('open', '');
      await expect(page.locator(`#case-${slug} .case-visual`)).toBeVisible();
    }
    await page.goto('/#case-ara');
    await expect(page.locator('#case-ara')).toHaveAttribute('open', '');
  });

  test('walkthroughs support manual steps, replay, Escape and focus return', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const dialog = page.getByRole('dialog');
    for (const slug of ['waybl', 'ara', 'safetrip']) {
      const opener = page.locator(`[data-demo="${slug}"]`);
      await opener.click();
      await expect(dialog).toBeVisible();
      await expect(page.locator('#demo-count')).toContainText('Step 1');
      await expect(page.locator('#demo-play')).toHaveText('Play');
      await expect(page.locator('#demo-previous')).toBeDisabled();
      const buttons = dialog.locator('.demo-step-list button');
      const count = await buttons.count();
      for (let i = 1; i < count; i += 1) await page.getByRole('button', { name: 'Next →', exact: true }).click();
      await expect(page.locator('#demo-next')).toBeDisabled();
      await expect(page.locator('#demo-play')).toHaveText('Replay');
      await page.locator('#demo-play').click();
      await expect(page.locator('#demo-count')).toContainText('Step 1');
      await page.locator('#demo-play').click();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    }
  });

  test('autoplay can be paused and reduced motion stops it', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-demo="waybl"]').click();
    await expect(page.locator('#demo-play')).toHaveText('Pause');
    await expect(page.locator('#demo-count')).toHaveText('Step 2 / 4', { timeout: 6500 });
    await page.locator('#demo-play').click();
    await expect(page.locator('#demo-play')).toHaveText('Play');
    await page.locator('#demo-play').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('#demo-play')).toHaveText('Play');
    await expect(page.locator('#demo-status')).toContainText('Reduced motion');
  });

  test('narrow layouts and the walkthrough have no overflow or serious accessibility issues', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-demo="safetrip"]').click();
    await page.locator('#demo-next').click();
    await page.locator('#demo-next').click();
    await expect(page.locator('.demo-seats .selected')).toHaveText('06');
    const modal = page.locator('#product-walkthrough');
    expect(await modal.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical')).toEqual([]);
  });
});
