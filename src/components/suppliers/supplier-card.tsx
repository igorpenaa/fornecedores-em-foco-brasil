
import { useState } from "react";
import { Heart, Phone, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { Supplier } from "@/types";
import { useData } from "@/contexts/data-context";
import { Badge } from "@/components/ui/badge";
import { SupplierRating } from "@/components/suppliers/supplier-rating";

interface SupplierCardProps {
  supplier: Supplier;
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite, hasPermission } = useAuth();
  const { getCategory, deleteSupplier } = useData();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get all categories for this supplier - with null check to prevent the "map of undefined" error
  const categoryIds = supplier.categoryIds || [];
  const categories = categoryIds.map(id => getCategory(id)).filter(Boolean);

  const openWhatsApp = () => {
    // Limpar o número de telefone (manter apenas dígitos)
    const phone = supplier.phone.replace(/\D/g, "");
    
    // Verificar se o número começa com 0 ou código do país
    let formattedPhone = phone;
    if (!phone.startsWith("55")) {
      formattedPhone = `55${phone}`;
    }
    
    // Abrir WhatsApp com mensagem padrão
    window.open(
      `https://wa.me/${formattedPhone}?text=Olá! Vi seu contato no sistema Fornecedores em Foco e gostaria de mais informações.`,
      "_blank"
    );
  };

  const handleEdit = () => {
    navigate(`/supplier/edit/${supplier.id}`);
  };

  const handleDelete = async () => {
    await deleteSupplier(supplier.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className="h-full overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={supplier.image}
              alt={supplier.name}
              className="h-full w-full object-cover transition-all hover:scale-105"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/70"
              onClick={() => toggleFavorite(supplier.id)}
            >
              <Heart
                className={`h-5 w-5 ${
                  isFavorite(supplier.id)
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                }`}
              />
              <span className="sr-only">
                {isFavorite(supplier.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{supplier.name}</h3>
            <SupplierRating supplier={supplier} />
            <div className="flex items-center text-sm">
              <Phone className="mr-1 h-4 w-4 text-muted-foreground" />
              <span>{supplier.phone}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {supplier.city}
            </p>
            <div className="flex flex-wrap gap-1">
              {categories.map(category => (
                <Badge key={category?.id} variant="outline">
                  {category?.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="space-y-2 p-4 pt-0">
          {hasPermission(["master"]) && (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}
          <Button 
            className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
            onClick={openWhatsApp}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
            WhatsApp
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o fornecedor {supplier.name}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
