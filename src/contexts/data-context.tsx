
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Category, Supplier, Rating } from "@/types";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { categoryService } from "@/services/category-service";
import { supplierService } from "@/services/supplier-service";

interface DataContextType {
  categories: Category[];
  suppliers: Supplier[];
  addCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  getSupplier: (id: string) => Supplier | undefined;
  filterSuppliersByCategory: (categoryId: string | null) => Supplier[];
  uploadCategoryImage: (id: string, file: File) => Promise<string>;
  uploadSupplierImage: (id: string, file: File) => Promise<string>;
  refreshData: () => Promise<void>;
  rateSupplier: (supplierId: string, rating: number, comment: string, issues: string[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesData, suppliersData] = await Promise.all([
        categoryService.getAllCategories(),
        supplierService.getAllSuppliers(),
      ]);
      
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const addCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newCategory = await categoryService.addCategory(category);
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: "Categoria adicionada",
        description: "A categoria foi adicionada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar categoria",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
      });
      throw error;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      const updatedCategory = await categoryService.updateCategory(id, category);
      setCategories(prev => 
        prev.map(c => c.id === id ? updatedCategory : c)
      );
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar categoria",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
      });
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    const supplierWithCategory = suppliers.find(s => s.categoryIds.includes(id));
    if (supplierWithCategory) {
      toast({
        variant: "destructive",
        title: "Não é possível excluir",
        description: "Não é possível excluir uma categoria que possui fornecedores associados.",
      });
      return;
    }

    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir categoria",
        description: "Não foi possível excluir a categoria. Tente novamente.",
      });
      throw error;
    }
  };

  const uploadCategoryImage = async (id: string, file: File) => {
    try {
      const downloadURL = await categoryService.uploadCategoryImage(id, file);
      setCategories(prev => 
        prev.map(c => c.id === id ? { ...c, image: downloadURL } : c)
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

  const getCategory = (id: string) => {
    return categories.find(c => c.id === id);
  };

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

  const getSupplier = (id: string) => {
    return suppliers.find(s => s.id === id);
  };

  const filterSuppliersByCategory = (categoryId: string | null) => {
    if (!categoryId) return suppliers;
    return suppliers.filter(s => s.categoryIds.includes(categoryId));
  };

  const refreshData = async () => {
    await fetchData();
  };

  const rateSupplier = async (supplierId: string, rating: number, comment: string, issues: string[]) => {
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      
      if (!supplier) {
        throw new Error("Fornecedor não encontrado");
      }
      
      const newRating: Rating = {
        id: Date.now().toString(),
        userId: user?.id || "",
        userName: user?.name || user?.email || "Usuário",
        supplierId: supplierId,
        rating,
        comment,
        issues,
        createdAt: new Date(),
      };
      
      const updatedRatings: Rating[] = [...(supplier.ratings || []), newRating];
      const totalRating = updatedRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / updatedRatings.length;
      
      // Create an updated supplier object with the proper types
      const updatedSupplier: Supplier = {
        ...supplier,
        ratings: updatedRatings,
        averageRating
      };
      
      await supplierService.updateSupplier(supplierId, {
        ratings: updatedRatings,
        averageRating
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

  return (
    <DataContext.Provider value={{
      categories,
      suppliers,
      addCategory,
      updateCategory,
      deleteCategory,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      getCategory,
      getSupplier,
      filterSuppliersByCategory,
      uploadCategoryImage,
      uploadSupplierImage,
      refreshData,
      rateSupplier
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData deve ser usado dentro de um DataProvider");
  }
  return context;
}
