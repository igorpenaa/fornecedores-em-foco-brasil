
import { useState } from "react";
import { Category } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { categoryService } from "@/services/category-service";

export function useCategoryActions() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);

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

  const getCategory = (id: string) => categories.find(c => c.id === id);

  return {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    getCategory
  };
}
