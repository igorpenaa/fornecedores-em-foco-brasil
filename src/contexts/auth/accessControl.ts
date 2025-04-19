
import { User, UserRole } from "@/types";
import { stripeService } from "@/services/stripe-service";

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
    
    // Admin e master têm acesso a todas as categorias
    if (user.role === "admin" || user.role === "master") return true;
    
    // Se for plano gratuito, não tem acesso a categorias pagas
    if (user.plano === 'free') return false;
    
    // Se for plano anual, tem acesso a todas as categorias
    if (user.plano === 'annual') return true;
    
    try {
      // Para outros planos, verificar se a categoria está entre as selecionadas
      return await stripeService.hasAccessToCategory(user.id, categoryId);
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      return false;
    }
  };

  return { hasPermission, canAccessGenius, hasAccessToCategory };
}
