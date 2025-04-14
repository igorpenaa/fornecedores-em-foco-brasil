
import { Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/types";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
}

export function CategoryCard({ category, onEdit }: CategoryCardProps) {
  const { suppliers, deleteCategory } = useData();
  const { hasPermission } = useAuth();
  
  // Contar quantos fornecedores existem nesta categoria
  const supplierCount = suppliers.filter(s => s.categoryId === category.id).length;
  
  // Formatar data de atualização
  const formattedDate = new Date(category.updatedAt).toLocaleDateString('pt-BR');
  
  // Apenas usuário Master pode excluir categorias
  const canDelete = hasPermission(["master"]);

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria ${category.name}?`)) {
      deleteCategory(category.id);
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition-all hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{category.name}</h3>
            <Badge variant="outline">{supplierCount} fornecedor{supplierCount !== 1 ? 'es' : ''}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Atualizado em {formattedDate}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
          Editar
        </Button>
        
        {canDelete && (
          <Button 
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={handleDelete}
            disabled={supplierCount > 0}
            title={supplierCount > 0 ? "Não é possível excluir categorias com fornecedores" : ""}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
