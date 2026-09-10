import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import ProviderLayout from './layouts/ProviderLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Provider pages
import ProviderDashboard from './pages/provider/Dashboard';
import ProviderProfile from './pages/provider/Profile';
import ApplicationStatus from './pages/provider/ApplicationStatus';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Providers from './pages/admin/Providers';
import ProviderDetail from './pages/admin/ProviderDetail';

// Ant Design theme customization
const antTheme = {
  token: {
    colorPrimary: '#4f46e5',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const App = () => {
  return (
    <ConfigProvider theme={antTheme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Provider routes */}
            <Route element={<ProtectedRoute role="provider" />}>
              <Route element={<ProviderLayout />}>
                <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                <Route path="/provider/profile" element={<ProviderProfile />} />
                <Route path="/provider/application" element={<ApplicationStatus />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute role="admin" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/providers" element={<Providers />} />
                <Route path="/admin/providers/:id" element={<ProviderDetail />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
