import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDoc, setDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { userService } from "./user-service";
import { supabase } from "@/integrations/supabase/client";

// IDs dos preços no Stripe
const PRICE_IDS = {
  MONTHLY: "price_1RDxMLF8ZVI3gHwE4BYIgzy1",      // Mensal - R$ 47,00
  SEMI_ANNUAL: "price_1RDxRCF8ZVI3gHwEhCAB049h",  // Semestral - R$ 145,00
  ANNUAL: "price_1RDxRCF8ZVI3gHwEbf17KfeO"        // Anual - R$ 193,00
};

// Tipos de planos
export type PlanType = 'free' | 'monthly' | 'semi_annual' | 'annual';

// Interface para o plano
export interface Plan {
  id: PlanType;
  title: string;
  price: number;
  description: string;
  features: string[];
  priceId?: string;
  savings?: string;
  maxCategories?: number;
  highlighted?: boolean;
}

// Interface para o usuário com assinatura
export interface UserSubscription {
  userId: string;
  planType: PlanType;
  status: 'active' | 'canceled' | 'past_due';
  startDate: Date;
  endDate: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  selectedCategories?: string[];
}

// URL da API para funções do Firebase (simulada até você configurar as funções reais)
const FIREBASE_FUNCTIONS_BASE_URL = "https://us-central1-fornecedores-99ee2.cloudfunctions.net";

// Serviço de Stripe
class StripeService {
  // Obter todos os planos disponíveis
  getAvailablePlans(): Plan[] {
    return [
      {
        id: 'free',
        title: 'Gratuito',
        price: 0,
        description: 'Acesso a 5 fornecedores gratuitos',
        features: [
          'Acesso a 5 fornecedores gratuitos',
          'Visualização básica de fornecedores'
        ],
        maxCategories: 0
      },
      {
        id: 'monthly',
        title: 'Mensal',
        price: 47,
        description: 'Acesso a até 10 categorias diferentes',
        features: [
          'Escolha 10 categorias',
          'Acesso aos fornecedores gratuitos',
          'Visualização de destaques',
          'Suporte básico'
        ],
        priceId: PRICE_IDS.MONTHLY,
        maxCategories: 10
      },
      {
        id: 'semi_annual',
        title: 'Semestral',
        price: 145,
        description: 'Acesso a até 20 categorias diferentes',
        features: [
          'Escolha 20 categorias',
          'Acesso aos fornecedores gratuitos',
          'Visualização de destaques',
          'Suporte premium',
          'Filtros avançados'
        ],
        priceId: PRICE_IDS.SEMI_ANNUAL,
        savings: 'Economize R$ 137,00',
        maxCategories: 20,
        highlighted: true
      },
      {
        id: 'annual',
        title: 'Anual',
        price: 193,
        description: 'Acesso a todas as categorias e recursos',
        features: [
          'Acesso a todas as categorias',
          'Produtos em destaque',
          'Filtros por categoria',
          'Filtro por avaliação',
          'Perfil completo da empresa',
          'Link direto para WhatsApp',
          'Suporte prioritário'
        ],
        priceId: PRICE_IDS.ANNUAL,
        savings: 'Economize R$ 371,00',
        maxCategories: Infinity
      }
    ];
  }

  // Create checkout session for subscription
  async createCheckoutSession(planId: PlanType, userId: string): Promise<string> {
    try {
      // For free plan, register directly without Stripe checkout
      if (planId === 'free') {
        await this.registerFreeSubscription(userId);
        return '/dashboard';
      }

      // For paid plans, create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId }
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error('No checkout URL returned');

      return data.url;
    } catch (error) {
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
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;
      return {
        subscribed: data.subscribed,
        planType: data.plan_type,
        subscriptionEnd: data.subscription_end
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      throw error;
    }
  }

  // Registrar assinatura gratuita
  async registerFreeSubscription(userId: string): Promise<void> {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 99); // "Expiração" longa para plano gratuito
      
      const subscription: UserSubscription = {
        userId,
        planType: 'free',
        status: 'active',
        startDate: now,
        endDate,
        selectedCategories: []
      };
      
      await setDoc(doc(db, 'subscriptions', userId), subscription);
      
      // Atualizar o campo plano do usuário
      await userService.updateUserPlan(userId, 'free');
    } catch (error) {
      console.error('Erro ao registrar assinatura gratuita:', error);
      throw new Error('Não foi possível ativar o plano gratuito');
    }
  }

  // Registrar assinatura paga (após confirmação de pagamento)
  async registerPaidSubscription(
    userId: string, 
    planType: PlanType, 
    stripeCustomerId: string, 
    stripeSubscriptionId: string
  ): Promise<void> {
    try {
      const now = new Date();
      let endDate = new Date();
      
      // Define a data de expiração com base no tipo de plano
      switch (planType) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'semi_annual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      
      const subscription: UserSubscription = {
        userId,
        planType,
        status: 'active',
        startDate: now,
        endDate,
        stripeCustomerId,
        stripeSubscriptionId,
        selectedCategories: []
      };
      
      await setDoc(doc(db, 'subscriptions', userId), subscription);
      
      // Atualizar o campo plano do usuário
      await userService.updateUserPlan(userId, planType);
    } catch (error) {
      console.error('Erro ao registrar assinatura paga:', error);
      throw new Error('Não foi possível ativar a assinatura');
    }
  }

  // Obter assinatura do usuário
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(db, 'subscriptions', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSubscription;
        
        // Converter Timestamps para Dates
        if (data.startDate instanceof Timestamp) {
          data.startDate = data.startDate.toDate();
        }
        
        if (data.endDate instanceof Timestamp) {
          data.endDate = data.endDate.toDate();
        }
        
        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter assinatura do usuário:', error);
      return null;
    }
  }

  // Atualizar categorias selecionadas na assinatura
  async updateSelectedCategories(userId: string, categoryIds: string[]): Promise<void> {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        throw new Error('Assinatura não encontrada');
      }
      
      const subscription = subscriptionSnap.data() as UserSubscription;
      const plan = this.getAvailablePlans().find(p => p.id === subscription.planType);
      
      if (!plan) {
        throw new Error('Plano não encontrado');
      }
      
      // Verificar se o número de categorias está dentro do limite do plano
      if (plan.maxCategories !== undefined && plan.maxCategories < categoryIds.length) {
        throw new Error(`Você só pode selecionar até ${plan.maxCategories} categorias com seu plano atual`);
      }
      
      await updateDoc(subscriptionRef, {
        selectedCategories: categoryIds
      });
    } catch (error) {
      console.error('Erro ao atualizar categorias selecionadas:', error);
      throw error;
    }
  }

  // Verificar se o usuário tem acesso a uma categoria específica
  async hasAccessToCategory(userId: string, categoryId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return false;
      }
      
      // Se for plano anual, tem acesso a todas as categorias
      if (subscription.planType === 'annual') {
        return true;
      }
      
      // Verifica se a categoria está entre as selecionadas
      return subscription.selectedCategories?.includes(categoryId) || false;
    } catch (error) {
      console.error('Erro ao verificar acesso à categoria:', error);
      return false;
    }
  }

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
      
      // Atualizar o status da sessão para completado
      const sessionRef = doc(db, 'stripeCheckoutSessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        stripeCustomerId: mockStripeCustomerId,
        stripeSubscriptionId: mockStripeSubscriptionId
      });
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      throw new Error('Não foi possível completar a simulação de pagamento');
    }
  }
}

export const stripeService = new StripeService();
