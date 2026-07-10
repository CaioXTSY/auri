import { Award, ChartNoAxesColumnIncreasing, CircleCheck, Code2, ListChecks, Trophy } from 'lucide-react';

const steps = [
  { icon: Code2, title: 'Atividades e missões', description: 'Atividades avaliam seu código. Missões propõem objetivos extras e podem incluir quizzes.' },
  { icon: CircleCheck, title: 'XP válido', description: 'Ao concluir um objetivo avaliado, você recebe XP conforme a regra da atividade ou missão.' },
  { icon: ChartNoAxesColumnIncreasing, title: 'Nível individual', description: 'Seu XP aumenta seu nível; esse progresso é pessoal e não depende de outros alunos.' },
  { icon: Award, title: 'Conquistas', description: 'Marcos cumpridos desbloqueiam conquistas e podem conceder XP adicional.' },
  { icon: Trophy, title: 'Ranking comparativo', description: 'Sua posição compara XP com outras pessoas e só aparece quando a turma permite.' },
];

export const ProgressGuide = () => (
  <section aria-labelledby="progress-guide-title" className="rounded-xl border border-brand-100 bg-brand-50 p-5">
    <div className="flex items-start gap-3">
      <ListChecks aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
      <div>
        <h2 id="progress-guide-title" className="font-display text-lg font-bold text-brand-900">Como funciona seu progresso</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">Atividades avaliam seu código. Missões propõem objetivos adicionais e podem incluir quizzes. As duas podem conceder XP, que aumenta seu nível e desbloqueia conquistas.</p>
      </div>
    </div>
    <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {steps.map(({ icon: Icon, title, description }, index) => (
        <li key={title} className="rounded-lg border border-brand-100 bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-900 text-[11px] text-white">{index + 1}</span>
            <Icon aria-hidden="true" className="h-4 w-4" />
            {title}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
        </li>
      ))}
    </ol>
  </section>
);
