
import { User, UserRole } from "@/types";

export function createAccessControl(user: User | null) {
  const hasPermission = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canAccessGenius = (): boolean => {
    if (!user) return false;
    
    if (user.role === "admin" || user.role === "master") return true;
    
    if (user.geniusCoupon === "ALUNOREDEGENIUS") {
      return user.geniusStatus === "approved";
    }
    
    return false;
  };

  const hasAccessToCategory = async (categoryId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      return await stripeService.hasAccessToCategory(user.id, categoryId);
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      return false;
    }
  };

  return { hasPermission, canAccessGenius, hasAccessToCategory };
}
