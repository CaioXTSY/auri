import 'reflect-metadata';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import * as ts from 'typescript';
import { createRequire } from 'module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';
import { PointsService } from '../src/modules/gamification/points.service';
import { RankingService } from '../src/modules/gamification/ranking.service';
import { GamificationService } from '../src/modules/gamification/gamification.service';
import { normalizeGeneratedQuiz } from '../src/modules/missions/quiz-quality';

const base = '4fdd914a07fdca80c70dd43af47f48fb8eb4a38c';
function original(relative: string, className: string) {
  const source = execFileSync('git', ['show', `${base}:backend/src/${relative}`], {
    encoding: 'utf8',
  });
  const Module = createRequire(__filename)('module');
  const filename = resolve(__dirname, '../src', relative);
  const module = new Module(filename, moduleParent());
  module.filename = filename;
  module.paths = Module._nodeModulePaths(dirname(filename));
  module._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        experimentalDecorators: true,
      },
    }).outputText,
    filename,
  );
  return module.exports[className];
}
function moduleParent() {
  return module;
}
async function main() {
  const database = process.env.DATABASE_URL || '';
  if (!/^mysql:\/\/[^@]*@(?:127\.0\.0\.1|localhost):\d+\/auri_tcc_/.test(database))
    throw new Error('Isolated database required');
  const prisma = new PrismaService({ datasources: { db: { url: database } } });
  const ids: string[] = [];
  let classId = '';
  try {
    const student = await prisma.user.create({
      data: {
        email: `before-${Date.now()}@example.invalid`,
        name: 'Synthetic before/after student',
        password: 'unused',
        role: 'ALUNO',
      },
    });
    ids.push(student.id);
    const staff = await prisma.user.create({
      data: {
        email: `staff-${Date.now()}@example.invalid`,
        name: 'Synthetic staff',
        password: 'unused',
        role: 'ADMIN',
      },
    });
    ids.push(staff.id);
    const classroom = await prisma.class.create({
      data: { name: 'Before/after isolated', year: 2026, createdById: staff.id },
    });
    classId = classroom.id;
    await prisma.classStudent.create({ data: { userId: student.id, classId } });
    const OldPoints = original('modules/gamification/points.service.ts', 'PointsService');
    const OldRanking = original('modules/gamification/ranking.service.ts', 'RankingService');
    const OldGamification = original(
      'modules/gamification/gamification.service.ts',
      'GamificationService',
    );
    const oldPoints = new OldPoints(prisma),
      oldRanking = new OldRanking(prisma);
    const levels = { checkLevelUp: async (): Promise<number | null> => null },
      achievements = { checkPointsAchievements: async (): Promise<void> => undefined };
    const old = new OldGamification(prisma, oldPoints, levels, achievements, oldRanking);
    await oldPoints.addPoints(student.id, 475, 'TCC_BASE', 'Synthetic');
    await oldPoints.addPoints(staff.id, 9999, 'TCC_BASE', 'Synthetic');
    await oldRanking.updateGlobalRanking();
    await oldRanking.updateClassRanking(classId);
    await old.addPoints(student.id, 5, 'MISSAO', 'Synthetic', 'tcc-before-mission');
    const before = {
      xp: await oldPoints.getUserTotalPoints(student.id),
      global: (await oldRanking.getUserRankingPosition(student.id, 'GLOBAL')).points,
      classroom: (await oldRanking.getUserRankingPosition(student.id, 'TURMA', classId)).points,
      visiblePosition: (await oldRanking.getRanking('GLOBAL')).find(
        (r: { userId: string }) => r.userId === student.id,
      ).position,
    };
    const current = new GamificationService(
      prisma,
      new PointsService(prisma),
      levels as never,
      achievements as never,
      new RankingService(prisma),
    );
    await current.refreshProgressionAfterPointsChange(student.id);
    const repaired = {
      xp: await current.getUserTotalPoints(student.id),
      global: (await current.getUserRankingPosition(student.id, 'GLOBAL')).points,
      classroom: (await current.getUserRankingPosition(student.id, 'TURMA', classId)).points,
      visiblePosition: (await current.getRanking('GLOBAL')).find((r) => r.userId === student.id)
        .position,
    };
    await current.addPoints(student.id, 5, 'MISSAO', 'Synthetic repeat', 'tcc-before-mission');
    const afterRepeat = await current.getUserTotalPoints(student.id);
    const OldGenerator = original(
      'modules/missions/quiz-generator.service.ts',
      'QuizGeneratorService',
    );
    const oldGenerator = new OldGenerator(prisma, new ConfigService({}));
    const malformed = {
      title: 'Synthetic quiz',
      question: 'Quanto é 2 + 2?',
      options: ['4', '4', '5', '6'],
      explanations: ['a', 'b', 'c', 'd'],
      correctIndex: null as null,
      difficulty: 'MEDIO',
    };
    const oldMalformed = oldGenerator.normalizeGeneratedQuiz(JSON.stringify(malformed), 'FACIL');
    let currentRejects = false;
    try {
      normalizeGeneratedQuiz(JSON.stringify(malformed), 'FACIL');
    } catch {
      currentRejects = true;
    }
    const result = {
      baseCommit: base,
      environment: 'isolated local MariaDB',
      externalCalls: 0,
      comparableRanking: { before, repaired, afterRepeat },
      structuralValidation: {
        beforeAccepted: true,
        beforeCorrectIndex: oldMalformed.correctIndex,
        beforeDifficulty: oldMalformed.difficulty,
        afterRejected: currentRejects,
      },
      limitations: [
        'Progression/achievement callbacks stubbed only in this comparison; full services separately tested in API integration suite.',
        'Historical AI records are not recreated by this synthetic comparison.',
      ],
    };
    const out = resolve(__dirname, '../../evidencias-tcc');
    mkdirSync(out, { recursive: true });
    writeFileSync(resolve(out, 'comparacao-before-after.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally {
    if (classId) await prisma.class.delete({ where: { id: classId } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
