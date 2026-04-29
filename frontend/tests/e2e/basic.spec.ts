import { test, expect } from '@playwright/test';

test('home renders and can navigate to login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Entrar na plataforma' })).toBeVisible();
  await page.getByRole('link', { name: 'Entrar na plataforma' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible();
});
