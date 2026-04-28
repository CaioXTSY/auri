import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { openPlatformTour } from '@/components/onboarding/platform-tour-events';
import {
  PasswordSettingsDialog,
  type PasswordSettingsFormValues,
} from '@/components/settings/PasswordSettingsDialog';
import {
  ProfileDetailsForm,
  type ProfileDetailsFormValues,
} from '@/components/settings/ProfileDetailsForm';
import { ProfileSummaryCard } from '@/components/settings/ProfileSummaryCard';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { userService, type UpdateProfilePayload } from '@/services/user-service';
import { getAssetUrl } from '@/lib/assets';

const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo'),
  email: z.string().trim().email('Informe um email valido'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const getInitials = (name?: string | null) => {
  if (!name) return 'AU';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const profileForm = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  const passwordForm = useForm<PasswordSettingsFormValues>({
    resolver: zodResolver(passwordSchema) as never,
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const avatarSrc = avatarPreview ?? getAssetUrl(user?.avatar);

  useEffect(() => {
    profileForm.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
    });
    setAvatarPreview(null);
  }, [profileForm, user?.email, user?.name]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user) {
    return (
      <DashboardLayout>
        <SectionCard className="mx-auto max-w-3xl p-6">
          <p className="text-sm text-slate-500">Carregando perfil...</p>
        </SectionCard>
      </DashboardLayout>
    );
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify({ title: 'Escolha um arquivo de imagem valido', variant: 'error' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify({ title: 'A imagem deve ter no maximo 5MB', variant: 'error' });
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return previewUrl;
    });
    setIsUploading(true);

    try {
      const updatedUser = await userService.uploadAvatar(file);
      updateUser(updatedUser);
      notify({ title: 'Foto atualizada', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao enviar foto', variant: 'error' });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsSavingProfile(true);
    const payload: UpdateProfilePayload = {
      name: data.name,
      email: data.email,
    };

    try {
      const updatedUser = await userService.updateMe(payload);
      updateUser(updatedUser);
      profileForm.reset({ name: updatedUser.name, email: updatedUser.email });
      notify({ title: 'Perfil atualizado', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao atualizar perfil', variant: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsSavingPassword(true);

    try {
      const updatedUser = await userService.updateMe({ password: data.password });
      updateUser(updatedUser);
      passwordForm.reset({ password: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
      notify({ title: 'Senha atualizada', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao atualizar senha', variant: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Configurações"
          description="Gerencie seus dados de perfil e acesso."
        />

        <ProfileSummaryCard
          name={user.name}
          email={user.email}
          role={user.role}
          initials={initials}
          avatarSrc={avatarSrc}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          onAvatarChange={handleAvatarChange}
        />

        <ProfileDetailsForm
          form={profileForm}
          isSaving={isSavingProfile}
          userName={user.name}
          userEmail={user.email}
          onSubmit={onSubmitProfile}
        />

        <SectionCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Senha</h2>
              <p className="mt-1 text-sm text-slate-500">
                Defina uma nova senha para acessar sua conta.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Alterar senha
            </Button>
          </div>
        </SectionCard>

        <SectionCard className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Guia da plataforma</h2>
              <p className="mt-1 text-sm text-slate-500">
                Revise os pontos principais do painel quando precisar.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              onClick={openPlatformTour}
            >
              Ver guia novamente
            </Button>
          </div>
        </SectionCard>

        <PasswordSettingsDialog
          open={isPasswordModalOpen}
          isSaving={isSavingPassword}
          form={passwordForm}
          onClose={() => {
            passwordForm.reset({ password: '', confirmPassword: '' });
            setIsPasswordModalOpen(false);
          }}
          onSubmit={onSubmitPassword}
        />
      </div>
    </DashboardLayout>
  );
};
