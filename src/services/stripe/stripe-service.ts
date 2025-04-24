
import { supabase } from "@/integrations/supabase/client";
import { getAvailablePlans } from "./plans-config";
import { freeSubscriptionService } from "./free-subscription-service";
import { paidSubscriptionService } from "./paid-subscription-service";
import { subscriptionManagementService } from "./subscription-management-service";
import { PlanType } from "./types";
import { FunctionsHttpError } from '@supabase/supabase-js';

class StripeService {
  getAvailablePlans = getAvailablePlans;

  // Create checkout session for subscription
  async createCheckoutSession(planId: PlanType, userId: string): Promise<string> {
    try {
      // Para plano gratuito, registrar diretamente sem checkout do Stripe
      if (planId === 'free') {
        await this.registerFreeSubscription(userId);
        return '/dashboard';
      }

      console.log("Criando sessão de checkout para o plano:", planId, "userId:", userId);
      
      try {
        // Validar entradas
        if (!planId || !userId) {
          throw new Error("ID do plano e ID do usuário são obrigatórios");
        }

        // CORREÇÃO: Enviar dados no formato correto para a função Edge
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { planId, userId } 
        });

        console.log("Resposta do checkout:", { data, error });

        if (error) {
          // Tratamento específico para erros de função HTTP
          if (error instanceof FunctionsHttpError) {
            try {
              const errorMessage = await error.context.json();
              console.error("Erro detalhado na função de checkout:", errorMessage);
              throw new Error(errorMessage.error || "Erro no servidor durante checkout");
            } catch (jsonError) {
              console.error("Erro ao processar resposta de erro:", error.message);
              throw new Error(`Erro no checkout: ${error.message}`);
            }
          } else {
            console.error("Erro durante o checkout:", error);
            throw new Error(error.message || "Falha ao criar sessão de checkout");
          }
        }
        
        if (!data?.url) {
          throw new Error('Nenhuma URL de checkout retornada pelo servidor');
        }

        return data.url;
      } catch (error: any) {
        console.error('Erro ao chamar função create-checkout:', error);
        throw new Error(`Erro no checkout: ${error.message || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error('Erro ao criar sessão de checkout:', error);
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
      console.log("Verificando assinatura para usuário:", userId);
      
      if (!userId) {
        console.error("ID do usuário não fornecido para verificação de assinatura");
        return { subscribed: false };
      }

      try {
        // CORREÇÃO: Enviar dados no formato correto para a função Edge
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: { userId }
        });

        console.log("Resposta da verificação de assinatura:", { data, error });

        if (error) {
          // Tratamento específico para erros de função HTTP
          if (error instanceof FunctionsHttpError) {
            try {
              const errorMessage = await error.context.json();
              console.error("Erro detalhado na função de verificação:", errorMessage);
              throw new Error(errorMessage.error || "Erro no servidor durante verificação");
            } catch (jsonError) {
              console.error("Erro ao processar resposta de erro:", error.message);
              throw new Error(`Erro na verificação: ${error.message}`);
            }
          } else {
            console.error("Erro ao verificar assinatura:", error);
            throw error;
          }
        }
        
        return {
          subscribed: data.subscribed,
          planType: data.plan_type,
          subscriptionEnd: data.subscription_end
        };
      } catch (error: any) {
        console.error('Erro ao chamar função check-subscription:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Erro ao verificar assinatura:', error);
      
      // Retornar valores padrão em caso de erro para evitar falhas na UI
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
