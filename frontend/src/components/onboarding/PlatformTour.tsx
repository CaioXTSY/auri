import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  CLOSE_MOBILE_TOUR_MENU_EVENT,
  getPlatformTourKey,
  OPEN_MOBILE_TOUR_MENU_EVENT,
  OPEN_TOUR_EVENT,
  PLATFORM_TOUR_STATE_CHANGED_EVENT,
  type PlatformTourRole,
} from './platform-tour-events';
import { Button } from '@/components/ui/button';
import { ModalDialog } from '@/components/ui/modal-dialog';

type UserRole = PlatformTourRole;

interface PlatformTourProps {
  userId: string | undefined;
  role: UserRole | undefined;
  disabled?: boolean;
}

const MOBILE_BREAKPOINT = 768;

const introCopy: Record<UserRole, { title: string; description: string }> = {
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

const desktopCommonSteps = [
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

const desktopStepsByRole: Record<UserRole, DriveStep[]> = {
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
    ...desktopCommonSteps,
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
    ...desktopCommonSteps,
  ],
  ADMIN: [
    step(
      '[data-tour="admin-overview"]',
      'Painel admin',
      'Este é o ponto de partida para acompanhar o sistema.',
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
    ...desktopCommonSteps,
  ],
};

const mobileCommonSteps = [
  step(
    '[data-tour="dashboard-greeting"]',
    'Seu painel',
    'Aqui fica a visão principal da conta, com o resumo do seu espaço na plataforma.',
    'bottom',
  ),
  step(
    '[data-tour="notifications"]',
    'Notificações',
    'Avisos novos aparecem aqui e você pode abrir tudo sem sair da página.',
    'left',
  ),
  step('[data-tour="mobile-menu"]', 'Menu', 'Este botão abre os atalhos principais do painel no celular.', 'right'),
];

const mobileIntroStepsByRole: Record<UserRole, DriveStep[]> = {
  ALUNO: [
    ...mobileCommonSteps,
  ],
  PROFESSOR: [
    ...mobileCommonSteps,
    step(
      '[data-tour="teacher-new-class"]',
      'Nova turma',
      'Se este botão estiver visível, você já pode criar sua próxima turma direto daqui.',
      'bottom',
    ),
  ],
  ADMIN: [...mobileCommonSteps],
};

const mobileMenuStepsByRole: Record<UserRole, DriveStep[]> = {
  ALUNO: [
    step('[data-tour="student-classes"]', 'Turmas', 'Entre em turma, acompanhe a sala e volte aqui quando precisar.', 'right'),
    step('[data-tour="student-missions"]', 'Missões', 'Aqui ficam as atividades e quizzes que você precisa responder.', 'right'),
    step('[data-tour="student-posts"]', 'Postagens', 'Use esta área para acompanhar avisos e discussões das turmas.', 'right'),
    step('[data-tour="student-achievements"]', 'Gamificação', 'Veja suas conquistas, ranking e progresso geral.', 'right'),
    step('[data-tour="settings"]', 'Configurações', 'Perfil, senha e o botão para abrir este guia de novo ficam aqui.', 'right'),
  ],
  PROFESSOR: [
    step('[data-tour="professor-classes"]', 'Turmas', 'Gerencie suas turmas, alunos e códigos de entrada por aqui.', 'right'),
    step('[data-tour="professor-posts"]', 'Postagens', 'Publique avisos e materiais sem sair do painel.', 'right'),
    step('[data-tour="settings"]', 'Configurações', 'Perfil, senha e atalhos do guia continuam aqui.', 'right'),
  ],
  ADMIN: [
    step('[data-tour="admin-users"]', 'Usuários', 'Gerencie contas e permissões direto deste menu.', 'right'),
    step('[data-tour="admin-classes"]', 'Turmas', 'Consulte e organize as turmas cadastradas.', 'right'),
    step('[data-tour="admin-missions"]', 'Missões', 'Acompanhe ou crie missões pelo painel admin.', 'right'),
    step('[data-tour="settings"]', 'Configurações', 'Se precisar rever o guia, o atalho fica aqui.', 'right'),
  ],
};

const isMobileViewport = () => window.innerWidth < MOBILE_BREAKPOINT;

const isElementVisible = (selector: string) => {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
};

const getAvailableSteps = (role: UserRole, mobile: boolean) => {
  const source = mobile ? mobileIntroStepsByRole[role] : desktopStepsByRole[role];

  return source.filter((tourStep) => {
    if (typeof tourStep.element !== 'string') return true;
    return isElementVisible(tourStep.element);
  });
};

const getAvailableMobileMenuSteps = (role: UserRole) =>
  mobileMenuStepsByRole[role].filter((tourStep) => {
    if (typeof tourStep.element !== 'string') return true;
    return isElementVisible(tourStep.element);
  });

const startTour = (role: UserRole, onClose: () => void) => {
  const mobile = isMobileViewport();
  const closeMobileMenuIfNeeded = () => {
    if (mobile) {
      window.dispatchEvent(new Event(CLOSE_MOBILE_TOUR_MENU_EVENT));
    }
  };

  const runDriver = (steps: DriveStep[], handleDone: () => void) => {
    const instance = driver({
      steps,
      animate: true,
      allowClose: true,
      overlayOpacity: 0.62,
      stagePadding: mobile ? 6 : 8,
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
        closeMobileMenuIfNeeded();
        onClose();
        instance.destroy();
      },
      onDestroyed: handleDone,
    });

    instance.drive();
  };

  if (!mobile) {
    const availableSteps = getAvailableSteps(role, false);
    if (availableSteps.length === 0) return;

    runDriver(availableSteps, onClose);
    return;
  }

  const introSteps = getAvailableSteps(role, true);
  const menuSteps = () => getAvailableMobileMenuSteps(role);

  const startMenuPhase = () => {
    window.dispatchEvent(new Event(OPEN_MOBILE_TOUR_MENU_EVENT));

    window.setTimeout(() => {
      const availableMenuSteps = menuSteps();

      if (availableMenuSteps.length === 0) {
        closeMobileMenuIfNeeded();
        onClose();
        return;
      }

      runDriver(availableMenuSteps, () => {
        closeMobileMenuIfNeeded();
        onClose();
      });
    }, 320);
  };

  if (introSteps.length === 0) {
    startMenuPhase();
    return;
  }

  runDriver(introSteps, startMenuPhase);
};

export const PlatformTour = ({ userId, role, disabled = false }: PlatformTourProps) => {
  const introShownKeyRef = useRef<string | null>(null);
  const disabledRef = useRef(disabled);
  const [showIntro, setShowIntro] = useState(false);

  const tourKey = useMemo(() => {
    if (!userId || !role) return null;
    return getPlatformTourKey(userId, role);
  }, [role, userId]);

  const intro = role ? introCopy[role] : null;

  const markCompleted = useCallback(() => {
    if (!tourKey) return;
    localStorage.setItem(tourKey, 'completed');
    window.dispatchEvent(
      new CustomEvent(PLATFORM_TOUR_STATE_CHANGED_EVENT, { detail: { tourKey } }),
    );
  }, [tourKey]);

  const markDismissed = useCallback(() => {
    if (!tourKey) return;
    localStorage.setItem(tourKey, 'dismissed');
    window.dispatchEvent(
      new CustomEvent(PLATFORM_TOUR_STATE_CHANGED_EVENT, { detail: { tourKey } }),
    );
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
    <ModalDialog
      open={showIntro && !disabled}
      title={intro?.title ?? 'Conheça a plataforma'}
      description={intro?.description ?? 'Eu te mostro os pontos principais do painel.'}
      onClose={() => {
        markDismissed();
        setShowIntro(false);
      }}
      panelClassName="max-w-lg"
      initialFocusSelector="[data-tour-dismiss]"
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 text-slate-700"
            data-tour-dismiss
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
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-accent-400">
            <Compass className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Guia inicial
            </p>
          </div>
        </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-brand-900 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Leva menos de um minuto.</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Se preferir, você pode fechar agora e abrir esse guia depois em Configurações.
                </p>
              </div>
            </div>
          </div>
      </div>
    </ModalDialog>
  );
};
