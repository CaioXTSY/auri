import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const scanForSeriousViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const seriousViolations = results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(
    seriousViolations,
    seriousViolations.map((violation) => `${violation.id}: ${violation.help}`).join('\n'),
  ).toEqual([]);
};

test.describe('accessibility baseline', () => {
  for (const route of ['/', '/login', '/register', '/forgot-password']) {
    test(`${route} has no critical or serious axe violations`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main, form').first()).toBeVisible();
      await scanForSeriousViolations(page);
    });
  }

  test('login remains usable by keyboard at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/login');

    const loginLink = page.getByRole('link', { name: 'Matricule-se agora' });
    await loginLink.focus();
    await expect(loginLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/register/);
    expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
