
import { useState, useEffect } from "react";
import { Supplier } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function useAccessControl(suppliers: Supplier[]) {
  const { user, subscription } = useAuth();
  const [accessibleSuppliers, setAccessibleSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const updateAccessibleSuppliers = () => {
      if (!suppliers.length) return;
      
      // Usuários admin ou master têm acesso a todos os fornecedores
      if (user?.role === "admin" || user?.role === "master") {
        setAccessibleSuppliers([...suppliers]);
        return;
      }
      
      // Se não estiver logado, mostrar apenas os gratuitos
      if (!user) {
        const freeSuppliers = suppliers.filter(s => s.isFreeSupplier);
        setAccessibleSuppliers(freeSuppliers);
        return;
      }
      
      // Se for plano gratuito, mostrar apenas os gratuitos e os para alunos da Rede Genius aprovados
      if (user.plano === 'free') {
        let filtered = suppliers.filter(s => s.isFreeSupplier);
        
        // Se for aluno Genius aprovado, mostrar também os fornecedores para alunos
        if (user.geniusStatus === 'approved' && user.geniusCoupon === "ALUNOREDEGENIUS") {
          const geniusSuppliers = suppliers.filter(s => !s.isFreeSupplier && s.isGeniusStudent);
          filtered = [...filtered, ...geniusSuppliers];
        }
        
        setAccessibleSuppliers(filtered);
        return;
      }
      
      // Se for assinatura anual, mostrar todos
      if (user.plano === 'annual' || subscription?.planType === 'annual') {
        setAccessibleSuppliers([...suppliers]);
        return;
      }
      
      // Para outros tipos de assinatura, filtrar por categorias selecionadas
      const selectedCategoryIds = subscription?.selectedCategories || [];
      
      const filtered = suppliers.filter(supplier => {
        // Fornecedores gratuitos estão sempre disponíveis
        if (supplier.isFreeSupplier) return true;
        
        // Se for aluno Genius aprovado, mostrar também os fornecedores para alunos
        if (user.geniusStatus === 'approved' && user.geniusCoupon === "ALUNOREDEGENIUS" && supplier.isGeniusStudent) return true;
        
        // Verificar se alguma categoria do fornecedor está entre as categorias selecionadas pelo usuário
        return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
      });
      
      setAccessibleSuppliers(filtered);
    };
    
    updateAccessibleSuppliers();
  }, [suppliers, user, subscription]);

  const canAccessSupplier = (supplierId: string): boolean => {
    // Admin e master têm acesso a todos os fornecedores
    if (user?.role === "admin" || user?.role === "master") return true;
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return false;
    
    // Fornecedores gratuitos estão sempre disponíveis
    if (supplier.isFreeSupplier) return true;
    
    if (!user) return false;
    
    // Se for aluno Genius aprovado e o fornecedor for para alunos
    if (user.geniusStatus === 'approved' && user.geniusCoupon === "ALUNOREDEGENIUS" && supplier.isGeniusStudent) return true;
    
    // Se for plano gratuito, não tem acesso a fornecedores pagos
    if (user.plano === 'free') return false;
    
    // Se for assinatura anual, tem acesso a tudo
    if (user.plano === 'annual' || subscription?.planType === 'annual') return true;
    
    // Para outros planos, verificar por categoria
    const selectedCategoryIds = subscription?.selectedCategories || [];
    return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
  };

  return {
    accessibleSuppliers,
    canAccessSupplier
  };
}
