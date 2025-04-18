
import { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "./auth/useAuthState";
import { createAuthActions } from "./auth/authActions";
import { createAccessControl } from "./auth/accessControl";
import { AuthContextType } from "./auth/types";
import { authService } from "@/services/user-service";
import { stripeService } from "@/services/stripe-service";
import { GeniusStatus } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { 
    user, 
    setUser, 
    isAuthenticated, 
    setIsAuthenticated, 
    subscription, 
    setSubscription,
    isLoading 
  } = useAuthState();

  const { login, register, logout } = createAuthActions(setUser, setIsAuthenticated);
  const { hasPermission, canAccessGenius, hasAccessToCategory } = createAccessControl(user);

  const toggleFavorite = async (supplierId: string) => {
    if (!user) return;
    
    try {
      const newFavorites = await authService.toggleFavorite(user.id, supplierId);
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          favorites: newFavorites
        };
      });
    } catch (error) {
      console.error("Erro ao atualizar favoritos:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar favoritos",
        description: "Não foi possível atualizar seus favoritos. Tente novamente.",
      });
    }
  };

  const isFavorite = (supplierId: string): boolean => {
    if (!user) return false;
    return user.favorites.includes(supplierId);
  };

  const updateGeniusStatus = async (userId: string, status: GeniusStatus) => {
    try {
      await authService.updateGeniusStatus(userId, status);
      if (user && user.id === userId) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            geniusStatus: status
          };
        });
      }
      toast({
        title: status === "approved" ? "Acesso liberado!" : "Status atualizado",
        description: status === "approved" 
          ? "O aluno agora tem acesso à Rede Genius" 
          : "O status do aluno foi atualizado."
      });
    } catch (error) {
      console.error("Erro ao atualizar status Genius:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do usuário.",
      });
      throw error;
    }
  };

  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      return;
    }

    try {
      const userSubscription = await stripeService.getUserSubscription(user.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error("Erro ao carregar assinatura:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar assinatura",
        description: "Não foi possível carregar os dados da sua assinatura.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      hasPermission,
      toggleFavorite,
      isFavorite,
      updateGeniusStatus,
      canAccessGenius,
      subscription,
      refreshSubscription,
      hasAccessToCategory,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
