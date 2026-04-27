import { useEffect, useMemo, useRef } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { OPEN_TOUR_EVENT } from './platform-tour-events';

type UserRole = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

interface PlatformTourProps {
  userId: string | undefined;
  role: UserRole | undefined;
  disabled?: boolean;
}

const TOUR_VERSION = 'v1';

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
  step('[data-tour="dashboard-greeting"]', 'Seu painel', 'Aqui fica o resumo da sua conta e do seu papel na plataforma.', 'bottom'),
  step('[data-tour="notifications"]', 'Notificações', 'Avisos importantes aparecem aqui. Quando houver algo novo, o contador mostra a quantidade.', 'bottom'),
  step('[data-tour="settings"]', 'Configurações', 'Use esta área para ajustar perfil, foto, senha e reabrir este guia.', 'right'),
];

const stepsByRole: Record<UserRole, DriveStep[]> = {
  ALUNO: [
    step('[data-tour="student-overview"]', 'Visão geral', 'Comece por aqui para acompanhar sua jornada, XP e progresso.', 'right'),
    step('[data-tour="daily-quiz"]', 'Quiz diário', 'Responda o quiz do dia para manter sequência e ganhar XP.', 'bottom'),
    step('[data-tour="student-xp"]', 'Nível e XP', 'Este bloco mostra seu nível atual e o quanto falta para evoluir.', 'left'),
    step('[data-tour="student-classes"]', 'Turmas', 'Acesse as turmas em que você está matriculado ou entre em uma nova.', 'right'),
    step('[data-tour="student-missions"]', 'Missões', 'Veja atividades disponíveis e conclua missões para somar pontos.', 'right'),
    step('[data-tour="student-posts"]', 'Postagens', 'Acompanhe comunicados e participe das discussões das turmas.', 'right'),
    step('[data-tour="student-achievements"]', 'Gamificação', 'Confira conquistas, ranking e evolução da sua participação.', 'right'),
    ...commonSteps,
  ],
  PROFESSOR: [
    step('[data-tour="professor-overview"]', 'Visão geral', 'Acompanhe um resumo das suas turmas e alunos.', 'right'),
    step('[data-tour="professor-classes"]', 'Gerenciar turmas', 'Crie turmas, veja alunos e acompanhe detalhes de cada sala.', 'right'),
    step('[data-tour="teacher-new-class"]', 'Nova turma', 'Use este botão para criar uma turma e gerar o código de entrada.', 'bottom'),
    step('[data-tour="professor-posts"]', 'Postagens', 'Publique comunicados e materiais para suas turmas.', 'right'),
    ...commonSteps,
  ],
  ADMIN: [
    step('[data-tour="admin-overview"]', 'Painel admin', 'Este é o ponto de partida para acompanhar o sistema.', 'right'),
    step('[data-tour="admin-users"]', 'Usuários', 'Gerencie alunos, professores e administradores.', 'right'),
    step('[data-tour="admin-classes"]', 'Turmas', 'Consulte e organize as turmas cadastradas.', 'right'),
    step('[data-tour="admin-missions"]', 'Missões', 'Crie e acompanhe missões disponíveis na plataforma.', 'right'),
    step('[data-tour="admin-achievements"]', 'Conquistas', 'Configure recompensas e critérios de gamificação.', 'right'),
    step('[data-tour="admin-ai-generations"]', 'Gerações IA', 'Audite conteúdos gerados pela IA.', 'right'),
    step('[data-tour="admin-broadcast"]', 'Broadcast', 'Envie avisos para usuários quando necessário.', 'right'),
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
  const autoStartedKeyRef = useRef<string | null>(null);

  const tourKey = useMemo(() => {
    if (!userId || !role) return null;
    return getTourKey(userId, role);
  }, [role, userId]);

  useEffect(() => {
    if (!role || !tourKey) return;

    const handleOpenTour = () => {
      startTour(role, () => localStorage.setItem(tourKey, 'completed'));
    };

    window.addEventListener(OPEN_TOUR_EVENT, handleOpenTour);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, handleOpenTour);
  }, [role, tourKey]);

  useEffect(() => {
    if (!role || !tourKey || disabled) return;
    if (autoStartedKeyRef.current === tourKey) return;
    if (localStorage.getItem(tourKey)) return;

    autoStartedKeyRef.current = tourKey;
    const timeoutId = window.setTimeout(() => {
      startTour(role, () => localStorage.setItem(tourKey, 'completed'));
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, role, tourKey]);

  return null;
};
