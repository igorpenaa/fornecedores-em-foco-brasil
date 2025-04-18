
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { useEffect } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import SupplierForm from "./pages/SupplierForm";
import Categories from "./pages/Categories";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import Users from "./pages/Users";
import GeniusNetwork from "./pages/GeniusNetwork";
import Highlights from "./pages/Highlights";
import Products from "./pages/Products";
import Ads from "./pages/Ads";
import Issues from "./pages/Issues";
import PlansPage from "./pages/PlansPage";
import PaymentSimulation from "./pages/PaymentSimulation";
import SelectCategories from "./pages/SelectCategories";

const queryClient = new QueryClient();

// Componente para proteger rotas que exigem assinatura
const SubscriptionRoute = () => {
  const { user, isAuthenticated, canAccessApp, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário estiver autenticado mas não tiver assinatura, redirecionar para planos
    if (!isLoading && isAuthenticated && !canAccessApp()) {
      navigate("/plans", { replace: true });
    }
  }, [isAuthenticated, canAccessApp, isLoading, navigate]);

  // Se estiver carregando, retorna null
  if (isLoading) {
    return null;
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se tiver acesso, renderizar o conteúdo da rota
  if (canAccessApp()) {
    return <Outlet />;
  }

  // Caso contrário, redirecionar para planos
  return <Navigate to="/plans" replace />;
};

// Componente para proteger rotas que exigem autenticação mas não assinatura
const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Componente para proteger rotas apenas para administradores
const AdminRoute = () => {
  const { user, isAuthenticated, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(["admin", "master"])) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Redirecionar raiz para login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      
      {/* Rotas de assinatura (requer autenticação) */}
      <Route element={<AuthRoute />}>
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/payment-simulation" element={<PaymentSimulation />} />
        <Route path="/select-categories" element={<SelectCategories />} />
        <Route path="/genius-network" element={<GeniusNetwork />} />
      </Route>
      
      {/* Rotas protegidas por assinatura */}
      <Route element={<SubscriptionRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/categories" element={<Categories />} />
      </Route>
      
      {/* Rotas de administração */}
      <Route element={<AdminRoute />}>
        <Route path="/supplier/new" element={<SupplierForm />} />
        <Route path="/supplier/edit/:id" element={<SupplierForm />} />
        <Route path="/users" element={<Users />} />
        <Route path="/highlights" element={<Highlights />} />
        <Route path="/products" element={<Products />} />
        <Route path="/ads" element={<Ads />} />
        <Route path="/issues" element={<Issues />} />
      </Route>
      
      {/* Rota para 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
