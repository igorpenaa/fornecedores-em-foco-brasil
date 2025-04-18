
import { useState, useEffect } from "react";
import { User } from "@/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authService } from "@/services/user-service";
import { stripeService, UserSubscription } from "@/services/stripe-service";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userData = await authService.getUserById(firebaseUser.uid);
          setUser(userData);
          setIsAuthenticated(true);
          
          const userSubscription = await stripeService.getUserSubscription(userData.id);
          setSubscription(userSubscription);
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
          setUser(null);
          setIsAuthenticated(false);
          setSubscription(null);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setSubscription(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, setUser, isAuthenticated, setIsAuthenticated, subscription, setSubscription, isLoading };
}
