import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { classService, type Class } from '@/services/class-service';
import {
  activityService,
  type ActivityQuestion,
  type ActivityType,
  type QuestionType,
} from '@/services/activity-service';

type EditableQuestion = Omit<ActivityQuestion, 'id'> & { id?: string };
const blankQuestion = (position: number): EditableQuestion => ({
  type: 'MULTIPLE_CHOICE',
  prompt: '',
  points: 10,
  position,
  options: [1, 2, 3, 4].map((item) => ({ id: crypto.randomUUID(), text: '', position: item, isCorrect: item === 1 })),
});

const types: Array<{ value: ActivityType; title: string; description: string }> = [
  { value: 'TEXT', title: 'Resposta escrita', description: 'O aluno escreve e envia uma resposta.' },
  { value: 'FILE', title: 'Envio de arquivo', description: 'PDF, imagem, texto ou documento.' },
  { value: 'QUIZ', title: 'Questionário', description: 'Questões objetivas ou respostas curtas.' },
  { value: 'CODE', title: 'Código', description: 'Editor, testes e correção pelo judge.' },
];

export const TeacherUnifiedActivityForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [classes, setClasses] = useState<Class[]>([]);
  const [type, setType] = useState<ActivityType>((params.get('type') as ActivityType) || 'TEXT');
  const [classId, setClassId] = useState(params.get('classId') ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [xpReward, setXpReward] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [allowLate, setAllowLate] = useState(false);
  const [allowResubmission, setAllowResubmission] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [showResultsImmediately, setShowResultsImmediately] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<File[]>([]);
  const [publishNow, setPublishNow] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([classService.getAllClasses(), id ? activityService.get(id) : Promise.resolve(null)])
      .then(([classData, activity]) => {
        setClasses(classData);
        if (!activity) return;
        setType(activity.type);
        setClassId(activity.classId);
        setTitle(activity.title);
        setDescription(activity.description);
        setMaxScore(activity.maxScore);
        setXpReward(activity.xpReward);
        setDueDate(activity.dueDate ? new Date(new Date(activity.dueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
        setAllowLate(activity.allowLateSubmissions);
        setAllowResubmission(activity.allowResubmission);
        setMaxAttempts(activity.maxAttempts);
        setShowResultsImmediately(activity.showResultsImmediately);
        setQuestions(activity.questions ?? []);
      })
      .catch(() => setError('Não foi possível carregar a atividade.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const questionPoints = useMemo(() => questions.reduce((total, question) => total + question.points, 0), [questions]);

  const changeType = (nextType: ActivityType) => {
    if (nextType === 'CODE') {
      navigate(`/dashboard/teacher/activities/code/new${classId ? `?classId=${classId}` : ''}`);
      return;
    }
    setType(nextType);
    if (nextType === 'QUIZ' && questions.length === 0) setQuestions([blankQuestion(1)]);
  };

  const updateQuestion = (index: number, patch: Partial<EditableQuestion>) => {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!classId || !title.trim() || !description.trim()) {
      setError('Preencha turma, título e instruções.');
      return;
    }
    if (type === 'QUIZ' && (questions.length === 0 || questions.some((question) => !question.prompt.trim()))) {
      setError('Preencha todas as questões do questionário.');
      return;
    }
    if (type === 'QUIZ' && questionPoints > maxScore) {
      setError('A soma das questões não pode ultrapassar a nota máxima.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        classId,
        type,
        title: title.trim(),
        description: description.trim(),
        maxScore,
        xpReward,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        allowLateSubmissions: allowLate,
        allowResubmission,
        maxAttempts,
        allowedFileTypes: type === 'FILE' ? ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] : undefined,
        maxFileSize: 10 * 1024 * 1024,
        maxFiles: 5,
        showResultsImmediately,
      };
      const activity = id ? await activityService.update(id, payload) : await activityService.create(payload);
      for (const questionId of deletedQuestionIds) {
        await activityService.removeQuestion(activity.id, questionId);
      }
      if (type === 'QUIZ') {
        for (const question of questions) {
          const questionPayload = {
            type: question.type,
            prompt: question.prompt.trim(),
            points: question.points,
            position: question.position,
            options: question.type === 'SHORT_ANSWER'
              ? undefined
              : question.options
                  .slice(0, question.type === 'TRUE_FALSE' ? 2 : 4)
                  .map(({ text, position, isCorrect }) => ({ text: text.trim(), position, isCorrect: Boolean(isCorrect) })),
          };
          if (question.id) await activityService.updateQuestion(activity.id, question.id, questionPayload);
          else await activityService.createQuestion(activity.id, questionPayload);
        }
      }
      if (materials.length) await activityService.uploadMaterials(activity.id, materials);
      if (publishNow) await activityService.publish(activity.id);
      navigate('/dashboard/teacher/activities');
    } catch {
      setError('Não foi possível salvar a atividade. Revise os dados e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <form onSubmit={save} className="mx-auto max-w-5xl space-y-6">
        <div>
          <Button type="button" variant="ghost" className="mb-2 px-0" onClick={() => navigate('/dashboard/teacher/activities')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          <h1 className="font-display text-2xl font-bold text-brand-900">{id ? 'Editar atividade' : 'Nova atividade'}</h1>
          <p className="text-sm text-slate-500">Conteúdo, forma de entrega e publicação em três etapas.</p>
        </div>

        <div className="grid grid-cols-3 gap-2" aria-label="Etapas do formulário">
          {['Conteúdo', 'Entrega e avaliação', 'Publicação'].map((label, index) => (
            <button key={label} type="button" onClick={() => setStep(index + 1)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${step === index + 1 ? 'border-brand-900 bg-brand-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{index + 1}. {label}</button>
          ))}
        </div>

        {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {step === 1 ? (
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {types.map((item) => (
                <button key={item.value} type="button" onClick={() => changeType(item.value)} className={`rounded-xl border p-4 text-left ${type === item.value ? 'border-brand-700 bg-brand-50' : 'border-slate-200'}`}>
                  <p className="font-semibold text-brand-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field htmlFor="classId" label="Turma"><select id="classId" value={classId} onChange={(event) => setClassId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">Selecione</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.year}</option>)}</select></Field>
              <Field htmlFor="title" label="Título"><Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            </div>
            <Field htmlFor="description" label="Instruções"><textarea id="description" rows={8} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" /></Field>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <Field htmlFor="maxScore" label="Nota máxima"><Input id="maxScore" type="number" min={0} value={maxScore} onChange={(event) => setMaxScore(Number(event.target.value))} /></Field>
              <Field htmlFor="xpReward" label="XP após correção"><Input id="xpReward" type="number" min={0} value={xpReward} onChange={(event) => setXpReward(Number(event.target.value))} /></Field>
              <Field htmlFor="maxAttempts" label="Tentativas"><Input id="maxAttempts" type="number" min={1} max={20} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} /></Field>
            </div>
            <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><Checkbox checked={allowLate} onCheckedChange={(value) => setAllowLate(Boolean(value))} />Aceitar após o prazo</label><label className="flex items-center gap-2"><Checkbox checked={allowResubmission} onCheckedChange={(value) => setAllowResubmission(Boolean(value))} />Permitir reenvio</label></div>
            {type === 'QUIZ' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold text-brand-900">Questões</h2><p className="text-xs text-slate-500">{questionPoints} de {maxScore} pontos configurados</p></div><Button type="button" variant="outline" onClick={() => setQuestions((current) => [...current, blankQuestion(current.length + 1)])}><Plus className="mr-2 h-4 w-4" />Questão</Button></div>
                {questions.map((question, index) => (
                  <div key={question.id ?? index} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_100px_auto]"><Input aria-label={`Enunciado da questão ${index + 1}`} value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder={`Questão ${index + 1}`} /><select value={question.type} onChange={(event) => { const nextType = event.target.value as QuestionType; updateQuestion(index, { type: nextType, options: nextType === 'SHORT_ANSWER' ? [] : blankQuestion(1).options.slice(0, nextType === 'TRUE_FALSE' ? 2 : 4) }); }} className="h-10 rounded-md border border-slate-200 bg-white px-2 text-sm"><option value="MULTIPLE_CHOICE">Múltipla escolha</option><option value="TRUE_FALSE">Verdadeiro/falso</option><option value="SHORT_ANSWER">Resposta curta</option></select><Input aria-label="Pontos" type="number" min={0} value={question.points} onChange={(event) => updateQuestion(index, { points: Number(event.target.value) })} /><Button type="button" size="icon" variant="ghost" aria-label="Remover questão" onClick={() => { if (question.id) setDeletedQuestionIds((current) => [...current, question.id!]); setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, position) => ({ ...item, position: position + 1 }))); }}><Trash2 className="h-4 w-4" /></Button></div>
                    {question.type !== 'SHORT_ANSWER' ? <div className="grid gap-2 md:grid-cols-2">{question.options.slice(0, question.type === 'TRUE_FALSE' ? 2 : 4).map((option, optionIndex) => <label key={option.id} className="flex items-center gap-2"><input type="radio" name={`correct-${index}`} checked={Boolean(option.isCorrect)} onChange={() => updateQuestion(index, { options: question.options.map((item, itemIndex) => ({ ...item, isCorrect: itemIndex === optionIndex })) })} /><Input value={option.text} onChange={(event) => updateQuestion(index, { options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, text: event.target.value } : item) })} placeholder={`Alternativa ${optionIndex + 1}`} /></label>)}</div> : <p className="text-xs text-slate-500">Esta questão será corrigida manualmente.</p>}
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={showResultsImmediately} onCheckedChange={(value) => setShowResultsImmediately(Boolean(value))} />Corrigir questões objetivas e liberar resultado imediatamente</label>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Field htmlFor="dueDate" label="Prazo"><Input id="dueDate" type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
            <Field htmlFor="materials" label="Materiais de apoio" description="Até cinco PDFs, imagens, textos ou documentos."><Input id="materials" type="file" multiple onChange={(event) => setMaterials(Array.from(event.target.files ?? []))} /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-brand-900"><Checkbox checked={publishNow} onCheckedChange={(value) => setPublishNow(Boolean(value))} />Publicar agora e notificar a turma</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p className="font-semibold text-brand-900">Resumo</p><p className="mt-1">{type} · {maxScore} pontos · {xpReward} XP · {maxAttempts} tentativa(s)</p></div>
          </section>
        ) : null}

        <div className="flex justify-between"><Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}>Anterior</Button>{step < 3 ? <Button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))}>Próxima</Button> : <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar atividade</Button>}</div>
      </form>
    </DashboardLayout>
  );
};
