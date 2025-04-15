
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusCircle, Search, Edit, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UserDialog } from "@/components/users/user-dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, UserRole } from "@/types";
import { userService } from "@/services/user-service";
import { useAuth } from "@/contexts/auth-context";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Verificar se o usuário atual é master
  useEffect(() => {
    if (currentUser?.role !== "master") {
      toast.error("Acesso negado. Apenas usuários master podem acessar esta página.");
      window.location.href = "/dashboard";
    }
  }, [currentUser]);

  // Carregar usuários
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAllUsers,
  });

  // Mutation para deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário excluído com sucesso");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    }
  });

  // Filtrar usuários pelo termo de busca
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para abrir o dialog de edição
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Função para deletar usuário
  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  // Função para renderizar o badge de acordo com o role
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "master":
        return <Badge className="bg-primary-500">Master</Badge>;
      case "admin":
        return <Badge className="bg-success-600">Administrador</Badge>;
      case "user":
        return <Badge variant="outline">Padrão</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout title="Usuários" subtitle="Gerencie os usuários do sistema">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuários..."
              className="w-full sm:w-[320px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={() => {
              setSelectedUser(null);
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[220px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-[100px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{renderRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o usuário {user.name}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    {searchTerm ? "Nenhum usuário encontrado para esta busca" : "Nenhum usuário cadastrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <UserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        selectedUser={selectedUser}
      />
    </AppLayout>
  );
}
