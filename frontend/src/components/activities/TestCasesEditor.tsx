import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { TestCaseVisibility } from '@/services/programming-service';

export type EditableTestCase = {
  id?: string;
  localId: string;
  input: string;
  expected: string;
  visibility: TestCaseVisibility;
  weight: number;
};

export const TestCasesEditor = ({
  testCases,
  onAdd,
  onRemove,
  onChange,
}: {
  testCases: EditableTestCase[];
  onAdd: () => void;
  onRemove: (testCase: EditableTestCase) => void;
  onChange: (localId: string, patch: Partial<Omit<EditableTestCase, 'id' | 'localId'>>) => void;
}) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-brand-900">Casos de teste</h2>
      <Button type="button" variant="outline" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar
      </Button>
    </div>
    <div className="space-y-4">
      {testCases.map((testCase, index) => (
        <div key={testCase.localId} className="rounded-md border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Teste {index + 1}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(testCase)}>
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field htmlFor={`input-${testCase.localId}`} label="Entrada">
              <textarea id={`input-${testCase.localId}`} rows={4} value={testCase.input} onChange={(event) => onChange(testCase.localId, { input: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm" />
            </Field>
            <Field htmlFor={`expected-${testCase.localId}`} label="Saída esperada">
              <textarea id={`expected-${testCase.localId}`} rows={4} value={testCase.expected} onChange={(event) => onChange(testCase.localId, { expected: event.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm" />
            </Field>
            <Field htmlFor={`visibility-${testCase.localId}`} label="Visibilidade">
              <select id={`visibility-${testCase.localId}`} value={testCase.visibility} onChange={(event) => onChange(testCase.localId, { visibility: event.target.value as TestCaseVisibility })} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="PUBLIC">PUBLIC</option><option value="HIDDEN">HIDDEN</option>
              </select>
            </Field>
            <Field htmlFor={`weight-${testCase.localId}`} label="Peso">
              <Input id={`weight-${testCase.localId}`} type="number" min={1} value={testCase.weight} onChange={(event) => onChange(testCase.localId, { weight: Number(event.target.value) })} />
            </Field>
          </div>
        </div>
      ))}
    </div>
  </section>
);
