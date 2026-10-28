import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './platform/auth';
import { LoadingScreen, FullScreenMessage, btn } from './platform/ui';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import MisApps from './pages/MisApps';
import AppPage from './pages/AppPage';
import './index.css';

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/ingresar" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function NotFound() {
  return (
    <FullScreenMessage title="Página no encontrada">
      <a href="/" className={btn.gold}>Ir al inicio</a>
    </FullScreenMessage>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/restablecer" element={<ResetPassword />} />
          <Route path="/mis-apps" element={<RequireAuth><MisApps /></RequireAuth>} />
          <Route path="/apps/:slug" element={<RequireAuth><AppPage /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
