import { test, expect, type Page, type Route } from '@playwright/test';

const bootstrap = async (page: Page, role: 'ADMIN' | 'ALUNO', handler: (route: Route, path: string) => Promise<boolean>) => {
  const user = { id: `synthetic-${role}`, name: 'Synthetic user', email: 'synthetic@example.invalid', role };
  await page.addInitScript(profile => {
    localStorage.setItem('auri-auth-storage', JSON.stringify({ state: { user: profile, isAuthenticated: true }, version: 2 }));
    localStorage.setItem(`auri-platform-tour:${profile.id}:${profile.role}:v2`, 'completed');
  }, user);
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (await handler(route, path)) return;
    let body: unknown = {};
    if (path.endsWith('/auth/refresh')) body = { access_token: 'synthetic-token' };
    else if (path.endsWith('/users/me')) body = user;
    else if (path.endsWith('/classes/my-classes')) body = [];
    else if (path.endsWith('/posts')) body = { data: [], meta: { total: 0 } };
    else if (path.includes('/notifications')) body = path.endsWith('/unread') ? 0 : { data: [], meta: { total: 0 } };
    else if (path.endsWith('/dashboard/student') || path.endsWith('/gamification/stats/me')) body = {
      points: { total: 0 },
      level: { userId: user.id, currentLevel: 0, totalPoints: 0, levelName: 'Iniciante', pointsInCurrentLevel: 0, pointsNeededForNextLevel: 100, progressToNextLevel: 0 },
      achievements: { recent: [], unlocked: 0, total: 0, progress: 0 },
      ranking: { global: null, nearby: [] },
      missions: { total: 0, completed: 0, inProgress: 0, expired: 0, totalPoints: 0, completionRate: 0 },
      streak: { current: 0, longest: 0, lastDate: null },
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
};

test('admin keeps generation audit and usage details without requesting or displaying a human approval queue', async ({ page }) => {
  let reviewRequests = 0;
  const generation = { id: 'synthetic-generation', type: 'QUIZ', createdAt: '2026-10-13T12:00:00Z',
    promptPreview: 'Synthetic prompt', prompt: 'Synthetic full prompt', response: 'Synthetic full response',
    model: 'synthetic-generator', inputTokens: 17, outputTokens: 8, totalTokens: 25,
    generationAttempts: 1, validationCalls: 1, missionQuizzes: [] };
  await bootstrap(page, 'ADMIN', async (route, path) => {
    if (path.includes('quiz-review') || path.endsWith('/quiz/review')) reviewRequests++;
    if (!path.includes('/admin/ai-generations')) return false;
    const body = path.endsWith('/synthetic-generation') ? generation : { data: [generation], meta: { total: 1 } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    return true;
  });
  await page.goto('/admin/ai-generations');
  await expect(page.getByText('25 tokens', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aprovar e publicar' })).toHaveCount(0);
  await expect(page.getByText('Nenhuma questão pendente.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver', exact: true }).click();
  await expect(page.getByText('Métricas de consumo', { exact: true })).toBeVisible();
  await expect(page.getByText('Synthetic full prompt', { exact: true })).toBeVisible();
  await expect(page.getByText('Synthetic full response', { exact: true })).toBeVisible();
  await expect(page.getByText('synthetic-generator', { exact: true })).toBeVisible();
  expect(reviewRequests).toBe(0);
});

test('student answers the available daily quiz, sees explanations only after answering and receives the XP feedback', async ({ page }) => {
  let answer: unknown;
  await bootstrap(page, 'ALUNO', async (route, path) => {
    if (!path.includes('/missions/')) return false;
    let body: unknown;
    if (path.endsWith('/quiz/answer')) {
      answer = route.request().postDataJSON();
      body = { isCorrect: true, correctIndex: 2, selectedIndex: 2, explanations: ['Errada um', 'Errada dois', 'Dois mais dois é quatro', 'Errada cinco'], difficulty: 'FACIL', pointsAwarded: 40 };
    } else body = { missionId: 'synthetic-mission', title: 'Soma sintética', question: 'Quanto é 2 + 2?', difficulty: 'FACIL', points: 40, options: ['1', '2', '4', '5'], answered: false, attempt: null };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    return true;
  });
  await page.goto('/dashboard');
  const modal = page.getByRole('dialog');
  await expect(modal.getByText('Quanto é 2 + 2?', { exact: true })).toBeVisible();
  await expect(modal.getByText('Dois mais dois é quatro', { exact: true })).toHaveCount(0);
  await expect(modal).not.toContainText(/aguardando aprovação|revisão humana|revisão de um responsável/i);
  await modal.getByRole('button', { name: /^C\s+4$/ }).click();
  await modal.getByRole('button', { name: 'Responder agora' }).click();
  await expect(modal.getByText('Resposta correta! Você ganhou 40 XP.', { exact: true })).toBeVisible();
  await expect(modal.getByText('Dois mais dois é quatro', { exact: true })).toBeVisible();
  expect(answer).toEqual({ selectedIndex: 2 });
});

test('student receives a generation unavailability message without waiting for human approval', async ({ page }) => {
  await bootstrap(page, 'ALUNO', async (route, path) => {
    if (!path.includes('/missions/daily-quiz')) return false;
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Synthetic unavailable' }) });
    return true;
  });
  await page.goto('/dashboard');
  const modal = page.getByRole('dialog');
  await expect(modal.getByText('Não foi possível disponibilizar um quiz diário válido. Tente novamente mais tarde.', { exact: true })).toBeVisible();
  await expect(modal).not.toContainText(/aguardando aprovação|revisão humana|revisão de um responsável/i);
  await expect(modal.getByRole('button', { name: 'Responder agora' })).toHaveCount(0);
});
