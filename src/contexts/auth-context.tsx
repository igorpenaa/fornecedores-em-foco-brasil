import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile
} from "firebase/auth";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { usePlanDialog } from '@/components/plans/shared-plan-dialog';
import { authService } from '@/services/user-service';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, geniusCoupon?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (roles: UserRole[]) => boolean;
  canAccessApp: () => boolean;
  toggleFavorite: (supplierId: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateGeniusStatus: (status: string) => Promise<void>;
  markFirstAccessCompleted: (userId: string) => Promise<void>;
  isFirstAccess: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  hasPermission: () => false,
  canAccessApp: () => false,
  toggleFavorite: async () => {},
  updateUser: async () => {},
  updateGeniusStatus: async () => {},
  markFirstAccessCompleted: async () => {},
  isFirstAccess: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setIsOpen } = usePlanDialog();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await authService.getUserById(authUser.uid);
          setUser(userDoc);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const user = await authService.login(email, password);
      setUser(user);
      setIsAuthenticated(true);
      
      // Redireciona o usuário para a página de dashboard após o login
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    }
  };

  const register = async (name: string, email: string, password: string, geniusCoupon?: string) => {
    try {
      const user = await authService.register(name, email, password, geniusCoupon);
      setUser(user);
      setIsAuthenticated(true);
      
      // Redireciona o usuário para a página de dashboard após o registro
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      toast({
        title: "Erro ao registrar",
        description: error.message || "Não foi possível criar a conta",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Redireciona o usuário para a página de login após o logout
      navigate("/login");
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
    
    // Admin e master tem acesso irrestrito
    if (user.role === "admin" || user.role === "master") {
      return true;
    }
    
    // Se o usuário tem um plano (diferente de 'free'), permite o acesso
    return !!user.plano;
  };

  const toggleFavorite = async (supplierId: string) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para adicionar aos favoritos",
        variant: "destructive",
      });
      return navigate("/login");
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
      return navigate("/login");
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

  const updateGeniusStatus = async (status: string) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para atualizar seu status",
        variant: "destructive",
      });
      return navigate("/login");
    }
    
    try {
      const newStatus = await authService.updateGeniusStatus(user.id, status);
      setUser({ ...user, geniusStatus: newStatus });
      toast({
        title: "Status atualizado",
        description: "Seu status foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar seu status",
        variant: "destructive",
      });
    }
  };

  // Adicionando uma flag para marcar o primeiro acesso
  const markFirstAccessCompleted = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        firstAccessCompleted: true
      });
    } catch (error) {
      console.error('Erro ao marcar primeiro acesso:', error);
    }
  };

  // Modificando o contexto de autenticação para incluir verificação de primeiro acesso
  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission,
    canAccessApp,
    toggleFavorite,
    updateUser,
    updateGeniusStatus,
    markFirstAccessCompleted,
    isFirstAccess: user && (!user.firstAccessCompleted || user.plano === 'free')
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
