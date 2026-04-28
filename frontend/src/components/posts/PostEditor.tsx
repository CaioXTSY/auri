import { lazy, Suspense } from 'react';
import { Eye, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Label } from '@/components/ui/label';
import { SectionCard } from '@/components/ui/section-card';
import { getAssetUrl } from '@/lib/assets';
import { getUserInitials } from '@/hooks/use-posts-board';
import type { Class } from '@/services/class-service';
import type { PostDetails } from '@/services/posts-service';
import type { User } from '@/types/auth';

const Editor = lazy(() => import('@monaco-editor/react'));

interface PostEditorProps {
  user: User | null;
  classes: Class[];
  selectedPost: PostDetails | null;
  isSavingPost: boolean;
  postTitle: string;
  postClassId: string;
  postContent: string;
  onTitleChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onInsertTemplate: (template: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const markdownHelpers = [
  { label: 'H1', template: '\n# Título' },
  { label: 'H2', template: '\n## Subtítulo' },
  { label: 'Lista', template: '\n- Item 1\n- Item 2' },
  { label: 'Código', template: '\n```python\nprint("hello")\n```' },
  { label: 'Citação', template: '\n> Aviso importante' },
];

export const PostEditor = ({
  user,
  classes,
  selectedPost,
  isSavingPost,
  postTitle,
  postClassId,
  postContent,
  onTitleChange,
  onClassChange,
  onContentChange,
  onInsertTemplate,
  onCancel,
  onSave,
}: PostEditorProps) => {
  return (
    <SectionCard className="overflow-hidden">
      <div className={`h-1.5 ${selectedPost ? 'bg-amber-400' : 'bg-brand-900'}`} />
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold text-slate-600">
              {user?.avatar ? <img src={getAssetUrl(user.avatar) ?? ''} alt={user.name} className="h-full w-full object-cover" /> : getUserInitials(user?.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-400">{selectedPost ? 'Editando postagem' : 'Nova postagem'}</p>
            </div>
          </div>
          <button type="button" aria-label="Fechar editor de postagem" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
          <Field htmlFor="post-title" label="Título" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <input
              id="post-title"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              value={postTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título da postagem"
            />
          </Field>
          <Field htmlFor="post-class" label="Turma" labelClassName="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            <select
              id="post-class"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              value={postClassId}
              onChange={(event) => onClassChange(event.target.value)}
            >
              <option value="">Todas as turmas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {markdownHelpers.map(({ label, template }) => (
            <button
              key={label}
              type="button"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-100"
              onClick={() => onInsertTemplate(template)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="post-content" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Editor</Label>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Suspense fallback={<div className="flex h-[300px] items-center justify-center text-sm text-slate-400">Carregando editor…</div>}>
                <Editor
                  path="post-content"
                  height="300px"
                  language="markdown"
                  theme="vs"
                  value={postContent}
                  onChange={(value) => onContentChange(value || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'off',
                    wordWrap: 'on',
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                    scrollBeyondLastLine: false,
                  }}
                />
              </Suspense>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Eye className="h-3 w-3" />
              Prévia
            </p>
            <div className="min-h-[300px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <MarkdownContent content={postContent || '*Comece a escrever para visualizar...*'} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="button" className="bg-brand-900 text-white hover:bg-brand-800" onClick={onSave} disabled={isSavingPost}>
            {isSavingPost ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Publicar'}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
};
