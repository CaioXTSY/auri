import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { userService, type UpdateProfilePayload } from '@/services/user-service';

const updateProfileSchema = z.object({
  name: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('Email inválido'),
  password: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  ),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema) as never,
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    });
    setAvatarPreview(null);
  }, [reset, user?.email, user?.name]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-slate-500">Carregando perfil...</p>
        </div>
      </DashboardLayout>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
    : 'AU';

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const updatedUser = await userService.uploadAvatar(file);
      updateUser(updatedUser);
      notify({ title: 'Avatar atualizado', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao enviar avatar', variant: 'error' });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileForm) => {
    setIsSaving(true);
    const payload: UpdateProfilePayload = {
      name: data.name,
      email: data.email,
      ...(data.password ? { password: data.password } : {}),
    };

    try {
      const updatedUser = await userService.updateMe(payload);
      updateUser(updatedUser);
      notify({ title: 'Perfil atualizado', variant: 'success' });
      reset({ ...data, password: '' });
    } catch {
      notify({ title: 'Falha ao atualizar perfil', variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-display font-bold text-brand-900">Configurações</h1>
          <p className="text-sm text-slate-500">
            Atualize seus dados pessoais e preferências de perfil.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xl font-bold overflow-hidden">
              {avatarPreview || user.avatar ? (
                <img
                  src={avatarPreview ?? user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">Foto de Perfil</p>
                <p className="text-xs text-slate-500">PNG, JPG ou GIF até 5MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 text-slate-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : 'Alterar foto'}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" placeholder="Deixe em branco para manter" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-brand-900 hover:bg-brand-800 text-white">
                {isSaving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
