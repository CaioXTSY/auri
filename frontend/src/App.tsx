import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Docs } from '@/pages/Docs';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { MyClasses } from '@/pages/dashboard/MyClasses';
import { ClassDetails } from '@/pages/dashboard/ClassDetails';
import { MissionsPage } from '@/pages/dashboard/MissionsPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { TeacherClasses } from '@/pages/teacher/TeacherClasses';
import { CreateClass } from '@/pages/teacher/CreateClass';
import { TeacherClassDetails } from '@/pages/teacher/TeacherClassDetails';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

import { JoinClass } from '@/pages/dashboard/JoinClass';
import { AchievementsPage } from '@/pages/dashboard/AchievementsPage';
import { PostsPage } from '@/pages/dashboard/PostsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <MissionsPage />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <TeacherClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/classes/new"
          element={
            <ProtectedRoute>
              <CreateClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/classes/:id"
          element={
            <ProtectedRoute>
              <TeacherClassDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
