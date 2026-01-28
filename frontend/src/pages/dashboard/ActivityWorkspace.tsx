import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { activityService, type Activity } from '@/services/activity-service';
import { submissionService } from '@/services/submission-service';
import { Play, Send, ChevronLeft, Clock, Trophy, Loader2 } from 'lucide-react';

export const ActivityWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);

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
          // Set starter code if available, otherwise default template based on discipline language
          // Note: starterCode will be added to Activity interface in backend later if not present
          // For now, simple fallback
          setCode('// Escreva sua solução aqui\n\nfunction solution() {\n  \n}'); 
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
    // Em um cenário real, isso poderia chamar um endpoint de "dry-run" ou execução de testes
    // Por enquanto, apenas simula uma execução local ou feedback visual
    setOutput('Executando testes locais...\n(Funcionalidade de execução em tempo real será implementada em breve)');
  };

  const handleSubmit = async () => {
    if (!activity || !id) return;

    setIsSubmitting(true);
    setError(null);
    setOutput(null);

    try {
      const submission = await submissionService.createSubmission({
        activityId: id,
        code: code,
        language: activity.discipline?.language.toLowerCase() || 'javascript', // Fallback language
      });

      // setLastSubmission(submission);
      
      // Feedback imediato
      if (submission.status === 'PENDENTE' || submission.status === 'EXECUTANDO') {
        setOutput('Solução enviada! Processando...');
        
        // Polling simples para verificar resultado (simulado por enquanto, ideal seria websocket ou polling real)
        setTimeout(() => {
           navigate('/dashboard/classes/' + activity?.class?.id);
        }, 2000);
      } else {
         setOutput(`Status: ${submission.status}\nResultado: ${submission.result || 'Sem detalhes'}`);
      }

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // @ts-expect-error - axios error structure
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || errorMessage || 'Erro ao submeter solução. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            <p>Carregando ambiente...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activity) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-4">
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
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-brand-950 text-white flex items-center justify-between px-6 border-b border-brand-900">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-brand-900 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">{activity.title}</h1>
            <p className="text-xs text-slate-400">{activity.discipline?.name} • {activity.class?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4" />
            <span>{new Date(activity.deadline).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-2 text-accent-400 font-bold bg-brand-900 px-3 py-1.5 rounded-full border border-brand-800">
            <Trophy className="w-3.5 h-3.5" />
            <span>{activity.points} XP</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Description */}
        <div className="w-1/2 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-8 max-w-3xl mx-auto">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-xl font-bold text-brand-900 mb-4">Descrição</h2>
              <p className="text-slate-600 whitespace-pre-wrap">{activity.description}</p>
              
              <div className="mt-8 p-4 bg-brand-50 rounded-lg border border-brand-100">
                <h3 className="text-sm font-bold text-brand-800 uppercase tracking-wide mb-2">
                  Exemplo de Entrada/Saída
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Entrada</span>
                    <div className="mt-1 p-2 bg-white rounded border border-slate-200 font-mono text-sm">
                      n = 5
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Saída</span>
                    <div className="mt-1 p-2 bg-white rounded border border-slate-200 font-mono text-sm">
                      120
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Editor & Console */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
          {/* Editor Toolbar */}
          <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-[#3e3e3e]">
            <span className="text-xs text-slate-400 font-mono">solution.js</span>
          </div>

          {/* Code Area */}
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Console/Output Panel */}
          <div className="h-1/3 bg-[#1e1e1e] border-t border-[#3e3e3e] flex flex-col">
            <div className="h-10 bg-[#2d2d2d] px-4 flex items-center justify-between border-b border-[#3e3e3e]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Console</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Executar
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              {output ? (
                <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
              ) : (
                <span className="text-slate-600 italic">O resultado da execução aparecerá aqui...</span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="h-16 bg-[#2d2d2d] border-t border-[#3e3e3e] px-6 flex items-center justify-end">
             <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submeter Solução
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
