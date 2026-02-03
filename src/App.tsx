import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Lazy loaded pages for code splitting
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BuildingsPage = lazy(() => import("./pages/BuildingsPage"));
const UnitsPage = lazy(() => import("./pages/UnitsPage"));
const TenantsPage = lazy(() => import("./pages/TenantsPage"));
const LeasesPage = lazy(() => import("./pages/LeasesPage"));
const BillingsPage = lazy(() => import("./pages/BillingsPage"));
const NewBillingPage = lazy(() => import("./pages/NewBillingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/gebaeude" element={<ProtectedRoute><BuildingsPage /></ProtectedRoute>} />
        <Route path="/gebaeude/:buildingId/einheiten" element={<ProtectedRoute><UnitsPage /></ProtectedRoute>} />
        <Route path="/mieter" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
        <Route path="/mietvertraege" element={<ProtectedRoute><LeasesPage /></ProtectedRoute>} />
        <Route path="/abrechnungen" element={<ProtectedRoute><BillingsPage /></ProtectedRoute>} />
        <Route path="/abrechnungen/neu" element={<ProtectedRoute><NewBillingPage /></ProtectedRoute>} />
        <Route path="/abrechnungen/:id" element={<ProtectedRoute><NewBillingPage /></ProtectedRoute>} />
        <Route path="/einstellungen" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
