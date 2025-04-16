import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, GeniusStatus } from "@/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authService } from "@/services/user-service";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, geniusCoupon?: string) => Promise<void>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
  toggleFavorite: (supplierId: string) => void;
  isFavorite: (supplierId: string) => boolean;
  updateGeniusStatus: (userId: string, status: GeniusStatus) => Promise<void>;
  canAccessGenius: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getUserById(firebaseUser.uid);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Erro ao carregar dados do usuário:", error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (email === "pena.igorr@gmail.com") {
        const userData = await authService.login(email, password);
        if (userData.role !== "master") {
          await authService.updateUser(userData.id, { role: "master" });
          userData.role = "master";
        }
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        const userData = await authService.login(email, password);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Erro de login:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Credenciais inválidas",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, geniusCoupon?: string) => {
    try {
      const userData = await authService.register(name, email, password, geniusCoupon);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Erro de registro:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair do sistema.",
      });
    }
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
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

  const canAccessGenius = (): boolean => {
    if (!user) return false;
    
    if (user.role === "admin" || user.role === "master") return true;
    
    if (user.geniusCoupon === "ALUNOREDEGENIUS") {
      return user.geniusStatus === "approved";
    }
    
    return false;
  };

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
      canAccessGenius
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
