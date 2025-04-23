
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDoc, setDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { userService } from "./user-service";

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

// URL da API Stripe
const STRIPE_API_URL = "https://api.stripe.com/v1";
const STRIPE_SECRET_KEY = "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";

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

  // Criar sessão de checkout do Stripe
  async createCheckoutSession(planId: PlanType, userId: string): Promise<string> {
    try {
      // O plano gratuito agora é tratado diretamente no PlanSelectionDialog
      // Esta verificação permanece como fallback
      if (planId === 'free') {
        await this.registerFreeSubscription(userId);
        return '/dashboard';
      }

      const plan = this.getAvailablePlans().find(p => p.id === planId);
      if (!plan || !plan.priceId) {
        throw new Error('Plano não encontrado ou inválido');
      }

      // Verificar usuário para obter email
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }
      const userData = userDoc.data();
      const userEmail = userData.email;

      // Fazer chamada direta à API do Stripe para criar uma sessão de checkout
      const response = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'success_url': `${window.location.origin}/select-categories?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${window.location.origin}/plans`,
          'mode': 'subscription',
          'customer_email': userEmail,
          'line_items[0][price]': plan.priceId,
          'line_items[0][quantity]': '1',
          'payment_method_types[0]': 'card'
        })
      });

      const session = await response.json();
      
      if (session.error) {
        throw new Error(session.error.message || 'Erro ao criar sessão de checkout');
      }

      // Registrar a sessão no Firestore
      await addDoc(collection(db, 'stripeCheckoutSessions'), {
        userId,
        planId,
        priceId: plan.priceId,
        sessionId: session.id,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      
      return session.url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw new Error('Não foi possível iniciar o processo de pagamento');
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
