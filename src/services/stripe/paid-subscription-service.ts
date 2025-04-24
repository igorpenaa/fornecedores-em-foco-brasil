
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userService } from "../user-service";
import { PlanType, UserSubscription } from "./types";

export const paidSubscriptionService = {
  registerPaidSubscription: async (
    userId: string, 
    planType: PlanType, 
    stripeCustomerId: string, 
    stripeSubscriptionId: string
  ): Promise<void> => {
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
};
