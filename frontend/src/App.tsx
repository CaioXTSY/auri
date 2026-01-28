import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { DashboardHome } from '@/pages/dashboard/DashboardHome';
import { MyClasses } from '@/pages/dashboard/MyClasses';
import { ProtectedRoute } from '@/components/layouts/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      </Routes>
    </Router>
  );
}

export default App;
