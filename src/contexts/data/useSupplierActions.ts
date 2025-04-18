
import { useState } from "react";
import { Supplier, Rating } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supplierService } from "@/services/supplier-service";
import { useAuth } from "@/contexts/auth-context";

export function useSupplierActions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const addSupplier = async (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newSupplier = await supplierService.addSupplier(supplier);
      setSuppliers(prev => [...prev, newSupplier]);
      toast({
        title: "Fornecedor adicionado",
        description: "O fornecedor foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar fornecedor",
        description: "Não foi possível adicionar o fornecedor. Tente novamente.",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      const updatedSupplier = await supplierService.updateSupplier(id, supplier);
      setSuppliers(prev => 
        prev.map(s => s.id === id ? updatedSupplier : s)
      );
      toast({
        title: "Fornecedor atualizado",
        description: "O fornecedor foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar fornecedor",
        description: "Não foi possível atualizar o fornecedor. Tente novamente.",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await supplierService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Fornecedor excluído",
        description: "O fornecedor foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir fornecedor",
        description: "Não foi possível excluir o fornecedor. Tente novamente.",
      });
      throw error;
    }
  };

  const uploadSupplierImage = async (id: string, file: File) => {
    try {
      const downloadURL = await supplierService.uploadSupplierImage(id, file);
      setSuppliers(prev => 
        prev.map(s => s.id === id ? { ...s, image: downloadURL } : s)
      );
      return downloadURL;
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer o upload da imagem. Tente novamente.",
      });
      throw error;
    }
  };

  const getSupplier = (id: string) => suppliers.find(s => s.id === id);
  
  const filterSuppliersByCategory = (categoryId: string | null) => {
    if (!categoryId) return suppliers;
    return suppliers.filter(s => s.categoryIds.includes(categoryId));
  };

  const rateSupplier = async (supplierId: string, rating: number, comment: string, issues: string[]) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      
      const supplier = suppliers.find(s => s.id === supplierId);
      if (!supplier) throw new Error("Fornecedor não encontrado");

      // Create a properly typed Rating object with all required properties
      const newRating: Rating = { 
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        supplierId: supplierId,
        rating,
        comment,
        issues,
        createdAt: new Date()
      };

      const updatedSupplier = await supplierService.updateSupplier(supplierId, {
        ratings: [...(supplier.ratings || []), newRating]
      });

      setSuppliers(prev => prev.map(s => s.id === supplierId ? updatedSupplier : s));
      
      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi registrada com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao avaliar fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao avaliar",
        description: "Não foi possível registrar sua avaliação. Tente novamente."
      });
      throw error;
    }
  };

  return {
    suppliers,
    setSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    uploadSupplierImage,
    getSupplier,
    filterSuppliersByCategory,
    rateSupplier
  };
}
