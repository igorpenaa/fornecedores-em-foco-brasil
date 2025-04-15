
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const supplierSchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .max(100, { message: "O nome deve ter no máximo 100 caracteres" }),
  phone: z
    .string()
    .min(10, { message: "Insira um número de telefone válido" })
    .max(15, { message: "Insira um número de telefone válido" }),
  city: z
    .string()
    .min(2, { message: "A cidade deve ter pelo menos 2 caracteres" })
    .max(50, { message: "A cidade deve ter no máximo 50 caracteres" }),
  categoryId: z.string().min(1, { message: "Selecione uma categoria" }),
  image: z.string().url({ message: "Insira uma URL válida para a imagem" }),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SupplierForm() {
  const { id } = useParams<{ id: string }>();
  const { getSupplier, addSupplier, updateSupplier, categories } = useData();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Obter fornecedor por ID (se for edição)
  const supplier = id ? getSupplier(id) : null;

  // Configurar formulário
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      phone: supplier?.phone || "",
      city: supplier?.city || "",
      categoryId: supplier?.categoryId || "",
      image: supplier?.image || "",
    },
  });

  // Verificar permissão - Movido para um useEffect
  useEffect(() => {
    if (!hasPermission(["master", "admin"])) {
      navigate("/dashboard");
    }
  }, [hasPermission, navigate]);

  // Atualizar formulário quando o fornecedor mudar
  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone,
        city: supplier.city,
        categoryId: supplier.categoryId,
        image: supplier.image,
      });
    }
  }, [supplier, form]);

  // Manipular envio do formulário
  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      if (supplier) {
        // Atualizar fornecedor existente
        updateSupplier(supplier.id, {
          name: data.name,
          phone: data.phone,
          city: data.city,
          categoryId: data.categoryId,
          image: data.image,
        });
        toast({
          title: "Fornecedor atualizado",
          description: "O fornecedor foi atualizado com sucesso.",
        });
      } else {
        // Adicionar novo fornecedor
        addSupplier({
          name: data.name,
          phone: data.phone,
          city: data.city,
          categoryId: data.categoryId,
          image: data.image,
        });
        toast({
          title: "Fornecedor adicionado",
          description: "O novo fornecedor foi adicionado com sucesso.",
        });
      }
      navigate("/suppliers");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar o fornecedor. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se não tiver permissão, o useEffect irá redirecionar
  // Este retorno condicional vem depois de todos os hooks, mantendo a ordem consistente
  if (!hasPermission(["master", "admin"])) {
    return null;
  }

  return (
    <AppLayout
      title={supplier ? "Editar Fornecedor" : "Novo Fornecedor"}
      subtitle={supplier ? "Atualize as informações do fornecedor" : "Cadastre um novo fornecedor"}
    >
      <div className="mx-auto max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 11987654321" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem / Logo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://exemplo.com/imagem.jpg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <div className="mt-2 h-40 w-full overflow-hidden rounded-md border">
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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/suppliers")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Salvando..."
                  : supplier
                  ? "Atualizar Fornecedor"
                  : "Cadastrar Fornecedor"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
