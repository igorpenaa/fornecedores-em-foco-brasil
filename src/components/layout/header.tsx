
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "./sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  
  const getRoleBadge = () => {
    switch (user?.role) {
      case "master":
        return <Badge className="bg-primary-500">Usuário Master</Badge>;
      case "admin":
        return <Badge className="bg-success-600">Administrador</Badge>;
      case "user":
        return <Badge variant="outline">Usuário Padrão</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebar />
      
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-[200px] pl-8 md:w-[260px] lg:w-[320px]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {getRoleBadge()}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
