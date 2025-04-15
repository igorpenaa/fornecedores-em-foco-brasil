
import { useEffect } from "react";
import { BarChart3, Package, PieChart, ShoppingBag, Star, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { categories, suppliers } = useData();
  const { user } = useAuth();
  
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do sistema">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">
              Fornecedores cadastrados no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorias de fornecedores disponíveis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Favoritos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.favorites.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fornecedores marcados como favoritos
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                <Package className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Link to="/suppliers" className="text-sm font-medium">Gestão de Fornecedores</Link>
                  <p className="text-xs text-muted-foreground">Visualize e gerencie todos os fornecedores cadastrados</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <Link to="/categories" className="text-sm font-medium">Categorias</Link>
                  <p className="text-xs text-muted-foreground">Navegue e gerencie as categorias de fornecedores</p>
                </div>
              </div>
              
              {user?.role === "master" && (
                <>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/users" className="text-sm font-medium">Usuários</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os usuários do sistema</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/analytics" className="text-sm font-medium">Análises</Link>
                      <p className="text-xs text-muted-foreground">Acompanhe estatísticas e relatórios</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Fornecedores por Categoria</CardTitle>
            <CardDescription>
              Distribuição dos fornecedores por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map(category => {
                // Add null check for categoryIds array
                const count = suppliers.filter(s => s.categoryIds && s.categoryIds.includes(category.id)).length;
                const percentage = suppliers.length > 0 
                  ? Math.round((count / suppliers.length) * 100) 
                  : 0;
                
                return (
                  <div key={category.id} className="flex items-center">
                    <div className="w-12 text-sm">{percentage}%</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{category.name}</p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm">{count}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Últimos Fornecedores Adicionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {suppliers.slice(0, 3).map(supplier => {
                // Get first category for display purposes
                const categoryId = supplier.categoryIds && supplier.categoryIds.length > 0 ? 
                  supplier.categoryIds[0] : undefined;
                const category = categoryId ? categories.find(c => c.id === categoryId) : undefined;
                
                return (
                  <div key={supplier.id} className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50">
                      <img
                        src={supplier.image}
                        alt={supplier.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{supplier.name}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="mr-2">{supplier.city}</span>
                        {category && (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                            {category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
