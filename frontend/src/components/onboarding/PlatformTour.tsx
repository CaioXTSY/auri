import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { OPEN_TOUR_EVENT } from './platform-tour-events';
import { Button } from '@/components/ui/button';

type UserRole = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

interface PlatformTourProps {
  userId: string | undefined;
  role: UserRole | undefined;
  disabled?: boolean;
}

const TOUR_VERSION = 'v1';

const introCopy: Record<UserRole, { title: string; description: string }> = {
  ALUNO: {
    title: 'Quer ver por onde começar?',
    description:
      'Eu te mostro de uma vez onde entrar em turma, responder missões, acompanhar progresso e ajustar sua conta.',
  },
  PROFESSOR: {
    title: 'Veja onde fica cada area principal',
    description:
      'Eu te mostro de uma vez onde criar turmas, acompanhar alunos, publicar avisos e ajustar sua conta.',
  },
  ADMIN: {
    title: 'Quer um resumo do painel admin?',
    description:
      'Eu te mostro onde ficam usuários, turmas, missões e os atalhos principais para gerenciar a plataforma.',
  },
};

const getTourKey = (userId: string, role: UserRole) =>
  `auri-platform-tour:${userId}:${role}:${TOUR_VERSION}`;

const step = (
  element: string,
  title: string,
  description: string,
  side: NonNullable<DriveStep['popover']>['side'] = 'right',
): DriveStep => ({
  element,
  popover: {
    title,
    description,
    side,
    align: 'start',
  },
});

const commonSteps = [
  step(
    '[data-tour="dashboard-greeting"]',
    'Seu painel',
    'Aqui fica o resumo da sua conta e do seu papel na plataforma.',
    'bottom',
  ),
  step(
    '[data-tour="notifications"]',
    'Notificações',
    'Avisos importantes aparecem aqui. Quando houver algo novo, o contador mostra a quantidade.',
    'bottom',
  ),
  step(
    '[data-tour="settings"]',
    'Configurações',
    'Use esta área para ajustar perfil, foto, senha e reabrir este guia.',
    'right',
  ),
];

const stepsByRole: Record<UserRole, DriveStep[]> = {
  ALUNO: [
    step(
      '[data-tour="student-overview"]',
      'Visão geral',
      'Comece por aqui para acompanhar sua jornada, XP e progresso.',
      'right',
    ),
    step(
      '[data-tour="daily-quiz"]',
      'Quiz diário',
      'Responda o quiz do dia para manter sequência e ganhar XP.',
      'bottom',
    ),
    step(
      '[data-tour="student-xp"]',
      'Nível e XP',
      'Este bloco mostra seu nível atual e o quanto falta para evoluir.',
      'left',
    ),
    step(
      '[data-tour="student-classes"]',
      'Turmas',
      'Quando o professor passar um código, é por aqui que você entra na turma e depois acompanha a sala.',
      'right',
    ),
    step(
      '[data-tour="student-missions"]',
      'Missões',
      'As missões disponíveis ficam aqui. Você abre o quiz ou conclui a atividade direto nessa área.',
      'right',
    ),
    step(
      '[data-tour="student-posts"]',
      'Postagens',
      'Acompanhe comunicados e participe das discussões das turmas.',
      'right',
    ),
    step(
      '[data-tour="student-achievements"]',
      'Gamificação',
      'Confira conquistas, ranking e evolução da sua participação.',
      'right',
    ),
    ...commonSteps,
  ],
  PROFESSOR: [
    step(
      '[data-tour="professor-overview"]',
      'Visão geral',
      'Acompanhe um resumo das suas turmas e alunos.',
      'right',
    ),
    step(
      '[data-tour="professor-classes"]',
      'Gerenciar turmas',
      'Aqui você revisa suas turmas, abre cada sala e acompanha alunos e códigos de entrada.',
      'right',
    ),
    step(
      '[data-tour="teacher-new-class"]',
      'Nova turma',
      'Crie a turma com nome, semestre e ano. Depois disso, a plataforma gera o código para os alunos entrarem.',
      'bottom',
    ),
    step(
      '[data-tour="professor-posts"]',
      'Postagens',
      'Publique comunicados e materiais para suas turmas.',
      'right',
    ),
    ...commonSteps,
  ],
  ADMIN: [
    step(
      '[data-tour="admin-overview"]',
      'Painel admin',
      'Este e o ponto de partida para acompanhar o sistema.',
      'right',
    ),
    step(
      '[data-tour="admin-users"]',
      'Usuários',
      'Gerencie alunos, professores e administradores.',
      'right',
    ),
    step(
      '[data-tour="admin-classes"]',
      'Turmas',
      'Consulte e organize as turmas cadastradas.',
      'right',
    ),
    step(
      '[data-tour="admin-missions"]',
      'Missões',
      'Crie e acompanhe missões disponíveis na plataforma.',
      'right',
    ),
    step(
      '[data-tour="admin-achievements"]',
      'Conquistas',
      'Configure recompensas e critérios de gamificação.',
      'right',
    ),
    step(
      '[data-tour="admin-ai-generations"]',
      'Gerações IA',
      'Audite conteúdos gerados pela IA.',
      'right',
    ),
    step(
      '[data-tour="admin-broadcast"]',
      'Broadcast',
      'Envie avisos para usuários quando necessário.',
      'right',
    ),
    ...commonSteps,
  ],
};

