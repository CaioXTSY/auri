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
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

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
          path="/dashboard/classes"
          element={
            <ProtectedRoute>
              <MyClasses />
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
          path="/dashboard/teacher/classes/:classId/activities/new"
          element={
            <ProtectedRoute>
              <CreateActivity />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
