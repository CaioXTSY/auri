import 'reflect-metadata';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaService } from '../src/prisma/prisma.service';
import { GeneratedQuiz, quizWarnings } from '../src/modules/missions/quiz-quality';

type Entry = { persisted: boolean; missionId: string; generationId: string; quiz: GeneratedQuiz };
const dir = resolve(__dirname, '../../evidencias-tcc');
const entries: Entry[] = JSON.parse(readFileSync(resolve(dir, 'quizzes-reais.json'), 'utf8'));
// Identified from actual isolated executions and examination of the full question.
// These are technical findings by an AI assistant, never human pedagogical verdicts.
const executionFindings: Record<string, string> = {
  '7f3d1668-2d0c-4a0a-88e4-35d1d1737108':
    'Python printed 1010101010 without TypeError. None of the options gives the actual output; key and explanations wrongly deny string repetition.',
  '58c09147-0e50-452b-aa1f-3c204816843a':
    'Python printed 50 5555555555 without TypeError. None of the options gives the actual output; the keyed TypeError is incorrect.',
  'e8aa8278-83a3-4f90-b213-160ea62e046d':
    'Python printed 40.0, whereas the key says 20.0. The explanation uses a denominator not present in the code; no option gives 40.0.',
  '5967b803-c7d5-41f3-a8cc-f165bab5346b':
    'Python printed OACAMARGORP, whereas the key says OACIMARGORP. No option gives the actual output; explanation also refers to positions.',
  '7898d568-c345-451c-bcf4-f25ecc639e43':
    'JavaScript printed 10 without error for the provided four-element array. The question presupposes an error and selects conditional stack overflow for a different input size; the actual output is option A.',
  'f630bc71-e9d1-4183-a10e-726c50c9bb7b':
    'Python printed 10.0, whereas the key says 15.0. The fourth option gives the actual output; the explanation incorrectly evaluates 30/3 as 15.',
};
async function main() {
  const database = process.env.DATABASE_URL || '';
  if (!/^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_/.test(database))
    throw new Error('Isolated evaluation database required');
  const prisma = new PrismaService({ datasources: { db: { url: database } } });
  const seen = new Map<string, string>();
  const findings: Array<{
    missionId: string;
    title: string;
    flags: string[];
    executionFinding: string | null;
    duplicateOf: string | null;
  }> = [];
  try {
    for (const entry of entries.filter((r) => r.persisted)) {
      const flags = quizWarnings(entry.quiz);
      const executionFinding = executionFindings[entry.missionId] || null;
      const normalized = entry.quiz.question.normalize('NFKC').trim().replace(/\s+/g, ' ');
      const duplicateOf = seen.get(normalized) || null;
      if (!duplicateOf) seen.set(normalized, entry.missionId);
      if (executionFinding) flags.push('CODE_EXECUTION_KEY_MISMATCH');
      if (duplicateOf) flags.push('REPEATED_QUESTION');
      if (!flags.length) continue;
      const quiz = await prisma.missionQuiz.findUniqueOrThrow({
        where: { missionId: entry.missionId },
        include: { aiGeneration: true },
      });
      if (quiz.aiGeneration?.type !== 'QUIZ_EVALUATION')
        throw new Error('Refusing to modify non-evaluation quiz');
      if (!['PENDING', 'AUTO_REJECTED'].includes(quiz.reviewStatus))
        throw new Error('Refusing to overwrite an authorized reviewer decision');
      await prisma.missionQuiz.update({
        where: { id: quiz.id },
        data: {
          reviewStatus: 'AUTO_REJECTED',
          reviewedById: null,
          reviewedAt: new Date(),
          qualityWarnings: flags,
          reviewReason: `Technical automated/AI-assisted post-audit; no human pedagogical review. ${flags.join(', ')}. ${executionFinding || ''}${duplicateOf ? ' Duplicate of ' + duplicateOf : ''}`,
        },
      });
      findings.push({
        missionId: entry.missionId,
        title: entry.quiz.title,
        flags,
        executionFinding,
        duplicateOf,
      });
    }
    const summary = {
      actor: 'Automated technical audit and Codex-assisted inspection, not a human teacher',
      humanReviews: 0,
      analyzed: 60,
      automaticRejections: findings.length,
      remainingPending: 60 - findings.length,
      executionKeyMismatches: Object.keys(executionFindings).length,
      positionReferenceCandidates: findings.filter((f) =>
        f.flags.includes('EXPLICACAO_REFERENCIA_POSICAO'),
      ).length,
      duplicateQuestions: findings.filter((f) => f.flags.includes('REPEATED_QUESTION')).length,
      findings,
    };
    writeFileSync(
      resolve(dir, 'revisao-tecnica-pos-geracao.json'),
      JSON.stringify(summary, null, 2),
    );
    console.log(JSON.stringify(summary));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
