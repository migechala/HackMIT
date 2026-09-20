import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DatacenterList from './pages/DatacenterList'
import DatacenterDetail from './pages/detail/DatacenterDetail'
import Overview from './pages/detail/Overview'
import Financial from './pages/detail/Financial'
import Compliance from './pages/detail/Compliance'
import SiteIntelligence from './pages/detail/SiteIntelligence'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <DatacenterList />
              </RequireAuth>
            }
          />
          <Route
            path="/app/:dcId"
            element={
              <RequireAuth>
                <DatacenterDetail />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="financial" element={<Financial />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="site-intelligence" element={<SiteIntelligence />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
