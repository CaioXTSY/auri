import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/layouts/PublicOnlyRoute';
import { RoleRoute } from '@/components/layouts/RoleRoute';
import { LoadingStatus } from '@/components/ui/loading-status';

const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Docs = lazy(() => import('@/pages/Docs').then(m => ({ default: m.Docs })));
const Login = lazy(() => import('@/pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const MyClasses = lazy(() => import('@/pages/dashboard/MyClasses').then(m => ({ default: m.MyClasses })));
const ClassDetails = lazy(() => import('@/pages/dashboard/ClassDetails').then(m => ({ default: m.ClassDetails })));
const MissionsPage = lazy(() => import('@/pages/dashboard/MissionsPage').then(m => ({ default: m.MissionsPage })));
const ActivitiesPage = lazy(() => import('@/pages/dashboard/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const ActivitySolvePage = lazy(() => import('@/pages/dashboard/ActivitySolvePage').then(m => ({ default: m.ActivitySolvePage })));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })));
const JoinClass = lazy(() => import('@/pages/dashboard/JoinClass').then(m => ({ default: m.JoinClass })));
const AchievementsPage = lazy(() => import('@/pages/dashboard/AchievementsPage').then(m => ({ default: m.AchievementsPage })));
const PostsPage = lazy(() => import('@/pages/dashboard/PostsPage').then(m => ({ default: m.PostsPage })));
const TeacherClasses = lazy(() => import('@/pages/teacher/TeacherClasses').then(m => ({ default: m.TeacherClasses })));
const CreateClass = lazy(() => import('@/pages/teacher/CreateClass').then(m => ({ default: m.CreateClass })));
const TeacherClassDetails = lazy(() => import('@/pages/teacher/TeacherClassDetails').then(m => ({ default: m.TeacherClassDetails })));
const TeacherActivities = lazy(() => import('@/pages/teacher/TeacherActivities').then(m => ({ default: m.TeacherActivities })));
const TeacherActivityForm = lazy(() => import('@/pages/teacher/TeacherActivityForm').then(m => ({ default: m.TeacherActivityForm })));
const TeacherActivitySubmissions = lazy(() => import('@/pages/teacher/TeacherActivitySubmissions').then(m => ({ default: m.TeacherActivitySubmissions })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminClasses = lazy(() => import('@/pages/admin/AdminClasses').then(m => ({ default: m.AdminClasses })));
const AdminMissions = lazy(() => import('@/pages/admin/AdminMissions').then(m => ({ default: m.AdminMissions })));
const AdminAchievements = lazy(() => import('@/pages/admin/AdminAchievements').then(m => ({ default: m.AdminAchievements })));
const AdminAIGenerations = lazy(() => import('@/pages/admin/AdminAIGenerations').then(m => ({ default: m.AdminAIGenerations })));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications').then(m => ({ default: m.AdminNotifications })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

const PageLoader = () => (
  <LoadingStatus label="Carregando página" className="min-h-screen bg-slate-100" />
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Rotas Comuns / Aluno */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/achievements"
            element={
              <RoleRoute allow={['ALUNO']}>
                <AchievementsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/posts"
            element={
              <ProtectedRoute>
                <PostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes"
            element={
              <ProtectedRoute>
                <MyClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/join"
            element={
              <ProtectedRoute>
                <JoinClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:id"
            element={
              <ProtectedRoute>
                <ClassDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/missions"
            element={
              <RoleRoute allow={['ALUNO']}>
                <MissionsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/activities"
            element={
              <RoleRoute allow={['ALUNO']}>
                <ActivitiesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/activities/:id"
            element={
              <RoleRoute allow={['ALUNO']}>
                <ActivitySolvePage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Rotas do Professor */}
          <Route
            path="/dashboard/teacher/classes"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherClasses />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/classes/new"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <CreateClass />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/classes/:id"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherClassDetails />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/activities"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherActivities />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/activities/new"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherActivityForm />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/activities/:id/edit"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherActivityForm />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/activities/:id/submissions"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherActivitySubmissions />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/teacher/classes/:classId/activities"
            element={
              <RoleRoute allow={['PROFESSOR', 'ADMIN']}>
                <TeacherActivities />
              </RoleRoute>
            }
          />

          {/* Rotas do Admin */}
          <Route path="/admin" element={<RoleRoute allow={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute allow={['ADMIN']}><AdminUsers /></RoleRoute>} />
          <Route path="/admin/classes" element={<RoleRoute allow={['ADMIN']}><AdminClasses /></RoleRoute>} />
          <Route path="/admin/missions" element={<RoleRoute allow={['ADMIN']}><AdminMissions /></RoleRoute>} />
          <Route path="/admin/achievements" element={<RoleRoute allow={['ADMIN']}><AdminAchievements /></RoleRoute>} />
          <Route path="/admin/ai-generations" element={<RoleRoute allow={['ADMIN']}><AdminAIGenerations /></RoleRoute>} />
          <Route path="/admin/notifications" element={<RoleRoute allow={['ADMIN']}><AdminNotifications /></RoleRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
