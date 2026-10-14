export interface DailyQuizPromptParams {
  difficulty: string;
  languageHint: string;
  suggestedTopic: string;
  recentQuizzes: Array<{ title: string; topic: string; language: string | null }>;
}

const JSON_SCHEMA = `{
  "title": "Título curto e instigante",
  "question": "Enunciado claro com bloco de código se necessário",
  "difficulty": "FACIL" | "MEDIO" | "DIFICIL",
  "options": ["Texto completo da alternativa 1", "Texto completo da alternativa 2", "Texto completo da alternativa 3", "Texto completo da alternativa 4"],
  "correctIndex": 2,
  "explanations": ["Por que a alternativa 1 está correta ou errada", "Por que a alternativa 2 está correta ou errada", "Por que a alternativa 3 está correta ou errada", "Por que a alternativa 4 está correta ou errada"]
}`;

export const DAILY_QUIZ_SYSTEM_PROMPT =
  'Você é um Professor de Ciência da Computação especialista em semântica de linguagens de programação. ' +
  'Seu objetivo é criar questões de prova rigorosas e tecnicamente impecáveis. ' +
  'Você nunca ignora erros de tipo ou exceções de runtime.';

export const DAILY_QUIZ_VALIDATION_SYSTEM_PROMPT =
  'Você é um revisor técnico rigoroso de questões de programação. ' +
  'Seu trabalho é verificar se uma questão tem exatamente uma resposta correta, sem ambiguidade técnica.';

export function buildDailyQuizUserPrompt(params: DailyQuizPromptParams): string {
  const { difficulty, languageHint, suggestedTopic, recentQuizzes } = params;

  const recentBlock =
    recentQuizzes.length > 0
      ? [
          'QUESTÕES RECENTES (NÃO REPITA estes temas, títulos ou estruturas de código):',
          ...recentQuizzes.map(
            (q, i) => `  ${i + 1}. [${q.language ?? '?'}] ${q.title} — ${q.topic}`,
          ),
          '',
        ].join('\n')
      : '';

  return [
    'Gere um quiz diário de programação em português para alunos de graduação em computação.',
    `Nível alvo: ${difficulty}.`,
    'Retorne exatamente a dificuldade solicitada. FACIL: aplicação direta de um conceito; MEDIO: combinação de conceitos e rastreamento de fluxo; DIFICIL: raciocínio em múltiplas etapas, invariantes ou análise de complexidade.',
    `LINGUAGEM PREFERIDA para esta questão (escolha uma): ${languageHint}.`,
    `TÓPICO SUGERIDO (use este ou algo igualmente distinto dos recentes): ${suggestedTopic}.`,
    '',
    recentBlock,
    'FOCO: Raciocínio lógico, análise de fluxo de execução, depuração e semântica de linguagens.',
    'REGRAS TÉCNICAS CRÍTICAS:',
    '1. PRECISÃO SEMÂNTICA: Se o código fornecido resultar em erro (TypeError, SyntaxError, ReferenceError, etc.), a resposta correta DEVE ser o erro correspondente.',
    '2. SEM ALUCINAÇÃO: Não invente saídas para códigos que falham. Analise rigorosamente os tipos e a sintaxe.',
    '3. EVITE AMBIGUIDADE: Não use comportamento indefinido, dependente de implementação, dependente de versão ou de ambiente. Se uma linguagem tiver versões com diferenças relevantes, declare explicitamente a versão.',
    '4. RESPOSTA ÚNICA: Exatamente uma alternativa deve estar correta. As outras três devem ser inequivocamente incorretas.',
    '5. AUTOVERIFICAÇÃO: Antes de responder, resolva mentalmente o código, confira tipos, escopo, ordem de execução e exceções. Só então preencha correctIndex.',
    '6. VARIEDADE OBRIGATÓRIA: A questão DEVE ser sobre um tópico diferente de todos os listados acima. Não use fatorial, soma de tipos mistos nem qualquer exemplo já citado.',
    '7. FORMATO: Retorne apenas JSON válido no formato exato:',
    JSON_SCHEMA,
    'REGRAS DE FORMATAÇÃO:',
    '- Exatamente 4 alternativas, cada uma com o texto completo da resposta (nunca apenas "A", "B", "C" ou "D").',
    '- correctIndex é um inteiro de 0 a 3, calculado após resolver a questão. O número no exemplo de formato é apenas ilustrativo.',
    '- Explicações devem ser educativas e detalhadas (mínimo 15 palavras cada).',
    '- Não mencione letras, números ou ordinais das alternativas nas explicações (primeira, segunda, terceira, quarta); explique o conteúdo de cada opção.',
    '- Não revele a resposta em comentários de código ou no enunciado.',
    '- Não use markdown fora do JSON.',
    '- Se usar código na pergunta, use blocos formatados com \\n.',
  ].join('\n');
}

export function buildDailyQuizValidationPrompt(quiz: {
  title: string;
  question: string;
  difficulty: string;
  options: string[];
  correctIndex: number;
  explanations: string[];
}): string {
  return [
    'Valide tecnicamente o quiz abaixo.',
    'Resolva a questão de forma independente e determine correctIndex. O gabarito proposto foi omitido. Depois examine TODAS as explicações: uma opção incorreta não pode ser descrita como correta.',
    '',
    'Critérios para aprovar:',
    '- O enunciado precisa ser claro e sem ambiguidade.',
    '- Deve haver exatamente uma alternativa correta.',
    '- Retorne o índice da alternativa que você determinou como realmente correta, sem assumir que as explicações fornecidas são verdadeiras.',
    '- As explicações precisam ser coerentes com a resposta correta.',
    '- Reprove pistas de resposta em comentários e alternativas semanticamente equivalentes.',
    '- Avalie a dificuldade preliminarmente: FACIL, MEDIO ou DIFICIL; indique divergências em reason. Isso não substitui revisão pedagógica humana.',
    '- Reprove se houver comportamento indefinido, dependente de implementação, dependente de versão não declarada, ou se a saída/erro do código estiver incorreta.',
    '',
    'Retorne apenas JSON válido neste formato:',
    '{',
    '  "isValid": true,',
    '  "correctIndex": 0,',
    '  "estimatedDifficulty": "FACIL ou MEDIO ou DIFICIL",',
    '  "reason": "Resumo curto da verificação técnica"',
    '}',
    '',
    'Quiz:',
    JSON.stringify({ title: quiz.title, question: quiz.question, difficulty: quiz.difficulty, options: quiz.options, explanations: quiz.explanations }, null, 2),
  ].join('\n');
}

export const DAILY_QUIZ_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C', 'C++'] as const;

export const DAILY_QUIZ_TOPICS = [
  'escopo de variáveis',
  'closures',
  'herança e polimorfismo',
  'estruturas de dados (lista, pilha, fila, árvore)',
  'complexidade de algoritmos (Big-O)',
  'ponteiros e gerenciamento de memória',
  'concorrência e threads',
  'expressões regulares',
  'recursão com memoização',
  'manipulação de strings',
  'operadores bit a bit',
  'tratamento de exceções',
  'programação funcional (map/filter/reduce)',
  'generics e tipos parametrizados',
  'algoritmos de ordenação',
  'busca binária',
  'grafos (BFS/DFS)',
  'hashing e colisões',
] as const;
