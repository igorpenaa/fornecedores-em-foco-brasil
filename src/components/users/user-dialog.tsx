
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/user-service";
import { User } from "@/types";

// Schema de validação
const userFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "user"], {
    message: "Selecione um tipo de usuário",
  }),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
}

export function UserDialog({ open, onOpenChange, selectedUser }: UserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const isEditMode = !!selectedUser;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: selectedUser?.name || "",
      email: selectedUser?.email || "",
      role: selectedUser?.role as "admin" | "user" || "user",
      password: "",
    },
  });

  // Mutation para adicionar usuário
  const addUserMutation = useMutation({
    mutationFn: userService.addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário adicionado com sucesso");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar usuário: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Mutation para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: (data: User) => userService.updateUser(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário atualizado com sucesso");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: UserFormValues) => {
    setIsSubmitting(true);

    if (isEditMode && selectedUser) {
      // Ensure name is always provided (not optional)
      const updatedUser: User = {
        id: selectedUser.id,
        name: data.name,  // This is required by the type
        email: data.email,
        role: data.role,
      };
      
      // Only include password if it's provided (for updates)
      if (data.password) {
        Object.assign(updatedUser, { password: data.password });
      }

      updateUserMutation.mutate(updatedUser);
    } else {
      // For new users, password is required
      if (!data.password) {
        toast.error("Senha é obrigatória para novos usuários");
        setIsSubmitting(false);
        return;
      }
      
      // Adding a new user - password is required here
      const newUser = {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      };
      
      addUserMutation.mutate(newUser);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Digite o email" 
                      {...field} 
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Usuário</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de usuário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="user">Usuário Padrão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditMode ? "Nova Senha (opcional)" : "Senha"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEditMode
                          ? "Digite para alterar a senha"
                          : "Digite a senha"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Salvando..." 
                  : isEditMode 
                    ? "Salvar Alterações" 
                    : "Adicionar Usuário"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
