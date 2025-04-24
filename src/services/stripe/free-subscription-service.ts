import { supabase } from "@/integrations/supabase/client";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserSubscription } from "./types";

export const freeSubscriptionService = {
  registerFreeSubscription: async (userId: string): Promise<void> => {
    try {
      // For Supabase, we'll update the user's profile with the free plan
      const { error } = await supabase
        .from('user_profiles')
        .update({ plan: 'free' })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user plan:', error);
        throw new Error('Não foi possível ativar o plano gratuito');
      }

      // For backwards compatibility with Firebase, keep this code
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
      
      try {
        await setDoc(doc(db, 'subscriptions', userId), subscription);
      } catch (fbError) {
        console.error('Firebase error (non-critical):', fbError);
        // Continue with Supabase (Firebase is just for backward compatibility)
      }
    } catch (error) {
      console.error('Erro ao registrar assinatura gratuita:', error);
      throw new Error('Não foi possível ativar o plano gratuito');
    }
  }
};
