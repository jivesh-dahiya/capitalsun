import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import { useTheme } from './lib/useTheme';
import AppShell from './layout/AppShell';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import StcAssignmentFormPage from './pages/jobs/StcAssignmentFormPage';
import InstallersPage from './pages/installers/InstallersPage';
import InventoryPage from './pages/inventory/InventoryPage';
import Profile from './pages/Profile';
import LeadsPage from './pages/leads/LeadsPage';
import QuotesPage from './pages/quotes/QuotesPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ServiceTicketsPage from './pages/service/ServiceTicketsPage';
import AcceptQuote from './pages/AcceptQuote';
import ResetPassword from './pages/ResetPassword';
import PublicChatWidget from './pages/PublicChatWidget';
import ChoosePlanPage from './pages/billing/ChoosePlanPage';
import BillingSuccessPage from './pages/billing/BillingSuccessPage';

// Map + roof-design pages pull in leaflet/leaflet-draw/turf, which is most
// of the app's JS weight — loading them only when visited keeps the initial
// bundle (and every other page's load time) small.
const MapPage = lazy(() => import('./pages/map/MapPage'));
const QuoteDesignPage = lazy(() => import('./pages/quotes/QuoteDesignPage'));

function RouteFallback() {
  return <div className="panel empty-state">Loading…</div>;
}

function App() {
  const { session, loading, subscription } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // The ?mode=signup bootstrap link's session goes truthy mid-signUp() (as
  // soon as Supabase establishes it), well before the Login component's own
  // post-signup cleanup would run — often unmounting Login first. Strip the
  // param here instead, driven by session state rather than component
  // lifecycle, so a later logout correctly remounts into sign-in, not signup.
  // Uses React Router's own navigate() rather than raw history.replaceState —
  // the latter changes the URL bar but leaves React Router's own location
  // state (what useSearchParams() actually reads) stale, since it doesn't
  // intercept history calls made outside its own APIs.
  useEffect(() => {
    if (session && location.search.includes('mode=signup')) {
      navigate(location.pathname, { replace: true });
    }
  }, [session, location.pathname, location.search, navigate]);

  // Public, unauthenticated surface: customers accept a proposal without ever logging in.
  if (location.pathname.startsWith('/accept/')) {
    return (
      <Routes>
        <Route path="/accept/:token" element={<AcceptQuote />} />
      </Routes>
    );
  }

  // Public, unauthenticated surface: the embeddable website chat widget.
  if (location.pathname.startsWith('/chat/')) {
    return (
      <Routes>
        <Route path="/chat/:companyId" element={<PublicChatWidget />} />
      </Routes>
    );
  }

  // The password-recovery link lands here with its own temporary session,
  // regardless of whether the browser was already signed in as someone else.
  if (location.pathname === '/reset-password') {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  if (loading) {
    return <div className="auth-shell"><div className="panel empty-state">Loading…</div></div>;
  }

  if (!session) {
    return location.pathname === '/login' ? <Login theme={theme} /> : <Landing theme={theme} />;
  }

  // A company with no active subscription — either a brand-new signup that
  // hasn't picked a plan yet, or an existing one whose payment lapsed —
  // sees only the billing flow until it's active. Grandfathered companies
  // (see the billing migration) already have an active row, so this never
  // catches anyone who was using the app before billing existed.
  const subscriptionActive = subscription?.status === 'active';

  return (
    <Routes>
      <Route path="/billing/choose-plan" element={<ChoosePlanPage />} />
      <Route path="/billing/success" element={<BillingSuccessPage />} />
      {subscriptionActive ? (
        <Route element={<AppShell theme={theme} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<Suspense fallback={<RouteFallback />}><MapPage /></Suspense>} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/quotes/:quoteId/design" element={<Suspense fallback={<RouteFallback />}><QuoteDesignPage /></Suspense>} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route path="/jobs/:jobId/stc-form" element={<StcAssignmentFormPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/service" element={<ServiceTicketsPage />} />
          <Route path="/installers" element={<InstallersPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/billing/choose-plan" replace />} />
      )}
    </Routes>
  );
}

export default App;
