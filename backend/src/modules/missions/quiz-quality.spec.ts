import {
  GeneratedQuiz,
  normalizeGeneratedQuiz,
  quizWarnings,
  shuffleQuiz,
  validateQuizShape,
} from './quiz-quality';

const valid = (): GeneratedQuiz => ({
  title: 'Soma',
  question: 'Quanto é 2 + 2?',
  difficulty: 'FACIL',
  options: ['4', '3', '5', '6'],
  correctIndex: 0,
  explanations: [
    'Dois mais dois é quatro.',
    'Três não é a soma.',
    'Cinco é maior que a soma.',
    'Seis é maior que a soma.',
  ],
});
describe('Quiz structural validation and unbiased shuffle', () => {
  it.each(['FACIL', 'MEDIO', 'DIFICIL'] as const)(
    'preserves requested difficulty %s',
    (difficulty) => {
      expect(
        normalizeGeneratedQuiz(JSON.stringify({ ...valid(), difficulty }), difficulty).difficulty,
      ).toBe(difficulty);
    },
  );
  it.each([
    ['missing title', { title: '' }],
    ['missing question', { question: '' }],
    ['empty option', { options: ['4', '3', '', '6'] }],
    ['duplicate option', { options: ['4', ' 4 ', '5', '6'] }],
    ['case duplicate', { options: ['SIM', 'sim', '5', '6'] }],
    ['three options', { options: ['4', '3', '5'] }],
    ['invalid option type', { options: ['4', '3', {}, '6'] }],
    ['missing index', { correctIndex: undefined }],
    ['null index', { correctIndex: null }],
    ['string index', { correctIndex: '0' }],
    ['negative index', { correctIndex: -1 }],
    ['outside index', { correctIndex: 4 }],
    ['fraction index', { correctIndex: 1.2 }],
    ['empty explanation', { explanations: ['', 'x', 'y', 'z'] }],
    ['missing explanations', { explanations: undefined }],
    ['invalid difficulty', { difficulty: 'medium' }],
  ])('rejects %s', (_label, change) => {
    expect(() => validateQuizShape({ ...valid(), ...change } as GeneratedQuiz)).toThrow();
  });
  it('rejects malformed JSON and difficulty disagreement rather than silently replacing it', () => {
    expect(() => normalizeGeneratedQuiz('{', 'FACIL')).toThrow();
    expect(() => normalizeGeneratedQuiz(JSON.stringify(valid()), 'MEDIO')).toThrow();
  });
  it('preserves every option/explanation and correct answer across all 24 permutations', () => {
    const results = new Set<string>();
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 2; c++) {
          const choices = [a, b, c];
          const input = valid();
          const output = shuffleQuiz(input, () => choices.shift()!);
          results.add(output.options.join('|'));
          expect(output.options[output.correctIndex]).toBe('4');
          output.options.forEach((option, i) =>
            expect(output.explanations[i]).toBe(input.explanations[input.options.indexOf(option)]),
          );
          expect(input.options).toEqual(['4', '3', '5', '6']);
        }
    expect(results.size).toBe(24);
  });
  it('identifies warnings as suspicions for review', () => {
    expect(quizWarnings({ ...valid(), question: 'A resposta correta é A.\n# saída: 4' })).toEqual(
      expect.arrayContaining(['POSSIVEL_VAZAMENTO_GABARITO', 'COMENTARIO_PODE_REVELAR_RESPOSTA']),
    );
    expect(
      quizWarnings({ ...valid(), explanations: ['A alternativa A está correta', 'x', 'y', 'z'] }),
    ).toContain('EXPLICACAO_REFERENCIA_POSICAO');
    expect(
      quizWarnings({
        ...valid(),
        explanations: ['A primeira alternativa é correta', 'x', 'y', 'z'],
      }),
    ).toContain('EXPLICACAO_REFERENCIA_POSICAO');
    expect(
      quizWarnings({ ...valid(), explanations: ['x', 'Esta alternativa está correta', 'y', 'z'] }),
    ).toContain('POSSIVEL_EXPLICACAO_CONTRADITORIA');
  });
});
