
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";
import { PlanSelectionDialog } from "@/components/plans/plan-selection-dialog";

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  // Verifica se o usuário pode acessar os recursos premium
  const canAccessFeatures = user?.plano && ['monthly', 'semi_annual', 'annual'].includes(user.plano);

  // Abre o diálogo se vier da navegação após login
  useEffect(() => {
    if (location.state?.showPlanDialog) {
      setShowPlanDialog(true);
    }
  }, [location.state]);

  return (
    <AppLayout title="Dashboard" subtitle="Bem-vindo ao Fornecedores">
      <div className="mb-8">
        <HighlightsCarousel onUpgradeRequired={() => setShowPlanDialog(true)} disabled={!canAccessFeatures} />
      </div>
      
      <div className="mb-10">
        <AdsDisplay />
      </div>
      
      <div>
        <ProductsShowcase onUpgradeRequired={() => setShowPlanDialog(true)} disabled={!canAccessFeatures} />
      </div>

      <PlanSelectionDialog 
        open={showPlanDialog} 
        onOpenChange={setShowPlanDialog} 
      />
    </AppLayout>
  );
}
