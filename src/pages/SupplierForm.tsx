import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  categoryIds: z.array(z.string()).min(1, { message: "Selecione pelo menos uma categoria" }),
  image: z.string().url({ message: "Insira uma URL válida para a imagem" }),
  isFreeSupplier: z.boolean().default(false),
  isGeniusStudent: z.boolean().default(false),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function SupplierForm() {
  const { id } = useParams<{ id: string }>();
  const { getSupplier, addSupplier, updateSupplier, categories } = useData();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const supplier = id ? getSupplier(id) : null;

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      phone: supplier?.phone || "",
      city: supplier?.city || "",
      categoryIds: supplier?.categoryIds || [],
      image: supplier?.image || "",
      isFreeSupplier: supplier?.isFreeSupplier || false,
      isGeniusStudent: supplier?.isGeniusStudent || false,
    },
  });

  useEffect(() => {
    if (!hasPermission(["master", "admin"])) {
      navigate("/dashboard");
    }
  }, [hasPermission, navigate]);

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone,
        city: supplier.city,
        categoryIds: supplier.categoryIds,
        image: supplier.image,
        isFreeSupplier: supplier.isFreeSupplier,
        isGeniusStudent: supplier.isGeniusStudent,
      });
    }
  }, [supplier, form]);

  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      if (supplier) {
        updateSupplier(supplier.id, {
          name: data.name,
          phone: data.phone,
          city: data.city,
          categoryIds: data.categoryIds,
          image: data.image,
          isFreeSupplier: data.isFreeSupplier,
          isGeniusStudent: data.isGeniusStudent,
        });
        toast({
          title: "Fornecedor atualizado",
          description: "O fornecedor foi atualizado com sucesso.",
        });
      } else {
        addSupplier({
          name: data.name,
          phone: data.phone,
          city: data.city,
          categoryIds: data.categoryIds,
          image: data.image,
          isFreeSupplier: data.isFreeSupplier,
          isGeniusStudent: data.isGeniusStudent,
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
            </div>

            <FormField
              control={form.control}
              name="categoryIds"
              render={() => (
                <FormItem>
                  <FormLabel>Categorias</FormLabel>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <FormField
                        key={category.id}
                        control={form.control}
                        name="categoryIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={category.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, category.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== category.id)
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {category.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Imagem+Inválida";
                        }}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFreeSupplier"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Fornecedor Gratuito
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isGeniusStudent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Aluno Rede Genius
                    </FormLabel>
                  </div>
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
