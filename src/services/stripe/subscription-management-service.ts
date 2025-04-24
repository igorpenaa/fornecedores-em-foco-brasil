
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserSubscription } from "./types";

export const subscriptionManagementService = {
  getUserSubscription: async (userId: string): Promise<UserSubscription | null> => {
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
  },

  updateSelectedCategories: async (userId: string, categoryIds: string[]): Promise<void> => {
    try {
      const subscriptionRef = doc(db, 'subscriptions', userId);
      const subscriptionSnap = await getDoc(subscriptionRef);
      
      if (!subscriptionSnap.exists()) {
        throw new Error('Assinatura não encontrada');
      }
      
      await updateDoc(subscriptionRef, {
        selectedCategories: categoryIds
      });
    } catch (error) {
      console.error('Erro ao atualizar categorias selecionadas:', error);
      throw error;
    }
  },

  hasAccessToCategory: async (userId: string, categoryId: string): Promise<boolean> => {
    try {
      const subscription = await subscriptionManagementService.getUserSubscription(userId);
      
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
};
