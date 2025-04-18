
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { ThemeProvider } from "@/contexts/theme-context";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Redirecionar raiz para login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Rotas públicas */}
                <Route path="/login" element={<Login />} />
                
                {/* Rotas de assinatura */}
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/payment-simulation" element={<PaymentSimulation />} />
                <Route path="/select-categories" element={<SelectCategories />} />
                
                {/* Rotas protegidas */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/supplier/new" element={<SupplierForm />} />
                <Route path="/supplier/edit/:id" element={<SupplierForm />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/users" element={<Users />} />
                <Route path="/genius-network" element={<GeniusNetwork />} />
                
                {/* Novas rotas de administração */}
                <Route path="/highlights" element={<Highlights />} />
                <Route path="/products" element={<Products />} />
                <Route path="/ads" element={<Ads />} />
                <Route path="/issues" element={<Issues />} />
                
                {/* Rota para 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
