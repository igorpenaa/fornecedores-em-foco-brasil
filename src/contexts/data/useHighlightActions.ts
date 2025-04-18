
import { useState } from "react";
import { Highlight } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { highlightService } from "@/services/highlight-service";

export function useHighlightActions() {
  const { toast } = useToast();
  const [highlights, setHighlights] = useState<Highlight[]>([]);

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

  return {
    highlights,
    setHighlights,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    uploadHighlightMedia
  };
}
