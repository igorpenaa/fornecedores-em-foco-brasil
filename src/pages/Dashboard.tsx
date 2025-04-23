
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

  // Fix: Add dependency array and only run the effect when necessary conditions change
  useEffect(() => {
    // Check if dialog should be shown based on first access or location state
    const shouldShowDialog = 
      isFirstAccess || 
      (location.state && location.state.showPlanDialog);
      
    // Only open the dialog if shouldShowDialog is true
    if (shouldShowDialog) {
      setIsOpen(true);
      
      // If it's the first access and the user has an ID, mark it as completed
      if (isFirstAccess && user?.id) {
        markFirstAccessCompleted(user.id);
      }
    }
  }, [isFirstAccess, user?.id, markFirstAccessCompleted, setIsOpen, location.state]);

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
