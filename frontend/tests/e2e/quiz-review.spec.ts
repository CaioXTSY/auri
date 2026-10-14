import { test, expect } from '@playwright/test';

test('authorized review UI displays key and explanations, records a reason and removes approved quiz', async ({ page }) => {
  const user = { id: 'synthetic-admin', name: 'Synthetic admin', email: 'admin@example.invalid', role: 'ADMIN' };
  const quiz = { id: 'synthetic-quiz', missionId: 'synthetic-mission', title: 'Soma sintética', question: 'Quanto é 2 + 2?', difficulty: 'FACIL', options: ['1', '2', '4', '5'], correctIndex: 2, explanations: ['Errada 1', 'Errada 2', 'Dois mais dois é quatro', 'Errada 5'] };
  let approved = false;
  let decision: unknown;
  await page.addInitScript((profile) => {
    localStorage.setItem('auri-auth-storage', JSON.stringify({ state: { user: profile, isAuthenticated: true }, version: 2 }));
    localStorage.setItem(`auri-platform-tour:${profile.id}:ADMIN:v2`, 'completed');
  }, user);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith('/auth/refresh')) body = { access_token: 'synthetic-token' };
    else if (path.endsWith('/users/me')) body = user;
    else if (path.endsWith('/missions/quiz-review/pending')) body = approved ? [] : [quiz];
    else if (path.endsWith('/missions/synthetic-mission/quiz/review')) { decision = route.request().postDataJSON(); approved = true; body = { ...quiz, reviewStatus: 'APPROVED' }; }
    else if (path.endsWith('/admin/ai-generations')) body = { data: [], meta: { total: 0 } };
    else if (path.includes('/notifications')) body = path.endsWith('/unread-count') ? { count: 0 } : { data: [], meta: { total: 0 } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/admin/ai-generations');
  const tourSkip = page.getByRole('button', { name: /pular/i });
  if (await tourSkip.isVisible()) await tourSkip.click();
  await expect(page.getByText('C. 4 — Gabarito')).toBeVisible();
  await expect(page.getByText('Dois mais dois é quatro', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprovar e publicar' })).toBeDisabled();
  await page.getByLabel('Justificativa: Soma sintética').fill('Teste automatizado de interface; sem parecer pedagógico humano.');
  await page.getByRole('button', { name: 'Aprovar e publicar' }).click();
  await expect(page.getByText('Nenhuma questão pendente.')).toBeVisible();
  expect(decision).toEqual({ decision: 'APPROVED', reason: 'Teste automatizado de interface; sem parecer pedagógico humano.' });
});
