import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";
import { SharedPlanDialog, usePlanDialog } from "@/components/plans/shared-plan-dialog";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/toast";

export default function Dashboard() {
  const { user, isFirstAccess, markFirstAccessCompleted } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setIsOpen, userClosedDialog, resetUserClosed } = usePlanDialog();
  const effectExecuted = useRef(false);
  const { toast } = useToast();

  const canAccessFeatures = user?.plano && ['monthly', 'semi_annual', 'annual'].includes(user.plano);

  // Check for successful Stripe checkout
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      toast({
        title: "Assinatura ativada!",
        description: "Sua assinatura foi ativada com sucesso.",
      });
      
      // Remove the session_id from the URL
      const newURL = window.location.pathname;
      window.history.replaceState({}, '', newURL);
    }
  }, [searchParams, toast]);

  // Efeito para controlar a abertura do diálogo de planos
  useEffect(() => {
    // Se o usuário fechou o diálogo manualmente, não reabra
    if (userClosedDialog) return;
    
    // Evitar múltiplas execuções do efeito no mesmo ciclo de vida
    if (effectExecuted.current) return;
    
    // Verificar se o diálogo deve ser mostrado
    const shouldShowDialog = 
      isFirstAccess || 
      (location.state && location.state.showPlanDialog);
      
    if (shouldShowDialog) {
      setIsOpen(true);
      effectExecuted.current = true;
      
      // Se for o primeiro acesso e o usuário tiver um ID, marque como concluído
      if (isFirstAccess && user?.id) {
        markFirstAccessCompleted(user.id);
      }
    }
    
    // Limpar o state para evitar que ele persista após navegação
    if (location.state?.showPlanDialog) {
      window.history.replaceState({}, document.title);
    }
  }, [isFirstAccess, user?.id, markFirstAccessCompleted, setIsOpen, location.state, userClosedDialog]);
  
  // Resetar o state de userClosed ao desmontar o componente
  useEffect(() => {
    return () => {
      resetUserClosed();
      effectExecuted.current = false;
    };
  }, [resetUserClosed]);

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
