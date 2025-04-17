
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Highlight } from "@/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/data-context";
import { HighlightForm } from "@/components/highlights/highlight-form";
import { HighlightsList } from "@/components/highlights/highlights-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function Highlights() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const { user } = useAuth();
  const { highlights, deleteHighlight } = useData();
  const navigate = useNavigate();
  
  // Check if user is admin or master
  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "master") {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  
  const handleAddHighlight = () => {
    setEditingHighlight(null);
    setIsFormOpen(true);
  };
  
  const handleEditHighlight = (highlight: Highlight) => {
    setEditingHighlight(highlight);
    setIsFormOpen(true);
  };
  
  const handleDeleteHighlight = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este destaque?")) {
      await deleteHighlight(id);
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHighlight(null);
  };
  
  if (!user || (user.role !== "admin" && user.role !== "master")) {
    return null;
  }
  
  return (
    <AppLayout title="Destaques" subtitle="Gerenciar destaques para o slideshow">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Destaques</CardTitle>
              <CardDescription>
                Gerencie os destaques que aparecerão no slideshow da página inicial.
              </CardDescription>
            </div>
            <Button onClick={handleAddHighlight}>Adicionar Destaque</Button>
          </div>
        </CardHeader>
        <CardContent>
          {highlights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum destaque cadastrado. Clique em "Adicionar Destaque" para começar.
            </p>
          ) : (
            <HighlightsList 
              highlights={highlights} 
              onEdit={handleEditHighlight} 
              onDelete={handleDeleteHighlight} 
            />
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingHighlight ? "Editar Destaque" : "Adicionar Destaque"}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editingHighlight ? "editar o" : "adicionar um novo"} destaque.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <HighlightForm 
            highlight={editingHighlight} 
            onClose={handleCloseForm} 
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
