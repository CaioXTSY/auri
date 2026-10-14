import 'reflect-metadata';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { Difficulty } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { QuizGeneratorService } from '../src/modules/missions/quiz-generator.service';
import { validateQuizShape } from '../src/modules/missions/quiz-quality';

const output = resolve(__dirname, '../../evidencias-tcc');
mkdirSync(output, { recursive: true });
const database = process.env.DATABASE_URL;
if (
  !database ||
  !/^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_[a-z0-9_]+$/.test(database)
)
  throw new Error('Use DATABASE_URL explícita de banco local auri_tcc_*');
const credentials = parse(readFileSync(resolve(__dirname, '../.env')));
const config = new ConfigService({
  DATABASE_URL: database,
  AURI_EVALUATION_MODE: 'true',
  QUIZ_REVIEW_MODE: 'human',
  APP_TIME_ZONE: 'America/Sao_Paulo',
  OPENAI_AUDIT_FILE: resolve(output, 'openai-calls.jsonl'),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || credentials.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || credentials.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_REVIEW_MODEL:
    process.env.OPENAI_REVIEW_MODEL || credentials.OPENAI_REVIEW_MODEL || 'gpt-4.1-mini',
});
const prisma = new PrismaService({ datasources: { db: { url: database } } });
const service = new QuizGeneratorService(prisma, config);
const subjects = [
  'variáveis e tipos',
  'operadores aritméticos e lógicos',
  'condicionais',
  'laços de repetição',
  'funções e parâmetros',
  'vetores e listas',
  'strings',
  'recursão',
  'complexidade assintótica',
  'tratamento de exceções',
];
const records: Array<Record<string, unknown>> = existsSync(resolve(output, 'quizzes-reais.json'))
  ? JSON.parse(readFileSync(resolve(output, 'quizzes-reais.json'), 'utf8'))
  : [];
const difficulties: Difficulty[] = ['FACIL', 'MEDIO', 'DIFICIL'];

async function main() {
  await prisma.$connect();
  // Bounded to 120 slots, 3 concurrent requests, each with <=3 generation attempts.
  for (const difficulty of difficulties) {
    let slot = records.filter((r) => r.requestedDifficulty === difficulty).length;
    while (
      records.filter((r) => r.requestedDifficulty === difficulty && r.persisted === true).length <
        20 &&
      slot < 40
    ) {
      const needed =
        20 -
        records.filter((r) => r.requestedDifficulty === difficulty && r.persisted === true).length;
      const tasks = Array.from(
        { length: Math.min(3, needed, 40 - slot) },
        (_, offset) => slot + offset,
      );
      const batch = await Promise.all(
        tasks.map(async (i) => {
          const language = i % 2 === 0 ? 'Python 3.12' : 'JavaScript (Node.js 20)';
          const topic = `${subjects[i % 10]}; variante ${i < 10 ? 'análise de resultado' : 'depuração ou aplicação conceitual'}; use um cenário e nomes de variáveis novos. Não é necessário evitar a área temática, apenas os exemplos recentes.`;
          const result = await service.generateEvaluationQuiz({ difficulty, topic, language });
          let integrity: boolean | null = null;
          if (result.quiz) {
            validateQuizShape(result.quiz);
            const raw = JSON.parse(
              result.audit.filter((call) => call.operation === 'generation').slice(-1)[0]!.response,
            );
            integrity =
              raw.options[raw.correctIndex] === result.quiz.options[result.quiz.correctIndex] &&
              raw.explanations[raw.correctIndex] ===
                result.quiz.explanations[result.quiz.correctIndex];
            if (!integrity) throw new Error('Shuffle integrity failed');
          }
          return {
            slot: i,
            requestedDifficulty: difficulty,
            returnedDifficulty: result.returnedDifficulty,
            persistedDifficulty: result.mission?.quiz?.difficulty ?? null,
            persisted: !!result.mission,
            reviewStatus: result.mission?.quiz?.reviewStatus ?? null,
            missionId: result.mission?.id ?? null,
            generationId: result.generationId,
            quiz: result.quiz,
            shuffleIntegrity: integrity,
            reason: result.reason,
            calls: result.audit,
            recordedAt: new Date().toISOString(),
          };
        }),
      );
      records.push(...batch);
      writeFileSync(resolve(output, 'quizzes-reais.json'), JSON.stringify(records, null, 2));
      slot += batch.length;
      console.log(
        `${difficulty}: ${records.filter((r) => r.requestedDifficulty === difficulty && r.persisted === true).length}/20 persisted`,
      );
      if (batch.some((r) => r.calls.some((c) => [401, 403, 429].includes(c.status))))
        throw new Error('Credential/quota failure; stopped bounded experiment');
    }
  }
  const persisted = records.filter((r) => r.persisted);
  const positions = [0, 1, 2, 3].map((index) => ({
    alternative: 'ABCD'[index],
    count: persisted.filter((r) => (r.quiz as { correctIndex: number }).correctIndex === index)
      .length,
  }));
  const summary = {
    date: '2026-10-13',
    actualCalls: records.flatMap((r) => r.calls as unknown[]).length,
    generated: records.length,
    persisted: persisted.length,
    pending: persisted.filter((r) => r.reviewStatus === 'PENDING').length,
    difficulties: difficulties.map((d) => ({
      difficulty: d,
      requested: records.filter((r) => r.requestedDifficulty === d).length,
      persisted: persisted.filter((r) => r.persistedDifficulty === d).length,
    })),
    positions: positions.map((p) => ({ ...p, percentage: (p.count / persisted.length) * 100 })),
    integrityFailures: persisted.filter((r) => r.shuffleIntegrity !== true).length,
  };
  writeFileSync(resolve(output, 'experimento-resumo.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
