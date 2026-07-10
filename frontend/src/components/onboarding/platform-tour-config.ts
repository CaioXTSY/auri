import type { PlatformTourRole } from './platform-tour-events';

export type PlatformTourIntro = { title: string; description: string };

export const platformTourIntroCopy: Record<PlatformTourRole, PlatformTourIntro> = {
  ALUNO: {
    title: 'Quer ver por onde começar?',
    description:
      'Eu te mostro de uma vez onde entrar em turma, responder missões, acompanhar progresso e ajustar sua conta.',
  },
  PROFESSOR: {
    title: 'Veja onde fica cada área principal',
    description:
      'Eu te mostro de uma vez onde criar turmas, acompanhar alunos, publicar avisos e ajustar sua conta.',
  },
  ADMIN: {
    title: 'Quer um resumo do painel admin?',
    description:
      'Eu te mostro onde ficam usuários, turmas, missões e os atalhos principais para gerenciar a plataforma.',
  },
};
