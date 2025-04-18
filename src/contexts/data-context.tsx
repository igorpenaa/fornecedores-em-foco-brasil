import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Category, Supplier, Rating, Highlight } from "@/types";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { categoryService } from "@/services/category-service";
import { supplierService } from "@/services/supplier-service";
import { highlightService } from "@/services/highlight-service";

interface DataContextType {
  categories: Category[];
  suppliers: Supplier[];
  highlights: Highlight[];
  accessibleSuppliers: Supplier[];
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
  addHighlight: (highlight: Omit<Highlight, "id" | "createdAt">) => Promise<void>;
  updateHighlight: (id: string, highlight: Partial<Highlight>) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
  uploadHighlightMedia: (file: File) => Promise<{publicId: string, url: string, mediaType: 'image' | 'video'}>;
  isDataLoading: boolean;
  canAccessSupplier: (supplierId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [accessibleSuppliers, setAccessibleSuppliers] = useState<Supplier[]>([]);
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      const [categoriesData, suppliersData, highlightsData] = await Promise.all([
        categoryService.getAllCategories(),
        supplierService.getAllSuppliers(),
        highlightService.getAllHighlights(),
      ]);
      
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setHighlights(highlightsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente.",
      });
    } finally {
      setIsDataLoading(false);
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
      
      const existingRatings = supplier.ratings || [];
      const userRatingIndex = existingRatings.findIndex(r => r.userId === user?.id);
      let updatedRatings: Rating[];
      
      if (userRatingIndex >= 0) {
        updatedRatings = [...existingRatings];
        updatedRatings[userRatingIndex] = {
          ...updatedRatings[userRatingIndex],
          rating,
          comment,
          issues,
        };
      } else {
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
        
        updatedRatings = [...existingRatings, newRating];
      }
      
      const totalRating = updatedRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / updatedRatings.length;
      
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
        title: userRatingIndex >= 0 ? "Avaliação atualizada" : "Avaliação enviada",
        description: userRatingIndex >= 0 ? "Sua avaliação foi atualizada com sucesso!" : "Sua avaliação foi registrada com sucesso!"
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

  const addHighlight = async (highlight: Omit<Highlight, "id" | "createdAt">) => {
    try {
      const newHighlight = await highlightService.addHighlight(highlight);
      setHighlights(prev => [newHighlight, ...prev]);
      toast({
        title: "Destaque adicionado",
        description: "O destaque foi adicionado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao adicionar destaque:", error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar destaque",
        description: "Não foi possível adicionar o destaque. Tente novamente.",
      });
      throw error;
    }
  };

  const updateHighlight = async (id: string, highlight: Partial<Highlight>) => {
    try {
      const updatedHighlight = await highlightService.updateHighlight(id, highlight);
      setHighlights(prev => 
        prev.map(h => h.id === id ? { ...h, ...updatedHighlight } : h)
      );
      toast({
        title: "Destaque atualizado",
        description: "O destaque foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar destaque:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar destaque",
        description: "Não foi possível atualizar o destaque. Tente novamente.",
      });
      throw error;
    }
  };

  const deleteHighlight = async (id: string) => {
    try {
      await highlightService.deleteHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
      toast({
        title: "Destaque excluído",
        description: "O destaque foi excluído com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir destaque:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir destaque",
        description: "Não foi possível excluir o destaque. Tente novamente.",
      });
      throw error;
    }
  };

  const uploadHighlightMedia = async (file: File) => {
    try {
      const result = await highlightService.uploadHighlightMedia(file);
      return result;
    } catch (error) {
      console.error("Erro ao fazer upload da mídia:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer o upload da mídia. Tente novamente.",
      });
      throw error;
    }
  };

  // Determinar quais fornecedores o usuário tem acesso com base na assinatura
  useEffect(() => {
    const updateAccessibleSuppliers = async () => {
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
      
      // Filtrar fornecedores por categorias selecionadas, gratuitos e alunos genius (se aplicável)
      const filtered = suppliers.filter(supplier => {
        // Se for fornecedor gratuito, sempre incluir
        if (supplier.isFreeSupplier) return true;
        
        // Se o usuário for aluno genius e o fornecedor também, incluir
        if (user?.geniusStatus === 'approved' && supplier.isGeniusStudent) return true;
        
        // Verificar se alguma categoria do fornecedor está entre as selecionadas
        return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
      });
      
      setAccessibleSuppliers(filtered);
    };
    
    updateAccessibleSuppliers();
  }, [suppliers, user, subscription]);

  // Verificar se o usuário pode acessar um fornecedor específico
  const canAccessSupplier = (supplierId: string): boolean => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return false;
    
    // Se for fornecedor gratuito, sempre permitir acesso
    if (supplier.isFreeSupplier) return true;
    
    // Se não estiver logado, não permitir acesso a fornecedores pagos
    if (!user) return false;
    
    // Se não tiver assinatura, não permitir acesso a fornecedores pagos
    if (!subscription) return false;
    
    // Se for assinatura anual, permitir acesso a todos
    if (subscription.planType === 'annual') return true;
    
    // Se o usuário for aluno genius e o fornecedor também, permitir acesso
    if (user.geniusStatus === 'approved' && supplier.isGeniusStudent) return true;
    
    // Para outros tipos de assinatura, verificar se alguma categoria do fornecedor está entre as selecionadas
    const selectedCategoryIds = subscription.selectedCategories || [];
    return supplier.categoryIds.some(catId => selectedCategoryIds.includes(catId));
  };

  return (
    <DataContext.Provider value={{
      categories,
      suppliers,
      highlights,
      accessibleSuppliers,
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
      rateSupplier,
      addHighlight,
      updateHighlight,
      deleteHighlight,
      uploadHighlightMedia,
      isDataLoading,
      canAccessSupplier
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
