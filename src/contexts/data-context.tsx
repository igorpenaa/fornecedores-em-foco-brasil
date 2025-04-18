
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { categoryService } from "@/services/category-service";
import { supplierService } from "@/services/supplier-service";
import { highlightService } from "@/services/highlight-service";
import { useCategoryActions } from "./data/useCategoryActions";
import { useSupplierActions } from "./data/useSupplierActions";
import { useHighlightActions } from "./data/useHighlightActions";
import { useAccessControl } from "./data/useAccessControl";
import type { DataContextType } from "./data/types";

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    getCategory
  } = useCategoryActions();

  const {
    suppliers,
    setSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    uploadSupplierImage,
    getSupplier,
    filterSuppliersByCategory,
    rateSupplier
  } = useSupplierActions();

  const {
    highlights,
    setHighlights,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    uploadHighlightMedia
  } = useHighlightActions();

  const { accessibleSuppliers, canAccessSupplier } = useAccessControl(suppliers);

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

  const refreshData = async () => {
    await fetchData();
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
