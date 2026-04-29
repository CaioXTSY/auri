import { lazy, Suspense, useState } from 'react';
import {
  BookOpen,
  Braces,
  Eye,
  Heading1,
  Heading2,
  List,
  Loader2,
  MessageSquareQuote,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { MarkdownContent } from '@/components/ui/markdown-content';
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
  { label: 'Título', icon: Heading1, template: '\n# Título' },
  { label: 'Subtítulo', icon: Heading2, template: '\n## Subtítulo' },
  { label: 'Lista', icon: List, template: '\n- Item 1\n- Item 2' },
  { label: 'Código', icon: Braces, template: '\n```python\nprint("hello")\n```' },
  { label: 'Citação', icon: MessageSquareQuote, template: '\n> Aviso importante' },
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
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const editorLineCount = Math.max(12, postContent.split('\n').length);
  const editorHeight = `${Math.max(420, editorLineCount * 24 + 64)}px`;

  return (
    <SectionCard className="overflow-hidden border-slate-300 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-900 text-xs font-bold uppercase text-accent-300">
            {user?.avatar ? (
              <img src={getAssetUrl(user.avatar) ?? ''} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              getUserInitials(user?.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{selectedPost ? 'Editando postagem' : 'Nova postagem'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="post-class"
            aria-label="Turma da postagem"
            className="h-9 max-w-[180px] rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:max-w-xs"
            value={postClassId}
            onChange={(event) => onClassChange(event.target.value)}
          >
            <option value="">Geral</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Fechar editor de postagem"
            onClick={onCancel}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50/60">
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <Field htmlFor="post-title" label="Título da postagem" labelClassName="sr-only">
            <input
              id="post-title"
              className="w-full border-0 bg-transparent px-0 py-1 text-2xl font-bold text-brand-950 placeholder:text-slate-300 focus:outline-none focus:ring-0"
              value={postTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Título da postagem"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-100/70 px-4 py-2 sm:px-5">
          <div className="flex items-center gap-1">
            {markdownHelpers.map(({ label, icon: Icon, template }) => (
              <button
                key={label}
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
                onClick={() => onInsertTemplate(template)}
                title={label}
                aria-label={`Inserir ${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors ${
                mode === 'write'
                  ? 'bg-brand-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Escrever
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`inline-flex h-8 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors ${
                mode === 'preview'
                  ? 'bg-brand-900 text-white'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Visualizar
            </button>
          </div>
        </div>

        <div className="bg-white">
          {mode === 'write' ? (
            <Suspense fallback={<div className="flex min-h-[420px] items-center justify-center text-sm text-slate-400">Carregando editor...</div>}>
            <Editor
              path="post-content"
              height={editorHeight}
              language="plaintext"
              theme="vs"
              value={postContent}
              onChange={(value) => onContentChange(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'off',
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 18, bottom: 18 },
                scrollBeyondLastLine: false,
                scrollbar: {
                  vertical: 'hidden',
                  horizontal: 'hidden',
                  handleMouseWheel: false,
                },
                renderLineHighlight: 'none',
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
              }}
            />
          </Suspense>
          ) : (
            <div className="min-h-[420px] p-6 text-sm leading-relaxed text-slate-700">
              {postTitle ? (
                <h3 className="mb-4 text-2xl font-bold text-brand-950">{postTitle}</h3>
              ) : null}
              <MarkdownContent content={postContent || '*Nada para visualizar ainda.*'} />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="button" className="bg-brand-900 text-white hover:bg-brand-800" onClick={onSave} disabled={isSavingPost}>
            {isSavingPost ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {selectedPost ? 'Atualizar' : 'Publicar'}
              </>
            )}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
};
