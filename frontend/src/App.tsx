import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { MyClasses } from '@/pages/dashboard/MyClasses';
import { ClassDetails } from '@/pages/dashboard/ClassDetails';
import { ActivityWorkspace } from '@/pages/dashboard/ActivityWorkspace';
import { TeacherClasses } from '@/pages/teacher/TeacherClasses';
import { CreateClass } from '@/pages/teacher/CreateClass';
import { TeacherClassDetails } from '@/pages/teacher/TeacherClassDetails';
import { CreateActivity } from '@/pages/teacher/CreateActivity';
import { TeacherDisciplines } from '@/pages/teacher/TeacherDisciplines';
import { CreateDiscipline } from '@/pages/teacher/CreateDiscipline';
import { ActivitySubmissions } from '@/pages/teacher/ActivitySubmissions';
import { SubmissionDetails } from '@/pages/teacher/SubmissionDetails';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

import { JoinClass } from '@/pages/dashboard/JoinClass';
import { AchievementsPage } from '@/pages/dashboard/AchievementsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
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
          path="/dashboard/activities/:id"
          element={
            <ProtectedRoute>
              <ActivityWorkspace />
            </ProtectedRoute>
          }
        />

        {/* Rotas do Professor */}
        <Route
          path="/dashboard/teacher/disciplines"
          element={
            <ProtectedRoute>
              <TeacherDisciplines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/disciplines/new"
          element={
            <ProtectedRoute>
              <CreateDiscipline />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/dashboard/teacher/classes/:id/activities/new"
          element={
            <ProtectedRoute>
              <CreateActivity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/activities/:activityId/submissions"
          element={
            <ProtectedRoute>
              <ActivitySubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/submissions/:id"
          element={
            <ProtectedRoute>
              <SubmissionDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
