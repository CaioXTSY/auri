import { PrismaClient, Difficulty, MissionType } from '@prisma/client';

const prisma = new PrismaClient();

const makeDate = (base: Date, offsetDays: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + offsetDays);
  return date;
};

const baseQuestions = [
  {
    title: 'Quiz Diário de Programação',
    question: 'Qual dos seguintes é um tipo de dado primitivo em JavaScript?',
    options: ['String', 'Array', 'Objeto', 'Função'],
    correctIndex: 0,
    explanations: [
      "A alternativa A está correta, pois 'String' é um tipo de dado primitivo em JavaScript que representa texto.",
      'A alternativa B está errada, pois Array é um tipo de dado não primitivo (objeto) que armazena múltiplos valores.',
      'A alternativa C está errada, pois Objeto também é um tipo de dado não primitivo que armazena pares de chave-valor.',
      'A alternativa D está errada, pois Função é um objeto em JavaScript e não um tipo de dado primitivo.',
    ],
  },
  {
    title: 'Algoritmos e Estruturas',
    question: 'Qual estrutura garante acesso FIFO (First In, First Out)?',
    options: ['Pilha', 'Fila', 'Árvore', 'Grafo'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois pilha segue LIFO.',
      'A alternativa B está correta, pois fila segue FIFO.',
      'A alternativa C está errada, pois árvore não impõe ordem FIFO.',
      'A alternativa D está errada, pois grafo não possui ordem FIFO.',
    ],
  },
  {
    title: 'Frontend Essencial',
    question: 'Qual tag HTML é semântica para o conteúdo principal?',
    options: ['<header>', '<main>', '<section>', '<aside>'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois header representa cabeçalho.',
      'A alternativa B está correta, pois main representa o conteúdo principal.',
      'A alternativa C está errada, pois section representa uma seção temática.',
      'A alternativa D está errada, pois aside representa conteúdo lateral.',
    ],
  },
  {
    title: 'Banco de Dados',
    question: 'Qual comando SQL é usado para recuperar dados?',
    options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    correctIndex: 0,
    explanations: [
      'A alternativa A está correta, pois SELECT consulta dados.',
      'A alternativa B está errada, pois INSERT insere dados.',
      'A alternativa C está errada, pois UPDATE atualiza dados.',
      'A alternativa D está errada, pois DELETE remove dados.',
    ],
  },
  {
    title: 'Python Básico',
    question: 'Qual função imprime algo no console em Python?',
    options: ['echo()', 'print()', 'console.log()', 'printf()'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois echo não é função padrão em Python.',
      'A alternativa B está correta, pois print imprime no console.',
      'A alternativa C está errada, pois console.log é do JavaScript.',
      'A alternativa D está errada, pois printf é do C.',
    ],
  },
  {
    title: 'TypeScript',
    question: 'Qual palavra-chave define um tipo literal union?',
    options: ['enum', 'type', 'interface', 'class'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois enum define conjunto enumerado.',
      'A alternativa B está correta, pois type pode criar union literals.',
      'A alternativa C está errada, pois interface define contratos.',
      'A alternativa D está errada, pois class define classes.',
    ],
  },
  {
    title: 'Redes',
    question: 'Qual protocolo é usado para transferir páginas web?',
    options: ['FTP', 'HTTP', 'SMTP', 'SSH'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois FTP é focado em transferência de arquivos.',
      'A alternativa B está correta, pois HTTP é o protocolo padrão da web.',
      'A alternativa C está errada, pois SMTP é usado para e-mails.',
      'A alternativa D está errada, pois SSH é usado para acesso seguro remoto.',
    ],
  },
  {
    title: 'Git',
    question: 'Qual comando cria um novo branch no Git?',
    options: ['git clone', 'git checkout -b', 'git pull', 'git merge'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois git clone clona um repositório.',
      'A alternativa B está correta, pois checkout -b cria e muda para o branch.',
      'A alternativa C está errada, pois git pull busca e integra mudanças.',
      'A alternativa D está errada, pois git merge combina branches.',
    ],
  },
  {
    title: 'Node.js',
    question: 'Qual objeto global permite acessar o sistema de arquivos?',
    options: ['http', 'fs', 'path', 'os'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois http lida com servidores e requisições.',
      'A alternativa B está correta, pois fs é o módulo de filesystem.',
      'A alternativa C está errada, pois path ajuda em caminhos.',
      'A alternativa D está errada, pois os fornece info do sistema.',
    ],
  },
  {
    title: 'CSS',
    question: 'Qual propriedade define a cor do texto?',
    options: ['background-color', 'border-color', 'color', 'font-style'],
    correctIndex: 2,
    explanations: [
      'A alternativa A está errada, pois background-color define o fundo.',
      'A alternativa B está errada, pois border-color define a borda.',
      'A alternativa C está correta, pois color define a cor do texto.',
      'A alternativa D está errada, pois font-style define estilo da fonte.',
    ],
  },
  {
    title: 'APIs',
    question: 'Qual método HTTP é usado para criar recursos?',
    options: ['GET', 'POST', 'PUT', 'DELETE'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois GET consulta dados.',
      'A alternativa B está correta, pois POST cria recursos.',
      'A alternativa C está errada, pois PUT normalmente substitui recursos.',
      'A alternativa D está errada, pois DELETE remove recursos.',
    ],
  },
  {
    title: 'Programação',
    question: 'Qual estrutura controla repetição até uma condição ser falsa?',
    options: ['if', 'for', 'switch', 'try'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois if é condicional.',
      'A alternativa B está correta, pois for é laço de repetição.',
      'A alternativa C está errada, pois switch é seleção múltipla.',
      'A alternativa D está errada, pois try é tratamento de erro.',
    ],
  },
  {
    title: 'Testes',
    question: 'Qual é o objetivo principal de um teste unitário?',
    options: ['Testar o sistema inteiro', 'Testar uma unidade isolada', 'Testar o banco de dados', 'Testar a UI'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois isso é teste de integração.',
      'A alternativa B está correta, pois teste unitário foca em unidades isoladas.',
      'A alternativa C está errada, pois isso é teste de banco.',
      'A alternativa D está errada, pois isso é teste de UI.',
    ],
  },
  {
    title: 'Segurança',
    question: 'Qual prática ajuda a proteger senhas armazenadas?',
    options: ['Salvar em texto puro', 'Hashing com sal', 'Enviar por email', 'Guardar em logs'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois é inseguro.',
      'A alternativa B está correta, pois hashing com sal protege as senhas.',
      'A alternativa C está errada, pois expõe a senha.',
      'A alternativa D está errada, pois logs não são seguros.',
    ],
  },
  {
    title: 'Banco de Dados II',
    question: 'Qual comando remove uma tabela inteira?',
    options: ['DROP TABLE', 'DELETE FROM', 'UPDATE', 'SELECT'],
    correctIndex: 0,
    explanations: [
      'A alternativa A está correta, pois DROP TABLE remove a tabela.',
      'A alternativa B está errada, pois DELETE FROM remove linhas.',
      'A alternativa C está errada, pois UPDATE altera linhas.',
      'A alternativa D está errada, pois SELECT consulta dados.',
    ],
  },
  {
    title: 'HTML',
    question: 'Qual tag representa uma lista não ordenada?',
    options: ['<ol>', '<ul>', '<li>', '<dl>'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois ol é lista ordenada.',
      'A alternativa B está correta, pois ul é lista não ordenada.',
      'A alternativa C está errada, pois li é item da lista.',
      'A alternativa D está errada, pois dl é lista de definição.',
    ],
  },
  {
    title: 'JavaScript',
    question: 'Qual método converte JSON em objeto?',
    options: ['JSON.parse()', 'JSON.stringify()', 'JSON.convert()', 'JSON.object()'],
    correctIndex: 0,
    explanations: [
      'A alternativa A está correta, pois JSON.parse converte string em objeto.',
      'A alternativa B está errada, pois JSON.stringify converte objeto em string.',
      'A alternativa C está errada, pois não existe JSON.convert.',
      'A alternativa D está errada, pois não existe JSON.object.',
    ],
  },
  {
    title: 'Estruturas de Dados',
    question: 'Qual estrutura é composta por pares chave-valor?',
    options: ['Array', 'Objeto', 'String', 'Number'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois array é lista indexada.',
      'A alternativa B está correta, pois objeto é chave-valor.',
      'A alternativa C está errada, pois string é texto.',
      'A alternativa D está errada, pois number é numérico.',
    ],
  },
  {
    title: 'Lógica',
    question: 'Qual operador lógico retorna verdadeiro se ambos forem verdadeiros?',
    options: ['||', '&&', '!', '=='],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois || é OR.',
      'A alternativa B está correta, pois && é AND.',
      'A alternativa C está errada, pois ! é NOT.',
      'A alternativa D está errada, pois == é comparação.',
    ],
  },
  {
    title: 'React',
    question: 'Qual hook gerencia estado local em componentes funcionais?',
    options: ['useEffect', 'useState', 'useMemo', 'useRef'],
    correctIndex: 1,
    explanations: [
      'A alternativa A está errada, pois useEffect lida com efeitos.',
      'A alternativa B está correta, pois useState gerencia estado.',
      'A alternativa C está errada, pois useMemo memoriza cálculos.',
      'A alternativa D está errada, pois useRef guarda referências.',
    ],
  },
];

