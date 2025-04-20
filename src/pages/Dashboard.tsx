
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";
import { PlanSelectionDialog } from "@/components/plans/plan-selection-dialog";

export default function Dashboard() {
  const { user } = useAuth();
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  const canAccessFeatures = user?.plano && user.plano !== 'free';

  return (
    <AppLayout title="Dashboard" subtitle="Bem-vindo ao Fornecedores">
      <div className="mb-8">
        <HighlightsCarousel />
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
