
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Home,
  ListFilter,
  LogOut,
  Menu,
  Package,
  UserCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  active?: boolean;
  onClick?: () => void;
  permissionLevel?: ("master" | "admin" | "user")[];
}

function SidebarLink({
  href,
  icon: Icon,
  title,
  active = false,
  onClick,
  permissionLevel,
}: SidebarLinkProps) {
  const { hasPermission } = useAuth();

  // Se há níveis de permissão definidos e o usuário não tem permissão, não mostrar o link
  if (permissionLevel && !hasPermission(permissionLevel)) {
    return null;
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </Link>
  );
}

export function Sidebar({ 
  className = "",
  defaultCollapsed = false 
}: { 
  className?: string;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Ajusta o colapso em telas menores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    // Configuração inicial
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`relative flex h-screen flex-col border-r bg-background transition-all ${
        isCollapsed ? "w-[70px]" : "w-[250px]"
      } ${className}`}
    >
      <div className="flex h-14 items-center border-b px-3">
        <div className="flex w-full items-center justify-between">
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-lg">Fornecedores</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="mb-4 flex flex-col gap-1">
          <SidebarLink
            href="/dashboard"
            icon={Home}
            title="Dashboard"
            active={location.pathname === "/dashboard"}
          />
          <SidebarLink
            href="/suppliers"
            icon={Boxes}
            title="Fornecedores"
            active={location.pathname === "/suppliers"}
          />
          <SidebarLink
            href="/categories"
            icon={ListFilter}
            title="Categorias"
            active={location.pathname === "/categories"}
            permissionLevel={["master", "admin"]}
          />
          <SidebarLink
            href="/analytics"
            icon={BarChart3}
            title="Análises"
            active={location.pathname === "/analytics"}
            permissionLevel={["master"]}
          />
          <SidebarLink
            href="/users"
            icon={Users}
            title="Usuários"
            active={location.pathname === "/users"}
            permissionLevel={["master"]}
          />
        </div>
        <Separator className="my-4" />
        <div className="mb-4 flex flex-col gap-1">
          <SidebarLink
            href="/profile"
            icon={UserCircle}
            title="Meu Perfil"
            active={location.pathname === "/profile"}
          />
        </div>
      </ScrollArea>
      <div className="flex flex-col items-center gap-2 p-3 border-t">
        {!isCollapsed && (
          <div className="flex items-center w-full gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between w-full">
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[85%] max-w-[300px]">
        <Sidebar defaultCollapsed={false} className="border-none" />
      </SheetContent>
    </Sheet>
  );
}