const getAvailableSteps = (role: UserRole) =>
  stepsByRole[role].filter((tourStep) => {
    if (typeof tourStep.element !== 'string') return true;
    return Boolean(document.querySelector(tourStep.element));
  });

const startTour = (role: UserRole, onClose: () => void) => {
  const availableSteps = getAvailableSteps(role);
  if (availableSteps.length === 0) return;

  const instance = driver({
    steps: availableSteps,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.62,
    stagePadding: 8,
    stageRadius: 14,
    popoverClass: 'auri-driver-popover',
    showProgress: true,
    nextBtnText: 'Próximo',
    prevBtnText: 'Voltar',
    doneBtnText: 'Concluir',
    onPopoverRender: (popover) => {
      popover.closeButton.textContent = 'Pular';
      popover.closeButton.setAttribute('aria-label', 'Pular guia');
    },
    onCloseClick: () => {
      onClose();
      instance.destroy();
    },
    onDestroyed: onClose,
  });

  instance.drive();
};

export const PlatformTour = ({ userId, role, disabled = false }: PlatformTourProps) => {
  const introShownKeyRef = useRef<string | null>(null);
  const disabledRef = useRef(disabled);
  const [showIntro, setShowIntro] = useState(false);

  const tourKey = useMemo(() => {
    if (!userId || !role) return null;
    return getTourKey(userId, role);
  }, [role, userId]);

  const intro = role ? introCopy[role] : null;

  const markCompleted = useCallback(() => {
    if (!tourKey) return;
    localStorage.setItem(tourKey, 'completed');
  }, [tourKey]);

  const markDismissed = useCallback(() => {
    if (!tourKey) return;
    localStorage.setItem(tourKey, 'dismissed');
  }, [tourKey]);

  const handleStartTour = useCallback(() => {
    if (!role) return;
    setShowIntro(false);
    startTour(role, markCompleted);
  }, [markCompleted, role]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    if (!role || !tourKey) return;

    const handleOpenTour = () => {
      setShowIntro(false);
      startTour(role, markCompleted);
    };

    window.addEventListener(OPEN_TOUR_EVENT, handleOpenTour);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, handleOpenTour);
  }, [markCompleted, role, tourKey]);

  useEffect(() => {
    if (!role || !tourKey || disabled) return;
    if (introShownKeyRef.current === tourKey) return;
    if (localStorage.getItem(tourKey)) return;

    const timeoutId = window.setTimeout(() => {
      if (disabledRef.current) return;
      if (localStorage.getItem(tourKey)) return;
      introShownKeyRef.current = tourKey;
      setShowIntro(true);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, role, tourKey]);

  if (!showIntro || disabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000000001] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]">
        <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-accent-400">
            <Compass className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Guia inicial
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-brand-900">
              {intro?.title ?? 'Conheça a plataforma'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {intro?.description ?? 'Eu te mostro os pontos principais do painel.'}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-900 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Leva menos de um minuto.
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Se preferir, você pode fechar agora e abrir esse guia depois em Configurações.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 text-slate-700"
              onClick={() => {
                markDismissed();
                setShowIntro(false);
              }}
            >
              Agora não
            </Button>
            <Button
              type="button"
              className="bg-brand-900 text-white hover:bg-brand-800"
              onClick={handleStartTour}
            >
              Começar guia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
