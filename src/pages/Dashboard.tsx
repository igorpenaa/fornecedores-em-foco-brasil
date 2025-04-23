
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";
import { SharedPlanDialog, usePlanDialog } from "@/components/plans/shared-plan-dialog";

export default function Dashboard() {
  const { user, isFirstAccess, markFirstAccessCompleted } = useAuth();
  const location = useLocation();
  const { setIsOpen } = usePlanDialog();

  const canAccessFeatures = user?.plano && ['monthly', 'semi_annual', 'annual'].includes(user.plano);

  useEffect(() => {
    // Mostra o diálogo se for o primeiro acesso ou se o usuário tem plano free
    if (isFirstAccess) {
      setIsOpen(true);
      
      // Se for o primeiro acesso e o usuário já tiver um ID, marque como concluído
      if (user?.id) {
        markFirstAccessCompleted(user.id);
      }
    }
  }, [isFirstAccess, user, setIsOpen, markFirstAccessCompleted]);

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
