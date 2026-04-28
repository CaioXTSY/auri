import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProfessorOverview } from '@/components/dashboard/ProfessorOverview';
import { StudentDashboardOverview } from '@/components/dashboard/StudentDashboardOverview';
import { useAuthStore } from '@/stores/auth-store';
import { dashboardService } from '@/services/dashboard-service';

export const DashboardHome = () => {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Aluno';

  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => dashboardService.getStudentDashboard(),
    enabled: user?.role === 'ALUNO',
  });

  const openDailyQuiz = () => {
    window.dispatchEvent(new Event('open-daily-quiz'));
  };

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'PROFESSOR') {
    return (
      <DashboardLayout>
        <ProfessorOverview firstName={firstName} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <StudentDashboardOverview
        firstName={firstName}
        dashboardData={dashboardData}
        isLoading={isLoading}
        loadError={isError}
        onRetry={() => refetch()}
        onOpenDailyQuiz={openDailyQuiz}
      />
    </DashboardLayout>
  );
};
