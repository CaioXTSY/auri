import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { classService, type Class } from '@/services/class-service';
import {
  programmingService,
  type Difficulty,
  type ProblemTestCase,
  type ProgrammingAssignment,
  type ProgrammingProblem,
  type ProgrammingLanguage,
  type TestCaseVisibility,
} from '@/services/programming-service';

const defaultStarter: Record<ProgrammingLanguage, string> = {
  JAVASCRIPT:
    'function solve(input) {\n  return "";\n}\n\nmodule.exports = solve;',
  PYTHON: 'def solve(input: str) -> str:\n    return ""',
};

type EditableTestCase = Partial<ProblemTestCase> & {
  localId: string;
  input: string;
  expected: string;
  visibility: TestCaseVisibility;
  weight: number;
};

const createEmptyTestCase = (): EditableTestCase => ({
  localId: crypto.randomUUID(),
  input: '',
  expected: '',
  visibility: 'PUBLIC',
  weight: 1,
});

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

export const TeacherActivityForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const editType = searchParams.get('type');

  const [classes, setClasses] = useState<Class[]>([]);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('FACIL');
  const [allowedLanguages, setAllowedLanguages] = useState<ProgrammingLanguage[]>([
    'JAVASCRIPT',
  ]);
  const [starterCode, setStarterCode] =
    useState<Record<ProgrammingLanguage, string>>(defaultStarter);
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(128);
  const [testCases, setTestCases] = useState<EditableTestCase[]>([createEmptyTestCase()]);
  const [deletedTestCaseIds, setDeletedTestCaseIds] = useState<string[]>([]);

  const [publishEnabled, setPublishEnabled] = useState(!isEditing);
  const [classId, setClassId] = useState(searchParams.get('classId') ?? '');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [published, setPublished] = useState(true);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const classData = await classService.getAllClasses();
      let assignment: ProgrammingAssignment | null = null;
      let problem: ProgrammingProblem | null = null;

      if (id) {
        if (editType === 'problem') {
          problem = await programmingService.getProblem(id);
        } else {
          try {
            assignment = await programmingService.getAssignment(id);
            problem = await programmingService.getProblem(assignment.problem.id);
          } catch {
            problem = await programmingService.getProblem(id);
          }
        }
      }

      setClasses(classData);
      setAssignmentId(assignment?.id ?? null);

      if (problem) {
        setTitle(problem.title);
        setStatement(problem.statement);
        setDifficulty(problem.difficulty);
        setAllowedLanguages(problem.allowedLanguages);
        setStarterCode({
          JAVASCRIPT: problem.starterCode?.JAVASCRIPT ?? defaultStarter.JAVASCRIPT,
          PYTHON: problem.starterCode?.PYTHON ?? defaultStarter.PYTHON,
        });
        setTimeLimitMs(problem.timeLimitMs);
        setMemoryLimitMb(problem.memoryLimitMb);
        setAssignmentTitle(problem.title);
        setTestCases(
          problem.testCases && problem.testCases.length > 0
            ? problem.testCases.map((testCase) => ({
                ...testCase,
                localId: testCase.id,
              }))
            : [createEmptyTestCase()],
        );
      }

      if (assignment) {
        setPublishEnabled(true);
        setClassId(assignment.classId || assignment.class?.id || '');
        setAssignmentTitle(assignment.title);
        setPoints(assignment.points);
        setDueDate(toDatetimeLocalValue(assignment.dueDate));
        setPublished(assignment.published);
      } else if (problem) {
        setPublishEnabled(false);
        setClassId(searchParams.get('classId') ?? '');
        setDueDate('');
        setPublished(true);
      }
    } catch (err) {
      setError('Nao foi possivel carregar o formulario.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [editType, id, searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!assignmentTitle && title) {
      setAssignmentTitle(title);
    }
  }, [assignmentTitle, title]);

  const warnings = useMemo(() => {
    const items: string[] = [];
    const publicCount = testCases.filter((testCase) => testCase.visibility === 'PUBLIC').length;
    if (testCases.length > 0 && publicCount === 0) {
      items.push('Nao ha caso publico; o aluno nao tera exemplo para executar.');
    }
    if (testCases.length > 0 && publicCount === testCases.length) {
      items.push('Todos os testes estao publicos; considere adicionar pelo menos um teste oculto.');
    }
    return items;
  }, [testCases]);

  const validate = () => {
    if (!title.trim()) return 'Informe o titulo do problema.';
    if (!statement.trim()) return 'Informe o enunciado.';
    if (allowedLanguages.length === 0) return 'Selecione pelo menos uma linguagem.';
    for (const language of allowedLanguages) {
      if (!starterCode[language]?.trim()) {
        return `Informe o starter code de ${language}.`;
      }
    }
    if (timeLimitMs <= 0 || memoryLimitMb <= 0) {
      return 'Limite de tempo e memoria devem ser positivos.';
    }
    if (testCases.length === 0) return 'Cadastre pelo menos um caso de teste.';
    for (const testCase of testCases) {
      if (!testCase.expected.trim()) return 'Todo caso de teste precisa de saida esperada.';
      if (testCase.weight <= 0) return 'Os pesos dos testes devem ser positivos.';
    }
    if (publishEnabled || assignmentId) {
      if (!classId) return 'Selecione a turma para publicar.';
      if (!assignmentTitle.trim()) return 'Informe o titulo da atividade.';
      if (points < 0) return 'Os pontos da atividade nao podem ser negativos.';
    }
    return null;
  };

  const toggleLanguage = (language: ProgrammingLanguage) => {
    setAllowedLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  };

  const updateTestCase = (
    localId: string,
    patch: Partial<Pick<EditableTestCase, 'input' | 'expected' | 'visibility' | 'weight'>>,
  ) => {
    setTestCases((current) =>
      current.map((testCase) =>
        testCase.localId === localId ? { ...testCase, ...patch } : testCase,
      ),
    );
  };

  const removeTestCase = (testCase: EditableTestCase) => {
    if (testCase.id) {
      setDeletedTestCaseIds((current) => [...current, testCase.id as string]);
    }
    setTestCases((current) =>
      current.length === 1
        ? [createEmptyTestCase()]
        : current.filter((item) => item.localId !== testCase.localId),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        statement: statement.trim(),
        difficulty,
        allowedLanguages,
        starterCode,
        timeLimitMs,
        memoryLimitMb,
      };

      const problem = isEditing && id
        ? await programmingService.updateProblem(id, payload)
        : await programmingService.createProblem(payload);

      await Promise.all(
        deletedTestCaseIds.map((testCaseId) => programmingService.deleteTestCase(testCaseId)),
      );

      for (const testCase of testCases) {
        const testPayload = {
          input: testCase.input,
          expected: testCase.expected,
          visibility: testCase.visibility,
          weight: Number(testCase.weight),
        };

        if (testCase.id) {
          await programmingService.updateTestCase(testCase.id, testPayload);
        } else {
          await programmingService.createTestCase(problem.id, testPayload);
        }
      }

      if (publishEnabled || assignmentId) {
        const assignmentPayload = {
          problemId: problem.id,
          classId,
          title: assignmentTitle.trim(),
          points,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          published,
        };

        if (assignmentId) {
          await programmingService.updateAssignment(assignmentId, assignmentPayload);
        } else {
          await programmingService.createAssignment(assignmentPayload);
        }
      }

      navigate('/dashboard/teacher/activities');
    } catch (err) {
      setError('Nao foi possivel salvar a atividade.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              type="button"
              variant="ghost"
              className="mb-2 px-0 text-slate-600"
              onClick={() => navigate('/dashboard/teacher/activities')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="font-display text-2xl font-bold text-brand-900">
              {assignmentId
                ? 'Editar atividade publicada'
                : isEditing
                  ? 'Editar problema'
                  : 'Nova atividade de codigo'}
            </h1>
            <p className="text-sm text-slate-500">
              {assignmentId
                ? 'Ajuste o problema, prazo, pontos e status de publicacao.'
                : 'Configure enunciado, linguagens, testes e publicacao.'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {warnings.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                {warnings.map((warning) => (
                  <div key={warning} className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-brand-900">Problema</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field htmlFor="title" label="Titulo">
                  <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
                </Field>
                <Field htmlFor="difficulty" label="Dificuldade">
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="FACIL">FACIL</option>
                    <option value="MEDIO">MEDIO</option>
                    <option value="DIFICIL">DIFICIL</option>
                  </select>
                </Field>
                <Field htmlFor="timeLimitMs" label="Limite de tempo (ms)">
                  <Input
                    id="timeLimitMs"
                    type="number"
                    min={100}
                    value={timeLimitMs}
                    onChange={(event) => setTimeLimitMs(Number(event.target.value))}
                  />
                </Field>
                <Field htmlFor="memoryLimitMb" label="Limite de memoria (MB)">
                  <Input
                    id="memoryLimitMb"
                    type="number"
                    min={16}
                    value={memoryLimitMb}
                    onChange={(event) => setMemoryLimitMb(Number(event.target.value))}
                  />
                </Field>
              </div>
              <Field htmlFor="statement" label="Enunciado markdown" className="mt-4">
                <textarea
                  id="statement"
                  rows={8}
                  value={statement}
                  onChange={(event) => setStatement(event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </Field>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-brand-900">Linguagens e starter code</h2>
              <div className="mb-4 flex flex-wrap gap-4">
                {(['JAVASCRIPT', 'PYTHON'] as ProgrammingLanguage[]).map((language) => (
                  <label key={language} className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={allowedLanguages.includes(language)}
                      onCheckedChange={() => toggleLanguage(language)}
                    />
                    {language}
                  </label>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {(['JAVASCRIPT', 'PYTHON'] as ProgrammingLanguage[]).map((language) => (
                  <Field key={language} htmlFor={`starter-${language}`} label={`Starter ${language}`}>
                    <textarea
                      id={`starter-${language}`}
                      rows={8}
                      value={starterCode[language]}
                      onChange={(event) =>
                        setStarterCode((current) => ({
                          ...current,
                          [language]: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-200 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100"
                    />
                  </Field>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-brand-900">Casos de teste</h2>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestCases((current) => [...current, createEmptyTestCase()])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <div key={testCase.localId} className="rounded-md border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">Teste {index + 1}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTestCase(testCase)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field htmlFor={`input-${testCase.localId}`} label="Entrada">
                        <textarea
                          id={`input-${testCase.localId}`}
                          rows={4}
                          value={testCase.input}
                          onChange={(event) =>
                            updateTestCase(testCase.localId, { input: event.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
                        />
                      </Field>
                      <Field htmlFor={`expected-${testCase.localId}`} label="Saida esperada">
                        <textarea
                          id={`expected-${testCase.localId}`}
                          rows={4}
                          value={testCase.expected}
                          onChange={(event) =>
                            updateTestCase(testCase.localId, { expected: event.target.value })
                          }
                          className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
                        />
                      </Field>
                      <Field htmlFor={`visibility-${testCase.localId}`} label="Visibilidade">
                        <select
                          id={`visibility-${testCase.localId}`}
                          value={testCase.visibility}
                          onChange={(event) =>
                            updateTestCase(testCase.localId, {
                              visibility: event.target.value as TestCaseVisibility,
                            })
                          }
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="HIDDEN">HIDDEN</option>
                        </select>
                      </Field>
                      <Field htmlFor={`weight-${testCase.localId}`} label="Peso">
                        <Input
                          id={`weight-${testCase.localId}`}
                          type="number"
                          min={1}
                          value={testCase.weight}
                          onChange={(event) =>
                            updateTestCase(testCase.localId, {
                              weight: Number(event.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-brand-900">
                <Checkbox
                  checked={publishEnabled}
                  disabled={Boolean(assignmentId)}
                  onCheckedChange={(checked) => setPublishEnabled(Boolean(checked))}
                />
                {assignmentId ? 'Dados da publicacao' : 'Publicar em turma'}
              </label>
              {publishEnabled ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field htmlFor="classId" label="Turma">
                    <select
                      id="classId"
                      value={classId}
                      onChange={(event) => setClassId(event.target.value)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">Selecione uma turma</option>
                      {classes.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} - {classroom.year}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field htmlFor="assignmentTitle" label="Titulo da atividade">
                    <Input
                      id="assignmentTitle"
                      value={assignmentTitle}
                      onChange={(event) => setAssignmentTitle(event.target.value)}
                    />
                  </Field>
                  <Field htmlFor="points" label="Pontos">
                    <Input
                      id="points"
                      type="number"
                      min={0}
                      value={points}
                      onChange={(event) => setPoints(Number(event.target.value))}
                    />
                  </Field>
                  <Field htmlFor="dueDate" label="Prazo">
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={published}
                      onCheckedChange={(checked) => setPublished(Boolean(checked))}
                    />
                    Publicada
                  </label>
                </div>
              ) : null}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/teacher/activities')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-accent-600 font-bold text-brand-950 hover:bg-accent-700"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
