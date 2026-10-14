import '../test/docker-wsl-bridge.cjs';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { runDocker } from '../src/worker/docker-runner';

type RecordQuiz = {
  missionId: string;
  persisted: boolean;
  quiz: { question: string; options: string[]; correctIndex: number; explanations: string[] };
};
const filename = process.env.TCC_QUIZ_FILE || 'quizzes-reais.json';
const records: RecordQuiz[] = JSON.parse(
  readFileSync(resolve(__dirname, '../../evidencias-tcc', filename), 'utf8'),
);
const clean = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/["'`]/g, '')
    .replace(/\s*([[\],:])\s*/g, '$1')
    .trim();
function predicted(option: string) {
  return clean(
    option
      .replace(
        /^(?:a saída (?:será|é)|o resultado (?:será|é)|será impresso|imprime|será)\s*:?\s*/i,
        '',
      )
      .replace(/\.$/, ''),
  );
}
async function execute(record: RecordQuiz) {
  const blocks = [
    ...record.quiz.question.matchAll(/```(python|py|javascript|js)\s*\n([\s\S]*?)```/gi),
  ];
  if (blocks.length !== 1)
    return {
      missionId: record.missionId,
      classification: 'NOT_EXECUTED',
      reason: 'No single clearly identified runnable Python/JavaScript block',
    };
  const language = blocks[0][1].toLowerCase(),
    code = blocks[0][2];
  const python = ['python', 'py'].includes(language);
  const result = await runDocker({
    image: python ? 'python:3.12-alpine' : 'node:20-alpine',
    command: [python ? 'python' : 'node', python ? '-c' : '-e', code],
    timeoutMs: 2000,
    startupGraceMs: 12000,
    memoryMb: 128,
    cpus: '0.5',
    maxOutputBytes: 4096,
    env: [],
  });
  const output = clean(result.stdout);
  const errorType = result.stderr.match(
    /\b(TypeError|IndexError|ValueError|NameError|SyntaxError|ReferenceError|ZeroDivisionError|RangeError)\b/,
  )?.[1];
  const matchingOptions = record.quiz.options.flatMap((option, i) => {
    const match =
      result.status === 'ACCEPTED'
        ? predicted(option) === output
        : result.status === 'RUNTIME_ERROR' && !!errorType && option.includes(errorType);
    return match ? [i] : [];
  });
  const classification =
    matchingOptions.length > 1
      ? 'POSSIBLE_MULTIPLE_ANSWERS'
      : matchingOptions.length === 0
        ? 'INCONCLUSIVE'
        : matchingOptions[0] === record.quiz.correctIndex
          ? 'OUTPUT_MATCHES_KEY'
          : 'OUTPUT_KEY_MISMATCH';
  return {
    missionId: record.missionId,
    language,
    code,
    correctIndex: record.quiz.correctIndex,
    correctOption: record.quiz.options[record.quiz.correctIndex],
    correctExplanation: record.quiz.explanations[record.quiz.correctIndex],
    ...result,
    matchingOptions,
    classification,
    limitations:
      'Exact normalized output/error matching only; neither conceptual correctness nor all explanations are proved.',
  };
}
async function main() {
  const input = records.filter((r) => r.persisted);
  const results: Awaited<ReturnType<typeof execute>>[] = [];
  for (let i = 0; i < input.length; i += 3)
    results.push(...(await Promise.all(input.slice(i, i + 3).map(execute))));
  const counts = results.reduce<Record<string, number>>(
    (sum, r) => ({ ...sum, [r.classification]: (sum[r.classification] || 0) + 1 }),
    {},
  );
  const out = filename.replace('.json', '-execucao.json');
  writeFileSync(
    resolve(__dirname, '../../evidencias-tcc', out),
    JSON.stringify(
      {
        filename,
        containers: {
          network: 'none',
          readonly: true,
          memoryMb: 128,
          cpus: 0.5,
          pids: 64,
          unprivileged: true,
          hostMounts: false,
        },
        counts,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(counts));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
