
import { useEffect, useState } from "react";
import { BarChart3, Clock, Package, PieChart, ShoppingBag, Star, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { HighlightsCarousel } from "@/components/dashboard/highlights-carousel";
import { ProductsShowcase } from "@/components/dashboard/products-showcase";
import { AdsDisplay } from "@/components/dashboard/ads-display";

export default function Dashboard() {
  const { categories, suppliers } = useData();
  const { user } = useAuth();
  const [suppliersThisWeek, setSuppliersThisWeek] = useState(0);
  
  useEffect(() => {
    // Calculate suppliers added this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentSuppliers = suppliers.filter(
      supplier => new Date(supplier.createdAt) >= oneWeekAgo
    ).length;
    
    setSuppliersThisWeek(recentSuppliers);
  }, [suppliers]);
  
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do sistema">
      {/* Ads Section */}
      <div className="mb-6">
        <AdsDisplay />
      </div>
      
      {/* Highlights Carousel */}
      <div className="mb-6 overflow-hidden rounded-lg">
        <HighlightsCarousel />
      </div>
      
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Fornecedores esta semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliersThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Novos fornecedores nos últimos 7 dias
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
      
      {/* Products Showcase */}
      <div className="my-6">
        <ProductsShowcase />
      </div>
      
      {/* System Overview and Categories Chart */}
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
              
              {(user?.role === "master" || user?.role === "admin") && (
                <>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/users" className="text-sm font-medium">Usuários</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os usuários do sistema</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Star className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/highlights" className="text-sm font-medium">Destaques</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os banners de destaque</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Package className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/products" className="text-sm font-medium">Produtos</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os produtos em destaque</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/ads" className="text-sm font-medium">Anúncios</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os anúncios do sistema</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Star className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Link to="/issues" className="text-sm font-medium">Termos de Avaliação</Link>
                      <p className="text-xs text-muted-foreground">Gerencie os termos para avaliações negativas</p>
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
      
      {/* Top Rated Suppliers */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Mais Bem Avaliados</CardTitle>
            <CardDescription>Fornecedores com as melhores avaliações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suppliers
                .filter(s => s.averageRating && s.averageRating > 0)
                .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
                .slice(0, 5)
                .map(supplier => {
                  const categoryId = supplier.categoryIds && supplier.categoryIds.length > 0 ? 
                    supplier.categoryIds[0] : undefined;
                  const category = categoryId ? categories.find(c => c.id === categoryId) : undefined;
                  
                  return (
                    <div key={supplier.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 overflow-hidden rounded-full">
                          <img 
                            src={supplier.image} 
                            alt={supplier.name} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">{supplier.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {supplier.city} {category && `• ${category.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= (supplier.averageRating || 0) 
                                ? "text-yellow-400 fill-yellow-400" 
                                : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {supplier.averageRating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              
              {suppliers.filter(s => s.averageRating && s.averageRating > 0).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum fornecedor foi avaliado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
