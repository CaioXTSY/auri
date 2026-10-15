import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const teacher = { id: 'teacher-preview', name: 'Professor', email: 'professor@example.test', role: 'PROFESSOR' };
const dashboard = {
  totals: { classes: 4, activeClasses: 3, students: 118 },
  classes: [
    { id: 'algorithms', name: 'Algoritmos e Lógica', year: 2026, status: 'ATIVA', studentCount: 32, activityCount: 12 },
    { id: 'structures', name: 'Estruturas de Dados', year: 2026, status: 'ATIVA', studentCount: 28, activityCount: 9 },
    { id: 'programming', name: 'Programação I', year: 2025, status: 'ENCERRADA', studentCount: 30, activityCount: 8 },
    { id: 'fourth', name: 'Outra turma', year: 2026, status: 'ATIVA', studentCount: 28, activityCount: 2 },
  ],
  recentSubmissions: [
    { id: 'delivery-1', activityId: 'list-03', activityTitle: 'Lista 03', className: 'Algoritmos', studentName: 'Maria Santos', kind: 'ACTIVITY', submittedAt: '2026-10-15T11:00:00Z', status: 'PENDING_REVIEW' },
    { id: 'delivery-2', activityId: 'report-02', activityTitle: 'Relatório 02', className: 'Estruturas', studentName: 'João Lima', kind: 'ACTIVITY', submittedAt: '2026-10-15T10:00:00Z', status: 'GRADED' },
    { id: 'delivery-3', activityId: 'code-01', activityTitle: 'Soma de inteiros', className: 'Algoritmos', studentName: 'Ana Paula', kind: 'CODE', submittedAt: '2026-10-15T09:00:00Z', status: 'AUTOMATIC' },
  ],
};

const authenticate = async (page: Page) => {
  await page.route('**/socket.io/**', (route) => route.abort());
  await page.addInitScript((user) => {
    localStorage.setItem('auri-auth-storage', JSON.stringify({
      version: 2, state: { user, isAuthenticated: true },
    }));
    localStorage.setItem('auri-platform-tour:teacher-preview:PROFESSOR:v2', 'completed');
  }, teacher);
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/auth/refresh') ? { access_token: 'preview-token' }
      : path.endsWith('/users/me') ? teacher
        : path.endsWith('/dashboard/teacher') ? dashboard
          : path.endsWith('/notifications/unread') ? 0 : { data: [], meta: { total: 0 } };
    await route.fulfill({ json: body });
  });
};

test.beforeEach(async ({ page }) => authenticate(page));

test('teacher overview matches the prototype structure with real navigation targets', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Bem-vindo, Professor.' })).toBeVisible();
  await expect(page.getByText('118', { exact: true })).toBeVisible();
  await expect(page.getByText('12 atividades', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Consultar Programação I' })).toHaveAttribute('href', '/dashboard/teacher/classes/programming');
  await expect(page.getByRole('table')).toContainText('Maria Santos');
  await expect(page.getByRole('table')).toContainText('A corrigir');
  await expect(page.getByRole('table')).toContainText('Corrigida');
  await expect(page.getByRole('table')).toContainText('Auto');
  await expect(page.getByRole('link', { name: 'Lista 03', exact: true })).toHaveAttribute('href', '/dashboard/teacher/activities/list-03/submissions');
  await expect(page.getByRole('link', { name: 'Soma de inteiros', exact: true })).toHaveAttribute('href', '/dashboard/teacher/activities/code/code-01/submissions');
  await expect(page.getByRole('link', { name: 'Criar atividade', exact: true })).toHaveAttribute('href', '/dashboard/teacher/activities/new');
  await expect(page.getByRole('link', { name: 'Criar atividade', exact: true })).toHaveCSS('background-color', 'rgb(30, 41, 59)');
  await expect(page.getByRole('link', { name: 'Publicar no mural', exact: true })).toHaveAttribute('href', '/dashboard/posts');
  await expect(page.getByRole('link', { name: 'Gerenciar turmas', exact: true })).toHaveAttribute('href', '/dashboard/teacher/classes');
  await expect(page.getByText('Outra turma', { exact: true })).toHaveCount(0);
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze())
    .violations.filter(({ impact }) => impact === 'critical' || impact === 'serious');
  expect(violations.map(({ id }) => id)).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('teacher-desktop.png'), fullPage: true });
});

test('teacher overview fits a narrow screen and keeps its shortcuts usable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Entregas recentes' })).toBeVisible();
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: 'Criar atividade', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('teacher-mobile.png'), fullPage: true });
});

test('empty dashboard does not substitute illustrative students or submissions', async ({ page }) => {
  await page.route('**/api/v1/dashboard/teacher', (route) => route.fulfill({
    json: { totals: { classes: 0, activeClasses: 0, students: 0 }, classes: [], recentSubmissions: [] },
  }));
  await page.goto('/dashboard');
  await expect(page.getByText('Você ainda não criou nenhuma turma.', { exact: false })).toBeVisible();
  await expect(page.getByText('Nenhuma entrega nas últimas 24 horas.')).toBeVisible();
  await expect(page.getByText('Maria Santos')).toHaveCount(0);
});

test('dashboard reports an unavailable API and can retry without presenting zero totals', async ({ page }) => {
  await page.route('**/api/v1/dashboard/teacher', (route) => route.fulfill({ status: 403, json: { message: 'Forbidden' } }));
  await page.goto('/dashboard');
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o painel do professor.', { timeout: 15000 });
  await page.route('**/api/v1/dashboard/teacher', (route) => route.fulfill({ json: dashboard }));
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('118', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
