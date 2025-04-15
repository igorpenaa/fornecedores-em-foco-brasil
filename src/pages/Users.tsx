
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types";
import { authService } from "@/services/user-service";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDialog } from "@/components/users/user-dialog";
import { AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function Users() {
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await authService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleUserSave = async (userData: User) => {
    try {
      if (selectedUser) {
        // Atualizar usuário
        await authService.updateUser(selectedUser.id, {
          name: userData.name,
          role: userData.role
        });
        
        setUsers(prev => 
          prev.map(u => u.id === selectedUser.id ? { ...u, ...userData } : u)
        );
        
        toast({
          title: "Usuário atualizado",
          description: "O usuário foi atualizado com sucesso."
        });
      } else {
        // Criar novo usuário
        const newUser = await authService.register(
          userData.name, 
          userData.email, 
          "senha123", // Senha padrão, pode ser alterada pelo usuário depois
          userData.role
        );
        
        setUsers(prev => [...prev, newUser]);
        
        toast({
          title: "Usuário criado",
          description: "O usuário foi criado com sucesso com a senha padrão 'senha123'."
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o usuário."
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso."
      });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: "Não foi possível excluir o usuário."
      });
    }
  };

  const getBadgeColor = (role: UserRole) => {
    switch (role) {
      case "master":
        return "bg-red-500 hover:bg-red-600";
      case "admin":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case "master":
        return "Master";
      case "admin":
        return "Administrador";
      default:
        return "Usuário";
    }
  };

  // Verificação de permissão - apenas master pode acessar esta página
  if (!hasPermission(["master"])) {
    return (
      <AppLayout title="Acesso Negado" subtitle="Você não tem permissão para acessar esta página">
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Acesso Restrito</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Esta página é restrita a usuários com permissão de master.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Usuários" 
      subtitle="Gerencie os usuários do sistema"
      action={
        <Button onClick={handleAddUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-pulse text-center">
            <p>Carregando usuários...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getBadgeColor(user.role)}>
                        {getRoleName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        disabled={user.email === "pena.igorr@gmail.com" && user.role === "master"}
                        title="Editar usuário"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            disabled={user.email === "pena.igorr@gmail.com" && user.role === "master"}
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-4 w-4" />
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
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <UserDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSave={handleUserSave}
      />
    </AppLayout>
  );
}
