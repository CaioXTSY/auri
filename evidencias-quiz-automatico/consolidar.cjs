const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const assert = require('assert/strict');
const net = require('net');
const root = path.resolve(__dirname, '..');
const initial = 'dd3514c79f681d7835be271ed09d6fbe4e9c79f9';
const tested = '938db7b76d8920bbd74f7cfc38b93d9366871819';
const git = (...args) => cp.execFileSync('git', ['-C', root, ...args]).toString().trim();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
for (const file of fs.readdirSync(__dirname).filter(f => f.endsWith('.txt') || f === 'browser.json')) {
  const filename = path.join(__dirname, file), bytes = fs.readFileSync(filename);
  let text = bytes[0] === 0xff && bytes[1] === 0xfe ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8').replace(/^\uFEFF/, '');
  text = text.replace(/[ \t]+(?=\r?$)/gm, '').replace(/(?:\r?\n)+$/, '\n');
  if (file === 'browser.json') text = text.slice(text.indexOf('{'));
  fs.writeFileSync(filename, text);
}
const groups = ['unit', 'api', 'docker'].map(name => {
  const run = read(`${name}.json`);
  return { name, evidence: `${name}.json`, executed: run.numPassedTests + run.numFailedTests,
    passed: run.numPassedTests, failed: run.numFailedTests, notExecuted: run.numPendingTests,
    startedAt: new Date(run.startTime).toISOString(),
    cases: run.testResults.flatMap(suite => suite.assertionResults.map(test => ({
      file: path.relative(root, suite.name).replaceAll('\\', '/'), name: test.fullName, status: test.status,
    }))),
  };
});
const browser = read('browser.json');
groups.push({ name: 'browser', evidence: 'browser.json', executed: browser.stats.expected + browser.stats.unexpected,
  passed: browser.stats.expected, failed: browser.stats.unexpected, notExecuted: browser.stats.skipped,
  startedAt: browser.stats.startTime,
});
assert.deepEqual(groups.map(g => g.passed), [91, 55, 5, 9]);
assert.ok(groups.every(g => g.failed === 0 && g.notExecuted === 0));
for (const file of ['quiz-automatic-resultados.json', 'integracao-resultados.json', 'smoke-resultados.json']) {
  for (const row of read(file)) assert.deepEqual(row.obtained, row.expected);
}
const historicalArgs = ['RELATORIO_VALIDACAO_TCC.md', 'RELATORIO_FINAL_PARA_TCC.md', 'evidencias-tcc', 'evidencias-tcc-final'];
assert.equal(git('diff', '--name-only', initial, '--', ...historicalArgs), '');
assert.equal(git('diff', '--name-only', tested, '--', 'backend', 'frontend'), '');
const preserved = git('ls-files', ...historicalArgs).split(/\r?\n/).map(file => ({ file, sha256: hash(file) }));
const sourceFiles = git('ls-files', 'backend/src', 'backend/prisma', 'backend/test', 'backend/scripts',
  'frontend/src', 'frontend/tests', 'frontend/vite.config.ts', 'frontend/playwright.config.ts').split(/\r?\n/).filter(file => !file.endsWith('.py'));
