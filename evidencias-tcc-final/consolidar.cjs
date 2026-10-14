const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const decode = bytes => bytes[0] === 0xff && bytes[1] === 0xfe
  ? bytes.subarray(2).toString('utf16le') : bytes.toString('utf8').replace(/^\uFEFF/, '');
// Preserve console contents and convert Windows redirection encoding to readable UTF-8.
for (const file of fs.readdirSync(__dirname).filter(f => f.endsWith('.txt') || f === 'browser.json')) {
  const name = path.join(__dirname, file);
  const text = decode(fs.readFileSync(name))
    .replace(/[ \t]+(?=\r?$)/gm, '')
    .replace(/(?:\r?\n)+$/, '\n');
  fs.writeFileSync(name, file === 'browser.json' ? text.slice(text.indexOf('{')) : text);
}
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
const groups = [['unit', 'unit.json'], ['api', 'api-final.json'], ['docker', 'docker.json']].map(([name, file]) => {
  const run = read(file);
  return { name, evidence: file, executed: run.numTotalTests, passed: run.numPassedTests,
    failed: run.numFailedTests, notExecuted: run.numPendingTests, startedAt: new Date(run.startTime).toISOString(),
    suites: run.testResults.map(suite => ({ file: path.relative(root, suite.name).replaceAll('\\', '/'),
      cases: suite.assertionResults.map(test => ({ name: test.fullName, status: test.status })) })),
  };
});
const browser = read('browser.json');
groups.push({ name: 'browser', evidence: 'browser.json', executed: browser.stats.expected + browser.stats.unexpected,
  passed: browser.stats.expected, failed: browser.stats.unexpected, notExecuted: browser.stats.skipped,
  startedAt: browser.stats.startTime,
});
assert.deepEqual(groups.map(g => g.passed), [84, 46, 5, 7]);
assert.ok(groups.every(g => g.failed === 0 && g.notExecuted === 0));
const integration = read('integracao-resultados.json'), smoke = read('smoke-resultados.json');
for (const record of [...integration, ...smoke]) assert.deepEqual(record.obtained, record.expected);
const version = read('versao-avaliada.json');
assert.equal(version.testedCommit, 'e7232418923d5f5bf61ba3615b27bdca2c950d71');
for (const file of version.historicalPreservation) {
  assert.equal(hash(fs.readFileSync(path.join(root, file.file))), file.sha256);
}
const tracked = cp.execFileSync('git', ['-C', root, 'ls-files', 'backend/src', 'backend/prisma', 'backend/test', 'backend/scripts',
  'frontend/src', 'frontend/vite.config.ts', 'frontend/playwright.config.ts']).toString().trim().split(/\r?\n/).filter(p => !p.endsWith('.py'));
fs.writeFileSync(path.join(__dirname, 'fontes-testadas-sha256.json'), JSON.stringify(tracked.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, file))) })), null, 2));
fs.writeFileSync(path.join(__dirname, 'testes-final.json'), JSON.stringify({
  testedSourceCommit: version.testedCommit,
  provenance: 'Original unit/Docker/browser suites ran on identical production and suite sources before the test-only commit. The final API run included both committed test changes. No production source changed.',
  groups, total: { executed: 142, passed: 142, failed: 0, notExecuted: 0 },
  numericIntegrationProbes: integration.length, numericSmokeProbes: smoke.length,
  intermediateRuns: { originalApiCasesPassed: 45, firstSmokeFailed: 1,
    reason: 'New assertion expected 403 for outsider activity access; actual and inspected existing contract is 404. Updated only that assertion. No production bug or access bypass.',
    evidence: 'smoke-inicial.json' },
  commandChecks: {
    prismaGenerate: 0, prismaValidate: 0, migrationsDeploy: 0, migrationsStatus: 0,
    backendBuild: 0, workerBuild: 0, backendLint: { exitCode: 0, errors: 0, warnings: 21 },
    frontendTypes: 0, frontendDefaultBuild: { exitCode: 1, reason: 'Vite/esbuild Cannot read directory: Access is denied' },
    frontendNativeBuild: 0, frontendLint: 0,
  },
}, null, 2));
console.log(JSON.stringify({ passed: 142, integrationProbes: integration.length, smokeProbes: smoke.length,
  historicalFilesUnchanged: version.historicalPreservation.length, sourceFilesHashed: tracked.length }));
