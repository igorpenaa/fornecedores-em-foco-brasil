
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Package,
  UserCircle,
  Users,
  Heart,
  UsersRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  active?: boolean;
  permissionLevel?: UserRole[];
}

export interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function SidebarLink({
  href,
  icon: Icon,
  title,
  active,
  permissionLevel,
}: SidebarLinkProps) {
  const { hasPermission } = useAuth();

  if (permissionLevel && !hasPermission(permissionLevel)) {
    return null;
  }

  return (
    <Link
      to={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-all hover:text-primary ${
        active
          ? "bg-muted font-medium text-primary"
          : "text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </Link>
  );
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  return (
    <div
      className={`relative h-full flex-col border-r bg-card pt-16 ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-end px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center justify-center gap-1">
            {user && (
              <Link
                to="#"
                className="flex flex-col items-center justify-center p-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {user.name[0].toUpperCase()}
                </div>
              </Link>
            )}
            <Link to="/dashboard" title="Dashboard">
              <Home
                className={`mx-auto h-5 w-5 ${
                  location.pathname === "/dashboard"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Link>
            <Link to="/suppliers" title="Fornecedores">
              <Boxes
                className={`mx-auto h-5 w-5 ${
                  location.pathname === "/suppliers"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Link>
            <Link to="/favorites" title="Favoritos">
              <Heart
                className={`mx-auto h-5 w-5 ${
                  location.pathname === "/favorites"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Link>
            <Link to="/categories" title="Categorias">
              <LayoutGrid
                className={`mx-auto h-5 w-5 ${
                  location.pathname === "/categories"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </Link>
            {user?.role === "master" && (
              <Link to="/users" title="Usuários">
                <UsersRound
                  className={`mx-auto h-5 w-5 ${
                    location.pathname === "/users"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </Link>
            )}
            <div className="mt-auto">
              <Button
                variant="ghost"
                size="icon"
                className="my-2 h-9 w-9"
                onClick={logout}
                title="Sair"
              >
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
              <ThemeToggle small />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-3">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2">
              {user && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.role === "master"
                        ? "Master"
                        : user.role === "admin"
                        ? "Administrador"
                        : "Usuário"}
                    </span>
                  </div>
                </div>
              )}
            </div>
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
              href="/favorites"
              icon={Heart}
              title="Favoritos"
              active={location.pathname === "/favorites"}
            />
            <SidebarLink
              href="/categories"
              icon={LayoutGrid}
              title="Categorias"
              active={location.pathname === "/categories"}
            />
            <SidebarLink
              href="/users"
              icon={UsersRound}
              title="Usuários"
              active={location.pathname === "/users"}
              permissionLevel={["master"]}
            />
            <div className="mt-auto flex items-center justify-between py-2">
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-muted-foreground"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