fs.writeFileSync(path.join(__dirname, 'versao-avaliada.json'), JSON.stringify({
  branch: git('branch', '--show-current'), initialCommit: initial, testedCodeCommit: tested, initialWorkingTree: 'clean',
  provenance: 'Tests ran on the same source bytes subsequently committed at testedCodeCommit; documentation committed separately.',
  changedImplementationFiles: git('diff', '--name-status', initial, tested).split(/\r?\n/),
  sourceHashes: sourceFiles.map(file => ({ file, sha256: hash(file) })), historicalPreservedHashes: preserved,
  node: process.version, database: { engine: 'MariaDB 10.4.32', host: '127.0.0.1', port: 33309, name: 'auri_tcc_quiz_automatico_20261013' },
  dependencies: Object.fromEntries([['backend', '@nestjs/core'], ['backend', '@prisma/client'], ['backend', 'jest'],
    ['backend', 'typescript'], ['frontend', 'react'], ['frontend', 'vite'], ['frontend', '@playwright/test']]
    .map(([directory, name]) => [`${directory}/${name}`, JSON.parse(fs.readFileSync(path.join(root, directory, 'node_modules', name, 'package.json'), 'utf8')).version])),
}, null, 2));
fs.writeFileSync(path.join(__dirname, 'testes-final.json'), JSON.stringify({
  testedCodeCommit: tested, groups, total: { executed: 160, passed: 160, failed: 0, notExecuted: 0 },
  changesFromPrevious142: { unitAdded: 7, apiAdded: 9, browserNetAdded: 2, previousApprovalUiCaseReplacedWithAuditCase: true },
  intermediates: { before: 'automatic-before.json: 1 selected case passed, 10 unselected',
    compilation: 'api-target-types-inicial.json: fixture difficulty initially declared string; fixed to Prisma enum; no test case ran in that failed compilation',
    docker: ['docker-inicial-skipped.json', 'docker-segundo-skipped.json'],
    typesCommand: 'backend-types-caminho-inicial.txt: nonexistent config path; corrected tsconfig.json passed',
  },
  commandChecks: { backendBuild: 0, workerBuild: 0, backendTypes: 0, frontendTypes: 0, frontendNativeBuild: 0,
    backendLint: { errors: 0, warnings: 21, exitCode: 0 }, frontendLint: 0, prismaValidate: 0, migrationsDeploy: 0, migrationsStatus: 0,
    frontendDefaultBuild: 'not rerun; known limitation from prior report' },
  mockBoundaries: 'OpenAI fetch mocked, SMTP mocked, browser API mocked; API business services and MariaDB real, Docker real.',
  newRealOpenAiCalls: 0, newOpenAiCostUsd: 0,
}, null, 2));
const reportFiles = ['RELATORIO_QUIZ_AUTOMATICO_TCC.md', ...fs.readdirSync(__dirname).map(file => `evidencias-quiz-automatico/${file}`)];
const dotenv = require(path.join(root, 'backend/node_modules/dotenv'));
const sensitive = ['backend/.env', 'frontend/.env'].flatMap(file => {
  const filename = path.join(root, file);
  if (!fs.existsSync(filename)) return [];
  return Object.entries(dotenv.parse(fs.readFileSync(filename)))
    .filter(([key, value]) => /SECRET|PASSWORD|API_KEY|SMTP_PASS|SMTP_USER/i.test(key) && value.length >= 8).map(([, value]) => value);
});
assert.ok(reportFiles.every(file => !sensitive.some(value => fs.readFileSync(path.join(root, file), 'utf8').includes(value))));
const stopped = port => new Promise(resolve => {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  socket.setTimeout(2000);
  socket.on('connect', () => { socket.destroy(); resolve(false); });
  socket.on('error', error => { socket.destroy(); resolve(error.code === 'ECONNREFUSED'); });
  socket.on('timeout', () => { socket.destroy(); resolve(false); });
});
(async () => {
  const databaseStopped = await stopped(33309), previewStopped = await stopped(5173);
  assert.equal(databaseStopped, true); assert.equal(previewStopped, true);
  fs.writeFileSync(path.join(__dirname, 'encerramento.json'), JSON.stringify({ checkedAt: new Date().toISOString(),
    testedCodeCommit: tested, databaseStopped, previewStopped, historicalFilesUnchanged: preserved.length,
    configuredSensitiveValueMatches: 0, productionAccess: false, googleDocsModified: false, push: false, deploy: false,
  }, null, 2));
  console.log(JSON.stringify({ testsPassed: 160, historicalFilesUnchanged: preserved.length, newRealOpenAiCalls: 0,
    sensitiveValueMatches: 0, databaseStopped, previewStopped }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
