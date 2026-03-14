import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { activityService, type Activity } from '@/services/activity-service';
import { submissionService } from '@/services/submission-service';
import { Play, Send, ChevronLeft, Clock, Trophy, Loader2, Terminal, ListChecks, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ActivityWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'tests'>('description');
  const [consoleExpanded, setConsoleExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadActivity = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await activityService.getActivity(id);
        
        if (isMounted) {
          setActivity(data);
          // Set starter code or template
          const lang = data.class?.language?.toLowerCase() || 'javascript';
          const templates: Record<string, string> = {
            python: '# Escreva sua solução aqui\n\ndef solution(input):\n    pass',
            javascript: '// Escreva sua solução aqui\n\nfunction solution(input) {\n  \n}',
            java: '// Escreva sua solução aqui\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}',
            c: '// Escreva sua solução aqui\n\n#include <stdio.h>\n\nint main() {\n    return 0;\n}'
          };
          
          setCode(templates[lang] || templates['javascript']);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar a atividade.');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadActivity();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRun = () => {
    // Simula execução local
    setOutput('Compilando...\nExecutando testes...\n\n[INFO] Funcionalidade de execução em tempo real será conectada ao Judge0 em breve.\n');
  };

  const handleSubmit = async () => {
    if (!activity || !id) return;

    setIsSubmitting(true);
    setError(null);
    setOutput('Enviando solução para avaliação...\n');

    try {
      const submission = await submissionService.createSubmission({
        activityId: id,
        code: code,
        language: activity.class?.language?.toLowerCase() || 'javascript',
      });

      // Feedback imediato
      if (submission.status === 'PENDENTE' || submission.status === 'EXECUTANDO') {
        setOutput(prev => (prev || '') + 'Solução recebida! Processando nos servidores...\n');
        
        // Polling simples simulado para UX
        setTimeout(() => {
          setOutput(prev => (prev || '') + '\n✅ Submissão processada com sucesso!\nRedirecionando para resultados...');
          setTimeout(() => {
             navigate('/dashboard/classes/' + activity?.class?.id);
          }, 1500);
        }, 1500);
      } else {
         setOutput(`Status: ${submission.status}\nResultado: ${submission.result || 'Sem detalhes'}`);
      }

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // @ts-expect-error - axios error structure
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || errorMessage || 'Erro ao submeter solução. Tente novamente.');
      setOutput(prev => (prev || '') + '\n❌ Erro ao enviar solução.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p>Carregando ambiente de desenvolvimento...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activity) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error || 'Atividade não encontrada'}
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="text-brand-600 hover:underline flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-950 overflow-hidden">
      {/* Header Compacto - Estilo Auri Dark */}
      <header className="h-16 bg-brand-900 text-slate-200 flex items-center justify-between px-6 border-b border-brand-800 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-brand-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-brand-700"
            title="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-lg text-slate-100 leading-tight tracking-wide">{activity.title}</h1>
            <span className="text-xs text-brand-400 font-medium tracking-wider uppercase">{activity.class?.name || 'Turma'}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-400 bg-brand-950/50 px-3 py-1.5 rounded-md border border-brand-800">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>{new Date(activity.deadline).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-2 text-accent-400 font-bold bg-accent-400/10 px-3 py-1.5 rounded-md border border-accent-400/20 shadow-[0_0_10px_rgba(255,186,26,0.1)]">
            <Trophy className="w-4 h-4" />
            <span>{activity.points} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Description & Tests */}
        <div className="w-[40%] flex flex-col border-r border-brand-800 bg-brand-950">
          {/* Tabs */}
          <div className="flex border-b border-brand-800 bg-brand-900/50">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200",
                activeTab === 'description' 
                  ? "border-accent-500 text-accent-100 bg-brand-800/30" 
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-brand-800/20"
              )}
            >
              <FileText className="w-4 h-4" />
              Enunciado
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200",
                activeTab === 'tests' 
                  ? "border-accent-500 text-accent-100 bg-brand-800/30" 
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-brand-800/20"
              )}
            >
              <ListChecks className="w-4 h-4" />
              Casos de Teste
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-brand-950">
            {activeTab === 'description' ? (
              <div className="prose prose-invert prose-slate max-w-none">
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-base">{activity.description}</div>
                
                {/* Exemplo Rápido */}
                <div className="mt-10">
                  <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-brand-700"></span>
                    Exemplo de Execução
                    <span className="flex-1 h-[1px] bg-brand-700"></span>
                  </h3>
                  <div className="bg-brand-900 rounded-xl border border-brand-800 p-5 font-mono text-sm shadow-sm">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Entrada</span>
                        <div className="text-slate-200 bg-brand-950 p-3 rounded-lg border border-brand-800/50 min-h-[40px] flex items-center">
                          {activity.testCases && activity.testCases[0] ? activity.testCases[0].input : 'Ver casos de teste'}
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Saída Esperada</span>
                        <div className="text-emerald-400 bg-brand-950 p-3 rounded-lg border border-brand-800/50 min-h-[40px] flex items-center">
                        {activity.testCases && activity.testCases[0] ? activity.testCases[0].expectedOutput : '...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.testCases?.map((testCase, index) => (
                  <div key={testCase.id} className="bg-brand-900/50 rounded-xl border border-brand-800 overflow-hidden shadow-sm hover:border-brand-700 transition-colors">
                    <div className="px-5 py-3 bg-brand-900 border-b border-brand-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Caso de Teste #{index + 1}</span>
                      {testCase.isVisible ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">PÚBLICO</span>
                      ) : (
                        <span className="text-[10px] bg-brand-700/50 text-brand-300 border border-brand-700 px-2 py-0.5 rounded-full font-medium">OCULTO</span>
                      )}
                    </div>
                    {testCase.isVisible ? (
                      <div className="p-5 grid gap-5 font-mono text-sm">
                        <div>
                          <span className="block text-xs font-semibold text-slate-500 mb-2">Entrada</span>
                          <div className="text-slate-300 bg-brand-950 p-3 rounded-lg border border-brand-800/50">
                            {testCase.input}
                          </div>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold text-slate-500 mb-2">Saída Esperada</span>
                          <div className="text-slate-300 bg-brand-950 p-3 rounded-lg border border-brand-800/50">
                            {testCase.expectedOutput}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm italic bg-brand-950/30">
                        Este caso de teste é secreto e será verificado apenas na submissão.
                      </div>
                    )}
                  </div>
                ))}
                
                {(!activity.testCases || activity.testCases.length === 0) && (
                  <div className="text-center py-16 text-slate-600">
                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Nenhum caso de teste visível</p>
                    <p className="text-sm">Os testes serão executados após a submissão.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editor & Console */}
        <div className="flex-1 flex flex-col min-w-0 bg-brand-950">
          {/* Editor */}
          <div className="flex-1 relative min-h-0">
            <Editor
              height="100%"
              defaultLanguage={activity.class?.language?.toLowerCase() || 'javascript'}
              language={activity.class?.language?.toLowerCase() || 'javascript'}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 24, bottom: 24 },
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Console/Output Panel */}
          <div className={cn(
            "bg-brand-900 border-t border-brand-800 flex flex-col transition-all duration-300 ease-in-out shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]",
            consoleExpanded ? "h-1/3" : "h-10"
          )}>
            <div 
              className="h-10 bg-brand-900 px-4 flex items-center justify-between border-b border-brand-800 cursor-pointer hover:bg-brand-800 transition-colors"
              onClick={() => setConsoleExpanded(!consoleExpanded)}
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Console de Saída</span>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-brand-700 hover:bg-brand-600 text-slate-200 hover:text-white text-xs font-medium transition-colors border border-brand-600"
                >
                  <Play className="w-3 h-3" />
                  Executar Testes
                </button>
              </div>
            </div>
            
            {consoleExpanded && (
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-[#0d1117] text-slate-300 custom-scrollbar">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <Terminal className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-slate-500">O resultado da execução aparecerá aqui.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="h-16 bg-brand-900 border-t border-brand-800 px-6 flex items-center justify-end shrink-0 gap-4">
             <span className="text-xs text-slate-500 mr-auto">
               Pressione <kbd className="bg-brand-800 px-1.5 py-0.5 rounded text-slate-300 font-sans">Ctrl + Enter</kbd> para executar
             </span>
             <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-brand-950 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-900/20 hover:shadow-accent-900/30 transform hover:-translate-y-0.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Entregar Solução
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
