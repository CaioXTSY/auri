import 'reflect-metadata';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { isDeepStrictEqual } from 'util';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  normalizeGeneratedQuiz,
  quizWarnings,
  GeneratedQuiz,
} from '../src/modules/missions/quiz-quality';
import { QuizCallAudit } from '../src/modules/missions/quiz-generator.service';

type Entry = {
  requestedDifficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  persistedDifficulty: string | null;
  returnedDifficulty: string | null;
  persisted: boolean;
  generationId: string;
  missionId: string | null;
  quiz: GeneratedQuiz | null;
  calls: QuizCallAudit[];
  shuffleIntegrity: boolean | null;
};
const dir = resolve(__dirname, '../../evidencias-tcc');
const load = (name: string) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const pricing = {
  'gpt-4o-mini': {
    input: 0.15,
    cached: 0.075,
    output: 0.6,
    source: 'https://developers.openai.com/api/docs/models/gpt-4o-mini',
  },
  'gpt-4.1-mini': {
    input: 0.4,
    cached: 0.1,
    output: 1.6,
    source: 'https://developers.openai.com/api/docs/models/gpt-4.1-mini',
  },
};
function phase(records: Entry[]) {
  const persisted = records.filter((r) => r.persisted);
  const calls = records.flatMap((r) => r.calls);
  const generation = calls.filter((c) => c.operation === 'generation');
  let structuralRejections = 0,
    warningCandidates = 0;
  const warningCounts: Record<string, number> = {};
  for (const record of records)
    for (const call of record.calls.filter((c) => c.operation === 'generation')) {
      try {
        const quiz = normalizeGeneratedQuiz(call.response, record.requestedDifficulty);
        const warnings = quizWarnings(quiz);
        if (warnings.length) warningCandidates++;
        warnings.forEach((warning) => {
          warningCounts[warning] = (warningCounts[warning] || 0) + 1;
        });
      } catch {
        structuralRejections++;
      }
    }
  let semanticRejections = 0;
  for (const record of records)
    for (let i = 0; i < record.calls.length; i++) {
      const call = record.calls[i];
      if (call.operation !== 'semantic_review') continue;
      try {
        const response = JSON.parse(call.response),
          proposed = JSON.parse(record.calls[i - 1].response);
        if (response.isValid !== true || response.correctIndex !== proposed.correctIndex)
          semanticRejections++;
      } catch {
        semanticRejections++;
      }
    }
  const estimatedDifficulty: Record<string, Record<string, number>> = {};
  for (const record of persisted) {
    const review = JSON.parse(
      record.calls.filter((c) => c.operation === 'semantic_review').slice(-1)[0].response,
    );
    const value = String(review.estimatedDifficulty ?? 'UNKNOWN');
    estimatedDifficulty[record.requestedDifficulty] ??= {};
    estimatedDifficulty[record.requestedDifficulty][value] =
      (estimatedDifficulty[record.requestedDifficulty][value] || 0) + 1;
  }
  const costs: Record<
    string,
    {
      model: string;
      operation: string;
      calls: number;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      missingUsage: number;
      estimatedUSD: number;
      httpFailures: number;
    }
  > = {};
  for (const call of calls) {
    const key = `${call.model}:${call.operation}`;
    const group = (costs[key] ??= {
      model: call.model,
      operation: call.operation,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      missingUsage: 0,
      estimatedUSD: 0,
      httpFailures: 0,
    });
    group.calls++;
    if (call.status !== 200) group.httpFailures++;
    if (!call.usage) {
      group.missingUsage++;
      continue;
    }
    group.inputTokens += call.usage.inputTokens;
    group.outputTokens += call.usage.outputTokens;
    group.cachedTokens += call.usage.cachedInputTokens;
    const rate = call.model.startsWith('gpt-4o-mini')
      ? pricing['gpt-4o-mini']
      : call.model.startsWith('gpt-4.1-mini')
        ? pricing['gpt-4.1-mini']
        : null;
    if (!rate) throw new Error('Pricing not verified for recorded model');
    group.estimatedUSD +=
      ((call.usage.inputTokens - call.usage.cachedInputTokens) * rate.input +
        call.usage.cachedInputTokens * rate.cached +
        call.usage.outputTokens * rate.output) /
      1e6;
  }
  const questionCounts = new Map<string, number>();
  persisted.forEach((r) => {
    const q = r.quiz!.question.trim().replace(/\s+/g, ' ');
    questionCounts.set(q, (questionCounts.get(q) || 0) + 1);
  });
  const positions = [0, 1, 2, 3].map((i) => ({
    alternative: 'ABCD'[i],
    count: persisted.filter((r) => r.quiz!.correctIndex === i).length,
    percentage:
      (persisted.filter((r) => r.quiz!.correctIndex === i).length / persisted.length) * 100,
  }));
  const rawPositions = [0, 1, 2, 3].map((i) => ({
    alternative: 'ABCD'[i],
    count: persisted.filter(
      (r) =>
        JSON.parse(r.calls.filter((c) => c.operation === 'generation').slice(-1)[0].response)
          .correctIndex === i,
    ).length,
  }));
  const totalUSD = Object.values(costs).reduce((sum, c) => sum + c.estimatedUSD, 0);
  return {
    slots: records.length,
    persisted: persisted.length,
    failedSlots: records.length - persisted.length,
    generatedCandidates: generation.length,
    rejectedCandidates: generation.length - persisted.length,
    calls: calls.length,
    structuralRejections,
    semanticRejections,
    retrospectiveWarningCandidates: warningCandidates,
    retrospectiveWarningCounts: warningCounts,
    positions,
    rawPositions,
    requested: ['FACIL', 'MEDIO', 'DIFICIL'].map((d) => ({
      difficulty: d,
      slots: records.filter((r) => r.requestedDifficulty === d).length,
      persisted: persisted.filter((r) => r.persistedDifficulty === d).length,
    })),
    persistedDifficultyDivergences: persisted.filter(
      (r) =>
        r.requestedDifficulty !== r.persistedDifficulty ||
        r.returnedDifficulty !== r.requestedDifficulty,
    ).length,
    estimatedDifficulty,
    exactRepeatedQuestions: [...questionCounts.values()].reduce(
      (sum, n) => sum + Math.max(0, n - 1),
      0,
    ),
    shuffleIntegrityFailures: persisted.filter((r) => r.shuffleIntegrity !== true).length,
    costs: Object.values(costs),
    totalEstimatedUSD: totalUSD,
    meanEstimatedUSDPerSavedQuestion: totalUSD / persisted.length,
    humanApprovals: 0,
    humanRejections: 0,
  };
}
async function main() {
  const final: Entry[] = load('quizzes-reais.json'),
    preliminary: Entry[] = load('quizzes-preliminares.json');
  const database = process.env.DATABASE_URL || '';
  if (!/^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_/.test(database))
    throw new Error('Isolated database required');
  const prisma = new PrismaService({ datasources: { db: { url: database } } });
  const checks = {
    finalQuizRecords: 0,
    pending: 0,
    automaticallyRejected: 0,
    completeRoundTrips: 0,
    matchingUsageAudits: 0,
    failures: [] as string[],
  };
  const reviewStatuses = new Map<string, string>();
  try {
    for (const record of final) {
      const generation = await prisma.aIGeneration.findUniqueOrThrow({
        where: { id: record.generationId },
      });
      if (isDeepStrictEqual(generation.callAudit, record.calls)) checks.matchingUsageAudits++;
      else checks.failures.push(`Audit mismatch ${record.generationId}`);
      if (!record.persisted) continue;
      const mission = await prisma.mission.findUniqueOrThrow({
        where: { id: record.missionId! },
        include: { quiz: true },
      });
      checks.finalQuizRecords++;
      reviewStatuses.set(record.missionId!, mission.quiz!.reviewStatus);
      if (mission.quiz?.reviewStatus === 'PENDING') checks.pending++;
      if (mission.quiz?.reviewStatus === 'AUTO_REJECTED') checks.automaticallyRejected++;
      const quiz = mission.quiz!;
      const fields = [
        'title',
        'question',
        'difficulty',
        'options',
        'explanations',
        'correctIndex',
      ] as const;
      if (fields.every((f) => JSON.stringify(quiz[f]) === JSON.stringify(record.quiz![f])))
        checks.completeRoundTrips++;
      else checks.failures.push(`Persistence mismatch ${record.missionId}`);
    }
  } finally {
    await prisma.$disconnect();
  }
  const summary = {
    date: '2026-10-13',
    timezone: 'America/Sao_Paulo',
    testedCodeCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    final: phase(final),
    preliminary: phase(preliminary),
    databaseChecks: checks,
    pricing,
    accountingLimitations: [
      'Provider billing statements were not available.',
      'An initial interrupted pilot may have completed calls that were not durably recorded. The observed combined cost is a lower bound for the entire session, not a complete invoice. Final phase calls are durably recorded.',
    ],
    finalCodeExecution: existsSync(resolve(dir, 'quizzes-reais-execucao.json'))
      ? load('quizzes-reais-execucao.json').counts
      : null,
    preliminaryCodeExecution: load('quizzes-preliminares-execucao.json').counts,
  };
  writeFileSync(resolve(dir, 'metricas-consolidadas.json'), JSON.stringify(summary, null, 2));
  // Compact public CSV for answer/difficulty audit; no credentials or student data.
  writeFileSync(
    resolve(dir, 'amostra-final.csv'),
    'mission_id,dificuldade_solicitada,dificuldade_api,dificuldade_persistida,gabarito,status\n' +
      final
        .filter((r) => r.persisted)
        .map((r) =>
          [
            r.missionId,
            r.requestedDifficulty,
            r.returnedDifficulty,
            r.persistedDifficulty,
            'ABCD'[r.quiz!.correctIndex],
            reviewStatuses.get(r.missionId!) ?? 'UNKNOWN',
          ].join(','),
        )
        .join('\n'),
  );
  const sourceFiles = execFileSync(
    'git',
    [
      '-C',
      resolve(__dirname, '../../'),
      'ls-files',
      'backend/src',
      'backend/prisma',
      'backend/test',
      'backend/scripts',
      'frontend/src',
      'frontend/vite.config.ts',
      'frontend/playwright.config.ts',
    ],
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n');
  const hashes = sourceFiles
    .filter((f) => !f.endsWith('.py'))
    .map((file) => ({
      file,
      sha256: createHash('sha256')
        .update(readFileSync(resolve(__dirname, '../../', file)))
        .digest('hex'),
    }));
  writeFileSync(resolve(dir, 'fontes-testadas-sha256.json'), JSON.stringify(hashes, null, 2));
  console.log(
    JSON.stringify({
      final: summary.final.persisted,
      positions: summary.final.positions,
      finalUSD: summary.final.totalEstimatedUSD,
      recordedCombinedUSD: summary.final.totalEstimatedUSD + summary.preliminary.totalEstimatedUSD,
      databaseChecks: checks,
    }),
  );
  if (
    summary.final.persisted !== 60 ||
    summary.final.requested.some((d) => d.persisted !== 20) ||
    checks.failures.length ||
    checks.pending + checks.automaticallyRejected !== 60
  )
    throw new Error('Final evidence completeness check failed');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
