
import { useState, useEffect } from "react";
import { Supplier } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function useAccessControl(suppliers: Supplier[]) {
  const { user, subscription } = useAuth();
  const [accessibleSuppliers, setAccessibleSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const updateAccessibleSuppliers = () => {
      if (!suppliers.length) return;
      
      // Se não estiver logado, mostrar apenas os gratuitos
      if (!user) {
        const freeSuppliers = suppliers.filter(s => s.isFreeSupplier);
        setAccessibleSuppliers(freeSuppliers);
        return;
      }
      
      // Se não tiver assinatura, mostrar apenas os gratuitos
      if (!subscription) {
        const freeSuppliers = suppliers.filter(s => s.isFreeSupplier);
        setAccessibleSuppliers(freeSuppliers);
        return;
      }
      
      // Se for assinatura anual, mostrar todos
      if (subscription.planType === 'annual') {
        setAccessibleSuppliers([...suppliers]);
        return;
      }
      
      // Para outros tipos de assinatura, filtrar por categorias selecionadas
      const selectedCategoryIds = subscription.selectedCategories || [];
      
      const filtered = suppliers.filter(supplier => {
        if (supplier.isFreeSupplier) return true;
        if (user.geniusStatus === 'approved' && supplier.isGeniusStudent) return true;
        return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
      });
      
      setAccessibleSuppliers(filtered);
    };
    
    updateAccessibleSuppliers();
  }, [suppliers, user, subscription]);

  const canAccessSupplier = (supplierId: string): boolean => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return false;
    
    if (supplier.isFreeSupplier) return true;
    if (!user) return false;
    if (!subscription) return false;
    if (subscription.planType === 'annual') return true;
    if (user.geniusStatus === 'approved' && supplier.isGeniusStudent) return true;
    
    const selectedCategoryIds = subscription.selectedCategories || [];
    return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
  };

  return {
    accessibleSuppliers,
    canAccessSupplier
  };
}