const difficultyOptions: Difficulty[] = ['FACIL', 'MEDIO', 'DIFICIL'];
const pointsByDifficulty: Record<Difficulty, number> = {
  FACIL: 30,
  MEDIO: 60,
  DIFICIL: 100,
};

async function seedMissions() {
  console.log('🌱 Limpando todas as missões e criando 15 quizzes...');

  await prisma.missionQuizAttempt.deleteMany();
  await prisma.missionQuiz.deleteMany();
  await prisma.userMission.deleteMany();
  await prisma.mission.deleteMany();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const missions = Array.from({ length: 15 }).map((_, index) => {
    const difficulty = difficultyOptions[index % difficultyOptions.length];
    const points = pointsByDifficulty[difficulty];
    const question = baseQuestions[index % baseQuestions.length];
    const startDate = startOfDay;
    const endDate = endOfDay;

    return {
      title: `Quiz ${index + 1} • ${question.title}`,
      description: question.question,
      type: MissionType.DIARIA,
      points,
      startDate,
      endDate,
      quiz: {
        create: {
          title: question.title,
          question: question.question,
          difficulty,
          options: question.options,
          explanations: question.explanations,
          correctIndex: question.correctIndex,
        },
      },
    };
  });

  for (const mission of missions) {
    await prisma.mission.create({
      data: mission,
    });
  }

  console.log('✅ 15 quizzes criados com sucesso!');
}

seedMissions()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
