import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { adminService, type BroadcastPayload } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle } from 'lucide-react';

type Target = 'ALL' | 'ADMIN' | 'PROFESSOR' | 'ALUNO';

export const AdminNotifications = () => {
  const [type, setType] = useState<BroadcastPayload['type']>('SISTEMA');
  const [target, setTarget] = useState<Target>('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSending(true);
    try {
      const payload: BroadcastPayload = {
        type,
        title,
        message,
        ...(target !== 'ALL' ? { targetRole: target } : {}),
      };
      const { count } = await adminService.broadcast(payload);
      setSuccess(count);
      setTitle('');
      setMessage('');
    } catch {
      setError('Falha ao enviar broadcast');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-brand-900 font-display">Broadcast</h1>
          <p className="text-slate-500">Envie uma notificação para todos os usuários ou filtrados por role.</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as BroadcastPayload['type'])} className="mt-2 w-full h-10 rounded-md border border-slate-200 px-3 text-sm">
              <option value="SISTEMA">Sistema</option>
              <option value="CONQUISTA">Conquista</option>
              <option value="MISSAO">Missão</option>
              <option value="RANKING">Ranking</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Público-alvo</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as Target)} className="mt-2 w-full h-10 rounded-md border border-slate-200 px-3 text-sm">
              <option value="ALL">Todos</option>
              <option value="ALUNO">Apenas alunos</option>
              <option value="PROFESSOR">Apenas professores</option>
              <option value="ADMIN">Apenas admins</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Título</label>
            <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">{error}</div>}
          {success !== null && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Enviado para {success} usuário(s).
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSending} className="bg-accent-600 hover:bg-accent-700 text-brand-950 font-bold">
              {isSending ? 'Enviando...' : 'Enviar broadcast'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
