
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";
import { SharedPlanDialog, usePlanDialog } from "@/components/plans/shared-plan-dialog";

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const { setIsOpen } = usePlanDialog();

  // Verifica se o usuário pode acessar os recursos premium
  const canAccessFeatures = user?.plano && ['monthly', 'semi_annual', 'annual'].includes(user.plano);

  // Abre o diálogo se vier da navegação após login
  useEffect(() => {
    if (location.state?.showPlanDialog) {
      setIsOpen(true);
    }
  }, [location.state, setIsOpen]);

  return (
    <AppLayout title="Dashboard" subtitle="Bem-vindo ao Fornecedores">
      <div className="mb-8">
        <HighlightsCarousel onUpgradeRequired={() => setIsOpen(true)} disabled={!canAccessFeatures} />
      </div>
      
      <div className="mb-10">
        <AdsDisplay />
      </div>
      
      <div>
        <ProductsShowcase onUpgradeRequired={() => setIsOpen(true)} disabled={!canAccessFeatures} />
      </div>

      <SharedPlanDialog />
    </AppLayout>
  );
}
