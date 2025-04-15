
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authService } from "@/services/user-service";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (roles: UserRole[]) => boolean;
  toggleFavorite: (supplierId: string) => void;
  isFavorite: (supplierId: string) => boolean;
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
          // Carrega os dados adicionais do usuário do Firestore
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
      // Verificar se é o usuário master predefinido
      if (email === "pena.igorr@gmail.com") {
        const userData = await authService.login(email, password);
        // Se não for master, atualizar o papel para master
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
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const userData = await authService.register(name, email, password);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Erro de registro:", error);
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
      isFavorite
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
