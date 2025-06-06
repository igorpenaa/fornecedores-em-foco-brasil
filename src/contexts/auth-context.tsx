import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, GeniusStatus } from '@/types';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from "firebase/auth";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { usePlanDialog } from '@/components/plans/shared-plan-dialog';
import { authService } from '@/services/user-service';
import { UserSubscription } from '@/services/stripe-service';
import { stripeService } from '@/services/stripe-service';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscription: UserSubscription | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, geniusCoupon?: string) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (roles: UserRole[]) => boolean;
  canAccessApp: () => boolean;
  canAccessGenius: () => boolean;
  isFavorite: (supplierId: string) => boolean;
  toggleFavorite: (supplierId: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateGeniusStatus: (userId: string, status: GeniusStatus) => Promise<void>;
  markFirstAccessCompleted: (userId: string) => Promise<void>;
  refreshSubscription: () => Promise<UserSubscription | null>;
  hasAccessToCategory: (categoryId: string) => Promise<boolean>;
  isFirstAccess: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  subscription: null,
  login: async () => ({ id: '', name: '', email: '', role: 'user', favorites: [] }),
  register: async () => ({ id: '', name: '', email: '', role: 'user', favorites: [] }),
  logout: async () => {},
  hasPermission: () => false,
  canAccessApp: () => false,
  canAccessGenius: () => false,
  isFavorite: () => false,
  toggleFavorite: async () => {},
  updateUser: async () => {},
  updateGeniusStatus: async () => {},
  markFirstAccessCompleted: async () => {},
  refreshSubscription: async () => null,
  hasAccessToCategory: async () => false,
  isFirstAccess: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>{children}</>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const { toast } = useToast();
  const { setIsOpen } = usePlanDialog();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await authService.getUserById(authUser.uid);
          setUser(userDoc);
          setIsAuthenticated(true);
          
          try {
            const subStatus = await stripeService.checkSubscription(authUser.uid);
            
            // Create proper UserSubscription object from the response
            if (subStatus.subscribed) {
              const now = new Date();
              const endDate = subStatus.subscriptionEnd ? new Date(subStatus.subscriptionEnd) : new Date();
              
              setSubscription({
                userId: authUser.uid,
                planType: subStatus.planType || 'free',
                status: 'active',
                startDate: now,
                endDate: endDate,
                selectedCategories: []
              });
            } else {
              setSubscription(null);
            }
          } catch (subscriptionError) {
            console.error("Error checking subscription:", subscriptionError);
            // Don't let subscription errors prevent authentication
            setSubscription(null);
          }
          
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setIsAuthenticated(false);
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

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const user = await authService.login(email, password);
      setUser(user);
      setIsAuthenticated(true);
      
      return user;
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, geniusCoupon?: string): Promise<User> => {
    try {
      const user = await authService.register(name, email, password, geniusCoupon);
      setUser(user);
      setIsAuthenticated(true);
      
      return user;
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      toast({
        title: "Erro ao registrar",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setSubscription(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Não foi possível fazer logout",
        variant: "destructive",
      });
    }
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    return !!user && roles.includes(user.role);
  };

  const canAccessApp = (): boolean => {
    if (!user) return false;
    
    if (user.role === "admin" || user.role === "master") {
      return true;
    }
    
    return !!user.plano;
  };
  
  const canAccessGenius = (): boolean => {
    if (!user) return false;
    
    if (user.role === "admin" || user.role === "master") {
      return true;
    }
    
    if (user.geniusCoupon === "ALUNOREDEGENIUS") {
      return user.geniusStatus === "approved";
    }
    
    return false;
  };
  
  const isFavorite = (supplierId: string): boolean => {
    return !!user && user.favorites.includes(supplierId);
  };

  const toggleFavorite = async (supplierId: string) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para adicionar aos favoritos",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newFavorites = await authService.toggleFavorite(user.id, supplierId);
      setUser({ ...user, favorites: newFavorites });
    } catch (error: any) {
      console.error("Erro ao adicionar/remover favorito:", error);
      toast({
        title: "Erro ao adicionar/remover favorito",
        description: error.message || "Não foi possível adicionar/remover o favorito",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para atualizar seu perfil",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedUser = await authService.updateUser(user.id, userData);
      setUser({ ...user, ...updatedUser });
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar seu perfil",
        variant: "destructive",
      });
    }
  };

  const updateGeniusStatus = async (userId: string, status: GeniusStatus): Promise<void> => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para atualizar seu status",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newStatus = await authService.updateGeniusStatus(userId, status);
      if (userId === user.id) {
        setUser({ ...user, geniusStatus: newStatus });
      }
      toast({
        title: "Status atualizado",
        description: "Status atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const markFirstAccessCompleted = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        firstAccessCompleted: true
      });
      
      if (user && userId === user.id) {
        setUser({ ...user, firstAccessCompleted: true });
      }
    } catch (error) {
      console.error('Erro ao marcar primeiro acesso:', error);
    }
  };
  
  const refreshSubscription = async (): Promise<UserSubscription | null> => {
    if (!user) return null;
    
    try {
      const subStatus = await stripeService.checkSubscription(user.id);
      
      if (subStatus.subscribed && subStatus.planType) {
        const now = new Date();
        const endDate = subStatus.subscriptionEnd ? new Date(subStatus.subscriptionEnd) : new Date();
        
        const updatedSubscription: UserSubscription = {
          userId: user.id,
          planType: subStatus.planType,
          status: 'active',
          startDate: now,
          endDate: endDate,
          selectedCategories: subscription?.selectedCategories || []
        };
        
        setSubscription(updatedSubscription);
        return updatedSubscription;
      } else {
        setSubscription(null);
        return null;
      }
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      return subscription;
    }
  };
  
  const hasAccessToCategory = async (categoryId: string): Promise<boolean> => {
    if (!user) return false;
    
    if (user.role === 'admin' || user.role === 'master') return true;
    
    return false;
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    subscription,
    login,
    register,
    logout,
    hasPermission,
    canAccessApp,
    canAccessGenius,
    isFavorite,
    toggleFavorite,
    updateUser,
    updateGeniusStatus,
    markFirstAccessCompleted,
    refreshSubscription,
    hasAccessToCategory,
    isFirstAccess: user && (!user.firstAccessCompleted || user.plano === 'free')
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
