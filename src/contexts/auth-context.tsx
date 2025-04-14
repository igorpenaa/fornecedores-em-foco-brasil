
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";

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

// Mock data para desenvolvimento
const MOCK_USERS = [
  {
    id: "1",
    name: "Admin Master",
    email: "master@example.com",
    password: "senha123",
    role: "master" as UserRole,
    favorites: []
  },
  {
    id: "2",
    name: "Administrador",
    email: "admin@example.com",
    password: "senha123",
    role: "admin" as UserRole,
    favorites: []
  },
  {
    id: "3",
    name: "Usuário",
    email: "user@example.com",
    password: "senha123",
    role: "user" as UserRole,
    favorites: []
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Verificar se o usuário está salvo no localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulação de login com mock data
    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error("Credenciais inválidas");
    }
    
    const userData: User = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      favorites: foundUser.favorites
    };
    
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const register = async (name: string, email: string, password: string) => {
    // Simulação de registro
    const existingUser = MOCK_USERS.find(u => u.email === email);
    
    if (existingUser) {
      throw new Error("Este e-mail já está em uso");
    }
    
    const newUser: User = {
      id: `${MOCK_USERS.length + 1}`,
      name,
      email,
      role: "user", // Novos registros sempre serão usuários padrão
      favorites: []
    };
    
    // Aqui seria a parte de salvar no banco de dados
    // Mas estamos apenas simulando para este protótipo
    
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const toggleFavorite = (supplierId: string) => {
    if (!user) return;
    
    const newFavorites = user.favorites.includes(supplierId)
      ? user.favorites.filter(id => id !== supplierId)
      : [...user.favorites, supplierId];
    
    const updatedUser = { ...user, favorites: newFavorites };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
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
