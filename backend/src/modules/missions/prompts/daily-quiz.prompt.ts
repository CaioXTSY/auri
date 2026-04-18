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
  "correctIndex": 0,
  "explanations": ["Por que a alternativa 1 está correta ou errada", "Por que a alternativa 2 está correta ou errada", "Por que a alternativa 3 está correta ou errada", "Por que a alternativa 4 está correta ou errada"]
}`;

export const DAILY_QUIZ_SYSTEM_PROMPT =
  'Você é um Professor de Ciência da Computação especialista em semântica de linguagens de programação. ' +
  'Seu objetivo é criar questões de prova rigorosas e tecnicamente impecáveis. ' +
  'Você nunca ignora erros de tipo ou exceções de runtime.';

export function buildDailyQuizUserPrompt(params: DailyQuizPromptParams): string {
  const { difficulty, languageHint, suggestedTopic, recentQuizzes } = params;

  const recentBlock =
    recentQuizzes.length > 0
      ? [
          'QUESTÕES RECENTES (NÃO REPITA estes temas, títulos ou estruturas de código):',
          ...recentQuizzes.map((q, i) => `  ${i + 1}. [${q.language ?? '?'}] ${q.title} — ${q.topic}`),
          '',
        ].join('\n')
      : '';

  return [
    'Gere um quiz diário de programação em português para alunos de graduação em computação.',
    `Nível alvo: ${difficulty}.`,
    `LINGUAGEM PREFERIDA para esta questão (escolha uma): ${languageHint}.`,
    `TÓPICO SUGERIDO (use este ou algo igualmente distinto dos recentes): ${suggestedTopic}.`,
    '',
    recentBlock,
    'FOCO: Raciocínio lógico, análise de fluxo de execução, depuração e semântica de linguagens.',
    'REGRAS TÉCNICAS CRÍTICAS:',
    '1. PRECISÃO SEMÂNTICA: Se o código fornecido resultar em erro (TypeError, SyntaxError, ReferenceError, etc.), a resposta correta DEVE ser o erro correspondente.',
    '2. SEM ALUCINAÇÃO: Não invente saídas para códigos que falham. Analise rigorosamente os tipos e a sintaxe.',
    '3. VARIEDADE OBRIGATÓRIA: A questão DEVE ser sobre um tópico diferente de todos os listados acima. Não use fatorial, soma de tipos mistos nem qualquer exemplo já citado.',
    '4. FORMATO: Retorne apenas JSON válido no formato exato:',
    JSON_SCHEMA,
    'REGRAS DE FORMATAÇÃO:',
    '- Exatamente 4 alternativas, cada uma com o texto completo da resposta (nunca apenas "A", "B", "C" ou "D").',
    '- Explicações devem ser educativas e detalhadas (mínimo 15 palavras cada).',
    '- Não use markdown fora do JSON.',
    '- Se usar código na pergunta, use blocos formatados com \\n.',
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
