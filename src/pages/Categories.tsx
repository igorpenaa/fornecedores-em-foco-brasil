
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/data-context";
import { CategoryCard } from "@/components/categories/category-card";
import { useAuth } from "@/contexts/auth-context";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@/types";
import { useNavigate } from "react-router-dom";

const categorySchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .max(50, { message: "O nome deve ter no máximo 50 caracteres" }),
  image: z
    .string()
    .url({ message: "Insira uma URL válida para a imagem" })
    .min(1, { message: "A URL da imagem é obrigatória" }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
  const { categories, addCategory, updateCategory } = useData();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // Verificar permissão
  if (!hasPermission(["master", "admin"])) {
    navigate("/dashboard");
    return null;
  }

  // Formulário
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: currentCategory?.name || "",
      image: currentCategory?.image || "",
    },
  });

  // Resetar formulário quando o dialog abre/fecha ou a categoria atual muda
  const resetForm = () => {
    form.reset({
      name: currentCategory?.name || "",
      image: currentCategory?.image || "",
    });
  };

  // Manipular abertura do dialog
  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Manipular quando uma categoria é selecionada para edição
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    resetForm();
    setIsDialogOpen(true);
  };

  // Manipular envio do formulário
  const onSubmit = (data: CategoryFormValues) => {
    if (currentCategory) {
      // Editar categoria existente
      updateCategory(currentCategory.id, {
        name: data.name,
        image: data.image
      });
    } else {
      // Adicionar nova categoria
      addCategory({
        name: data.name,
        image: data.image
      });
    }
    setIsDialogOpen(false);
    setCurrentCategory(null);
  };

  // Filtrar categorias pelo termo de busca
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout title="Categorias" subtitle="Gerencie as categorias de fornecedores">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar categorias..."
            className="w-full pl-8 md:w-[280px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Button
          className="gap-1"
          onClick={() => {
            setCurrentCategory(null);
            handleOpenDialog();
          }}
        >
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Nenhuma categoria encontrada</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {searchTerm
                ? "Não foram encontradas categorias com o termo de busca informado."
                : "Parece que você ainda não tem categorias cadastradas. Crie sua primeira categoria para começar."}
            </p>
            {searchTerm ? (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar Busca
              </Button>
            ) : (
              <Button onClick={handleOpenDialog}>Criar Categoria</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              onEdit={handleEditCategory}
            />
          ))}
        </div>
      )}
      
      {/* Dialog para adicionar/editar categoria */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {currentCategory
                ? "Atualize as informações da categoria abaixo."
                : "Preencha as informações para criar uma nova categoria."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da categoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/imagem.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2 h-32 w-full overflow-hidden rounded-md border">
                        <img
                          src={field.value}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Substituir por uma imagem padrão em caso de erro
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Imagem+Inválida";
                          }}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setCurrentCategory(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {currentCategory ? "Salvar Alterações" : "Criar Categoria"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
