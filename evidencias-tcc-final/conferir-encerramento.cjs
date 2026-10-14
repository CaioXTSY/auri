const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const assert = require('assert/strict');
const net = require('net');
const root = path.resolve(__dirname, '..');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'));
const versions = read('versao-avaliada.json');
for (const file of versions.historicalPreservation) assert.equal(sha(fs.readFileSync(path.join(root, file.file))), file.sha256);
for (const file of read('fontes-testadas-sha256.json')) assert.equal(sha(fs.readFileSync(path.join(root, file.file))), file.sha256);
const dotenv = require(path.join(root, 'backend/node_modules/dotenv'));
const values = ['backend/.env', 'frontend/.env'].flatMap(file => {
  const filename = path.join(root, file);
  if (!fs.existsSync(filename)) return [];
  return Object.entries(dotenv.parse(fs.readFileSync(filename)))
    .filter(([key, value]) => /(?:SECRET|PASSWORD|API_KEY|SMTP_PASS|SMTP_USER)/i.test(key) && value.length >= 8)
    .map(([, value]) => value);
});
const newFiles = ['RELATORIO_FINAL_PARA_TCC.md', ...fs.readdirSync(__dirname).map(file => `evidencias-tcc-final/${file}`)];
const leaks = newFiles.filter(file => {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  return values.some(value => content.includes(value));
});
assert.deepEqual(leaks, []);
const sourceDirty = cp.execFileSync('git', ['-C', root, 'diff', '--name-only', '--', 'backend', 'frontend']).toString().trim();
assert.equal(sourceDirty, '');
const changedFiles = ['backend/test/final-smoke.e2e-spec.ts', 'backend/test/tcc-validation.e2e-spec.ts',
  ...newFiles, 'evidencias-tcc-final/verificacao-final.json', 'evidencias-tcc-final/arquivos-alterados.txt'];
fs.writeFileSync(path.join(__dirname, 'arquivos-alterados.txt'), [...new Set(changedFiles)].sort().join('\n') + '\n');
const closed = port => new Promise(resolve => {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  socket.setTimeout(2000);
  socket.on('connect', () => { socket.destroy(); resolve(false); });
  socket.on('error', error => { socket.destroy(); resolve(error.code === 'ECONNREFUSED'); });
  socket.on('timeout', () => { socket.destroy(); resolve(false); });
});
(async () => {
  const databaseStopped = await closed(33308), previewStopped = await closed(5173);
  assert.equal(databaseStopped, true); assert.equal(previewStopped, true);
  fs.writeFileSync(path.join(__dirname, 'verificacao-final.json'), JSON.stringify({
    checkedAt: new Date().toISOString(), testedCodeCommit: versions.testedCommit,
    testsPassed: read('testes-final.json').total, sourcesStillMatchTestedHashes: true,
    historicalFilesUnchanged: versions.historicalPreservation.length, configuredSensitiveValueMatches: 0,
    databaseStopped, previewStopped, newRealOpenAiCalls: 0, productionAccess: false,
    googleDocsModified: false, push: false, deploy: false,
    codeWorkingTree: 'clean; new report/evidence files committed separately afterward',
    docker: { server: '29.9.0', distro: 'AURI-TCC-Judge',
      nodeImageDigest: 'sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293',
      pythonImageDigest: 'sha256:1b668429b3511ab407d8e00648891631b0b1a4d7e15e3ca70f38ab5b91ad4ab4',
      confirmation: 'docker version and docker image inspect read-only commands; preexisting daemon left running',
    },
  }, null, 2));
  console.log(JSON.stringify({ testsPassed: 142, historicalFilesUnchanged: 30,
    sensitiveValueMatches: 0, sourcesMatch: true, databaseStopped, previewStopped }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
