
import { supabase } from "@/integrations/supabase/client";
import { getAvailablePlans } from "./plans-config";
import { freeSubscriptionService } from "./free-subscription-service";
import { paidSubscriptionService } from "./paid-subscription-service";
import { subscriptionManagementService } from "./subscription-management-service";
import { PlanType } from "./types";

class StripeService {
  getAvailablePlans = getAvailablePlans;

  // Create checkout session for subscription
  async createCheckoutSession(planId: PlanType, userId: string): Promise<string> {
    try {
      // For free plan, register directly without Stripe checkout
      if (planId === 'free') {
        await this.registerFreeSubscription(userId);
        return '/dashboard';
      }

      console.log("Creating checkout session for plan:", planId);
      
      try {
        // For paid plans, call Supabase edge function with robust error handling
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId, userId },
          headers: {
            "Content-Type": "application/json"
          }
        });

        console.log("Checkout response:", { data, error });

        if (error) {
          console.error("Error during checkout:", error);
          throw new Error(error.message || "Failed to create checkout session");
        }
        
        if (!data?.url) {
          throw new Error('No checkout URL returned from the server');
        }

        return data.url;
      } catch (error: any) {
        console.error('Error calling create-checkout function:', error);
        throw new Error(`Checkout error: ${error.message || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Check subscription status
  async checkSubscription(userId: string): Promise<{
    subscribed: boolean;
    planType?: PlanType;
    subscriptionEnd?: string;
  }> {
    try {
      console.log("Checking subscription for user:", userId);
      
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: { userId },
          headers: {
            "Content-Type": "application/json"
          }
        });

        console.log("Subscription check response:", { data, error });

        if (error) {
          console.error("Error checking subscription:", error);
          throw error;
        }
        
        return {
          subscribed: data.subscribed,
          planType: data.plan_type,
          subscriptionEnd: data.subscription_end
        };
      } catch (error: any) {
        console.error('Error calling check-subscription function:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      
      // Return default values on error to prevent UI crashes
      return {
        subscribed: false
      };
    }
  }

  // Registrar assinatura gratuita
  registerFreeSubscription = freeSubscriptionService.registerFreeSubscription;

  // Registrar assinatura paga
  registerPaidSubscription = paidSubscriptionService.registerPaidSubscription;

  // Obter assinatura do usuário
  getUserSubscription = subscriptionManagementService.getUserSubscription;

  // Atualizar categorias selecionadas
  updateSelectedCategories = subscriptionManagementService.updateSelectedCategories;

  // Verificar acesso a categoria
  hasAccessToCategory = subscriptionManagementService.hasAccessToCategory;

  // Simular pagamento (apenas para fins de demonstração)
  async simulatePaymentSuccess(sessionId: string, userId: string, planType: PlanType): Promise<void> {
    try {
      // Em um cenário real, isso viria da resposta do webhook do Stripe
      const mockStripeCustomerId = `cus_${Math.random().toString(36).substring(2, 15)}`;
      const mockStripeSubscriptionId = `sub_${Math.random().toString(36).substring(2, 15)}`;
      
      await this.registerPaidSubscription(
        userId,
        planType,
        mockStripeCustomerId,
        mockStripeSubscriptionId
      );
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      throw new Error('Não foi possível completar a simulação de pagamento');
    }
  }
}

export const stripeService = new StripeService();
