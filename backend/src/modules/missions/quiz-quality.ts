import { BadRequestException } from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { randomInt } from 'crypto';

export type GeneratedQuiz = {
  title: string;
  question: string;
  difficulty: Difficulty;
  options: string[];
  correctIndex: number;
  explanations: string[];
};

export function quizContentKey(question: string) {
  return question.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function validateQuizShape(quiz: GeneratedQuiz) {
  const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
  if (
    !nonempty(quiz.title) ||
    quiz.title.length > 200 ||
    !nonempty(quiz.question) ||
    quiz.question.length > 2000
  ) {
    throw new BadRequestException('Título ou enunciado inválido');
  }
  if (!['FACIL', 'MEDIO', 'DIFICIL'].includes(quiz.difficulty))
    throw new BadRequestException('Dificuldade inválida');
  if (!Array.isArray(quiz.options) || quiz.options.length !== 4 || !quiz.options.every(nonempty)) {
    throw new BadRequestException('Exatamente quatro alternativas não vazias são obrigatórias');
  }
  const canonical = quiz.options.map((s) =>
    s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR'),
  );
  if (new Set(canonical).size !== 4) throw new BadRequestException('Alternativas duplicadas');
  if (
    !Array.isArray(quiz.explanations) ||
    quiz.explanations.length !== 4 ||
    !quiz.explanations.every(nonempty)
  ) {
    throw new BadRequestException('Quatro explicações não vazias são obrigatórias');
  }
  if (
    typeof quiz.correctIndex !== 'number' ||
    !Number.isInteger(quiz.correctIndex) ||
    quiz.correctIndex < 0 ||
    quiz.correctIndex > 3
  ) {
    throw new BadRequestException('Gabarito inválido');
  }
}

export function normalizeGeneratedQuiz(content: string, requested: Difficulty): GeneratedQuiz {
  let parsed: GeneratedQuiz;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new BadRequestException('JSON malformado');
  }
  if (!parsed || typeof parsed !== 'object')
    throw new BadRequestException('Objeto de quiz ausente');
  validateQuizShape(parsed);
  if (parsed.difficulty !== requested)
    throw new BadRequestException(
      `Dificuldade divergente: solicitada ${requested}, retornada ${parsed.difficulty}`,
    );
  return parsed;
}

export function quizWarnings(quiz: GeneratedQuiz): string[] {
  const warnings: string[] = [];
  if (/(?:resposta|alternativa)\s+(?:correta\s*)?(?:é|:|=)\s*[A-D0-3]\b/i.test(quiz.question))
    warnings.push('POSSIVEL_VAZAMENTO_GABARITO');
  if (/(?:#|\/\/|\/\*)[^\n]*(?:saída|output|imprime|resultado|resposta)/i.test(quiz.question))
    warnings.push('COMENTARIO_PODE_REVELAR_RESPOSTA');
  if (
    quiz.explanations.some((s) =>
      /(?:alternativa|opção)\s+[A-D1-4]\b|(?:primeira|segunda|terceira|quarta)\s+(?:alternativa|opção)/i.test(
        s,
      ),
    )
  )
    warnings.push('EXPLICACAO_REFERENCIA_POSICAO');
  if (
    quiz.explanations.some(
      (s, i) =>
        i !== quiz.correctIndex &&
        /(?:esta|essa|a)\s+(?:alternativa|resposta)\s+(?:está|é)\s+correta\b/i.test(s),
    )
  )
    warnings.push('POSSIVEL_EXPLICACAO_CONTRADITORIA');
  return warnings;
}

// Keep each explanation paired with its option. Uniform Fisher–Yates, no quotas.
export function shuffleQuiz(
  quiz: GeneratedQuiz,
  nextInt: (max: number) => number = randomInt,
): GeneratedQuiz {
  validateQuizShape(quiz);
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = nextInt(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) throw new Error('Invalid shuffle index');
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...quiz,
    options: order.map((i) => quiz.options[i]),
    explanations: order.map((i) => quiz.explanations[i]),
    correctIndex: order.indexOf(quiz.correctIndex),
  };
}
