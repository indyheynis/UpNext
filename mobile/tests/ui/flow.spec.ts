import { test, expect } from '@playwright/test';
test('home, sport selection and privacy work on a mobile viewport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Make my first poster' })).toBeVisible();
  await page.waitForTimeout(650);
  await page.screenshot({ path: 'test-results/home.png', fullPage: true });
  await page.getByRole('button', { name: 'Make my first poster' }).click();
  await expect(page).toHaveURL(/\/sport$/);
  await page.getByRole('radio').filter({ hasText: 'BASKETBALL' }).click();
  await expect(page.getByRole('radio').filter({ hasText: 'BASKETBALL' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('button', { name: "That's my game" }).click();
  await expect(page.getByRole('button', { name: 'Choose athlete photo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Make it mine' })).toBeDisabled();
  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await expect(page.getByText('Local by default')).toBeVisible();
  expect(errors).toEqual([]);
});

test('photo upload, details and all poster styles render through the editor', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Make my first poster' }).click();
  await expect(page).toHaveURL(/\/sport$/);
  await page.getByRole('button', { name: "That's my game" }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose athlete photo' }).click();
  await (await chooser).setFiles('assets/icon.png');
  await expect(page.getByRole('button', { name: 'Choose a different photo' })).toBeVisible();
  await page
    .getByRole('switch', { name: 'I have permission to use this photo and I am 18 or older' })
    .click();
  await page.getByRole('button', { name: 'Make it mine' }).click();
  await page.getByRole('button', { name: 'Find my style' }).click();
  await expect(page.getByText('Add your player name.')).toBeVisible();
  await page.getByLabel('Player name', { exact: true }).fill('Jordan Davis');
  await page.getByLabel('Number', { exact: true }).fill('23');
  await page.getByLabel('Team name', { exact: true }).fill('Northside');
  await page.getByLabel('Opponent (optional)', { exact: true }).fill('Westside');
  await page.getByLabel('Date (optional)', { exact: true }).fill('2026-11-06');
  await page.getByLabel('Time (optional)', { exact: true }).fill('19:30');
  await page.getByRole('button', { name: 'Find my style' }).click();
  await page.getByRole('radio').filter({ hasText: 'Neon' }).click();
  await page.getByRole('button', { name: 'See my poster' }).click();
  await expect(page.getByText('1080 × 1920 PNG • no watermark')).toBeVisible();
  await expect(page.getByLabel('neon poster for Jordan Davis')).toBeVisible();
  await page.getByRole('radio', { name: 'POST 4:5' }).click();
  await expect(page.getByText('1080 × 1350 PNG • no watermark')).toBeVisible();
  await page.screenshot({ path: 'test-results/editor.png', fullPage: true });
  await page.getByRole('radio', { name: 'Dark', exact: true }).click();
  await expect(page.getByLabel('dark poster for Jordan Davis')).toBeVisible();
  await page.getByRole('radio', { name: 'Cinematic', exact: true }).click();
  await expect(page.getByLabel('cinematic poster for Jordan Davis')).toBeVisible();
  expect(errors).toEqual([]);
});
