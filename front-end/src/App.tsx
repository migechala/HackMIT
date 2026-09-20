import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Landing from './threshold/landing/Landing';

// The original "civic asset" landing page is preserved at /civic-asset.
const LegacyLanding = lazy(() => import('./LegacyLanding'));
const Dashboard = lazy(() => import('./threshold/dashboard/Dashboard'));
const SiteIntelligence = lazy(() => import('./threshold/site/SiteIntelligence'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-[#5B5F56]">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/site-intelligence" element={<SiteIntelligence />} />
          <Route path="/civic-asset" element={<LegacyLanding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
