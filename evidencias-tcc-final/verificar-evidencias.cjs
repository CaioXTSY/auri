// Read-only corroboration of the historical experiment. Never calls OpenAI or opens a database.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const historical = path.join(root, 'evidencias-tcc');
const read = name => JSON.parse(fs.readFileSync(path.join(historical, name), 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (...args) => cp.execFileSync('git', ['-C', root, ...args]);
require(path.join(root, 'backend/node_modules/ts-node')).register({
  project: path.join(root, 'backend/tsconfig.json'),
});
const quality = require(path.join(root, 'backend/src/modules/missions/quiz-quality.ts'));
const final = read('quizzes-reais.json');
const pilot = read('quizzes-preliminares.json');
const technical = read('revisao-tecnica-pos-geracao.json');
const counts = (items, select) => items.reduce((result, value) => {
  const key = select(value); result[key] = (result[key] || 0) + 1; return result;
}, {});
const summarize = records => {
  const saved = records.filter(r => r.persisted);
  const calls = records.flatMap(r => r.calls);
  const before = [], failures = [], estimated = [];
  let pairs = 0, keyPreserved = 0;
  for (const record of saved) {
    const quiz = record.quiz;
    quality.validateQuizShape(quiz);
    assert.equal(record.requestedDifficulty, record.returnedDifficulty);
    assert.equal(record.requestedDifficulty, record.persistedDifficulty);
    assert.equal(record.persistedDifficulty, quiz.difficulty);
    const generation = [...record.calls].reverse().find(c => c.operation === 'generation');
    const raw = JSON.parse(generation.response);
    before.push(raw.correctIndex);
    const samePairs = quiz.options.every((option, i) => {
      const index = raw.options.indexOf(option);
      return index >= 0 && quiz.explanations[i] === raw.explanations[index];
    });
    const sameKey = quiz.options[quiz.correctIndex] === raw.options[raw.correctIndex];
    if (samePairs) pairs++;
    if (sameKey) keyPreserved++;
    if (!samePairs || !sameKey) failures.push(record.missionId);
    const review = [...record.calls].reverse().find(c => c.operation === 'semantic_review');
    if (review) {
      const parsed = JSON.parse(review.response);
      estimated.push({ requested: record.requestedDifficulty, estimated: parsed.estimatedDifficulty });
    }
  }
  const byModel = {};
  for (const call of calls) {
    if (!call.usage) continue;
    const entry = byModel[`${call.operation}/${call.model}`] ||= {
      calls: 0, input: 0, output: 0, cached: 0, estimatedUsd: 0,
    };
    entry.calls++;
    const { inputTokens, outputTokens, cachedInputTokens = 0 } = call.usage;
    assert.equal(call.usage.totalTokens, inputTokens + outputTokens);
    entry.input += inputTokens; entry.output += outputTokens; entry.cached += cachedInputTokens;
    const rates = call.model.startsWith('gpt-4.1-mini') ? [.4, .1, 1.6] : [.15, .075, .6];
    entry.estimatedUsd += ((inputTokens - cachedInputTokens) * rates[0] + cachedInputTokens * rates[1] + outputTokens * rates[2]) / 1e6;
  }
  const seen = new Set();
  const duplicates = [];
  for (const record of saved) {
    const key = quality.quizContentKey(record.quiz.question);
    if (seen.has(key)) duplicates.push(record.missionId);
    seen.add(key);
  }
  return {
    requests: records.length, saved: saved.length, calls: calls.length,
    successfulCallsWithUsage: calls.filter(c => c.usage).length,
    operations: counts(calls, c => c.operation),
    requestedSavedDifficulty: counts(saved, r => r.requestedDifficulty),
    keysAfter: counts(saved, r => 'ABCD'[r.quiz.correctIndex]),
    keysBefore: counts(before, index => 'ABCD'[index]),
    pairs, keyPreserved, mappingFailures: failures,
    estimatedDifficulty: counts(estimated, r => `${r.requested}/${r.estimated}`),
    labelDisagreements: estimated.filter(r => r.requested !== r.estimated).length,
    positionReferencesInSaved: saved.filter(r => quality.quizWarnings(r.quiz).includes('EXPLICACAO_REFERENCIA_POSICAO')).length,
    duplicates, byModel,
    estimatedUsd: Object.values(byModel).reduce((sum, entry) => sum + entry.estimatedUsd, 0),
  };
};
const finalSummary = summarize(final), pilotSummary = summarize(pilot);
assert.equal(finalSummary.saved, 60); assert.equal(pilotSummary.saved, 60);
assert.deepEqual(finalSummary.keysAfter, { B: 12, A: 17, D: 14, C: 17 });
assert.equal(finalSummary.pairs, 60); assert.equal(finalSummary.keyPreserved, 60);
assert.equal(finalSummary.labelDisagreements, 30);
assert.equal(finalSummary.positionReferencesInSaved, 7);
assert.equal(finalSummary.duplicates.length, 1);
assert.equal(technical.findings.length, 13);
assert.equal(technical.findings.filter(f => f.flags.includes('CODE_EXECUTION_KEY_MISMATCH')).length, 6);
assert.equal(technical.humanReviews, 0);
assert.ok(Math.abs(finalSummary.estimatedUsd - .0937942) < 1e-10);
assert.ok(Math.abs(finalSummary.estimatedUsd + pilotSummary.estimatedUsd - .1440208) < 1e-10);
const csvRows = fs.readFileSync(path.join(historical, 'amostra-final.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(line => line.split(','));
const states = counts(csvRows, row => row[5]);
assert.deepEqual(states, { PENDING: 47, AUTO_REJECTED: 13 });
const events = fs.readFileSync(path.join(historical, 'openai-calls.jsonl'), 'utf8').trim().split(/\r?\n/).map(JSON.parse);
assert.equal(events.length, 257);
const sourceDifferences = read('fontes-testadas-sha256.json').filter(entry => sha(fs.readFileSync(path.join(root, entry.file))) !== entry.sha256).map(entry => entry.file);
assert.deepEqual(sourceDifferences, ['backend/test/tcc-validation.e2e-spec.ts']);
const preserved = ['RELATORIO_VALIDACAO_TCC.md', ...fs.readdirSync(historical).map(file => `evidencias-tcc/${file}`)].map(file => ({ file, sha256: sha(fs.readFileSync(path.join(root, file))) }));
assert.equal(git('diff', '--name-only', '98f7ff3', '--', 'RELATORIO_VALIDACAO_TCC.md', 'evidencias-tcc').toString().trim(), '');
const migrationPath = 'backend/prisma/migrations/20260921000000_initial_schema/migration.sql';
const oldMigration = git('show', `4fdd914:${migrationPath}`);
const correctedMigration = git('show', `090eb79:${migrationPath}`);
assert.deepEqual(oldMigration.subarray(0, 3), Buffer.from([0xef, 0xbb, 0xbf]));
assert.equal(Buffer.compare(oldMigration.subarray(3), correctedMigration), 0);
const version = {
  generatedAt: new Date().toISOString(), branch: git('branch', '--show-current').toString().trim(),
  initialCommit: '98f7ff3edafc6c9fb1aa263f49dd1f0f7a53b372',
  testedCommit: git('rev-parse', 'HEAD').toString().trim(), priorSourceCommit: '090eb79d018261abadd904f2beec44b29b0e6ecb',
  initialWorkingTree: 'clean', node: process.version,
  database: { engine: 'MariaDB 10.4.32', host: '127.0.0.1', port: 33308, name: 'auri_tcc_final_20261013', dataDirectory: 'C:/Users/extas/AppData/Local/Temp/auri-tcc-final-20261013/db' },
  dependencies: Object.fromEntries([
    ['backend', '@nestjs/core'], ['backend', '@prisma/client'], ['backend', 'prisma'], ['backend', 'jest'],
    ['backend', 'typescript'], ['backend', 'openai'], ['frontend', 'react'], ['frontend', 'vite'],
    ['frontend', 'typescript'], ['frontend', '@playwright/test'],
  ].map(([directory, name]) => [`${directory}/${name}`, JSON.parse(fs.readFileSync(path.join(root, directory, 'node_modules', name, 'package.json'), 'utf8')).version])),
  sourceDifferencesFromPreviousHashManifest: sourceDifferences,
  productionSourceDiffFromPriorCommit: git('diff', '--name-only', '090eb79', '--', 'backend/src', 'backend/prisma', 'frontend/src', 'frontend/vite.config.ts', 'frontend/playwright.config.ts').toString().trim(),
  newTest: 'backend/test/final-smoke.e2e-spec.ts', newRealOpenAiCalls: 0,
  historicalDatabaseReopened: false, historicalPreservation: preserved,
  migrationBom: {
    originalGitBlobSha256: sha(oldMigration), correctedGitBlobSha256: sha(correctedMigration),
    differsOnlyByUtf8BomInGit: true, currentPhysicalFileSha256: sha(fs.readFileSync(path.join(root, migrationPath))),
    existingInstallationChecksumMayDiffer: true, productionHistoryChanged: false,
  },
};
fs.writeFileSync(path.join(__dirname, 'corroboracao-historica.json'), JSON.stringify({
  method: 'Independent read-only recomputation from preserved files using current shape validator and raw call contents; no new generation, database round trip or teacher judgment.',
  final: finalSummary, preliminary: pilotSummary, archivedStates: states,
  humanReviews: 0, contentKeyErrors: technical.executionKeyMismatches,
  historicalExecutionResults: read('quizzes-reais-execucao.json').counts,
  historicalDatabaseChecks: read('metricas-consolidadas.json').databaseChecks,
  costRates: 'Historical rates recorded in prior report; not a new price lookup or provider invoice.',
  costTotalKnownUsd: finalSummary.estimatedUsd + pilotSummary.estimatedUsd,
  accountingLimitations: read('metricas-consolidadas.json').accountingLimitations,
  preservedFiles: preserved.length,
}, null, 2));
fs.writeFileSync(path.join(__dirname, 'versao-avaliada.json'), JSON.stringify(version, null, 2));
console.log(JSON.stringify({ saved: finalSummary.saved + pilotSummary.saved, finalKeys: finalSummary.keysAfter,
  mappingFailures: finalSummary.mappingFailures.length, states, costsKnownUsd: finalSummary.estimatedUsd + pilotSummary.estimatedUsd,
  sourceDifferences, productionSourceDiff: version.productionSourceDiffFromPriorCommit, historicalPreservedFiles: preserved.length,
  bomChecksumChanged: version.migrationBom.originalGitBlobSha256 !== version.migrationBom.correctedGitBlobSha256 }));
