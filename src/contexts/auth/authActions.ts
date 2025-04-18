
import { User } from "@/types";
import { authService } from "@/services/user-service";

export function createAuthActions(
  setUser: (user: User | null) => void,
  setIsAuthenticated: (value: boolean) => void
) {
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
      
      // A verificação da assinatura será feita pelo efeito no AuthContext
      // quando o usuário for atualizado
      
      return userData;
    } catch (error) {
      console.error("Erro de login:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, geniusCoupon?: string) => {
    try {
      const userData = await authService.register(name, email, password, geniusCoupon);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
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
      throw error;
    }
  };

  return { login, register, logout };
}
