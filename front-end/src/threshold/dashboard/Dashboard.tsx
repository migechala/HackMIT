import type { ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DatacenterList from './pages/DatacenterList';
import DatacenterDetail from './pages/detail/DatacenterDetail';
import Overview from './pages/detail/Overview';
import FinancialImpact from './pages/detail/FinancialImpact';
import SiteIntelligence from './pages/detail/SiteIntelligence';
import { useTheme } from '../useTheme';
import './dashboard.css';

/**
 * /dashboard/* — Laura's dashboard (origin/laura-frontend): login, facility list, and the
 * 3-tab sidebar detail view (Overview, Financial Impact, Site Intelligence). Her app's /app/*
 * routes are mounted here under /dashboard/*.
 */

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dashboard/login" replace />;
  return <>{children}</>;
}

/** Scopes her theme tokens (.dash-root) and gives the page her cream background. */
function Shell() {
  useTheme('dash');
  return (
    <div className="dash-root min-h-screen">
      <Outlet />
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<RequireAuth><DatacenterList /></RequireAuth>} />
          <Route path="login" element={<Login />} />
          <Route path=":dcId" element={<RequireAuth><DatacenterDetail /></RequireAuth>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="financial" element={<FinancialImpact />} />
            <Route path="compliance" element={<Navigate to="../financial" replace />} />
            <Route path="site-intelligence" element={<SiteIntelligence />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
