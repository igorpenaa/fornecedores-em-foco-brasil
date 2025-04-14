
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/data-context";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { useAuth } from "@/contexts/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from "@/types";

export default function Suppliers() {
  const { categories, suppliers } = useData();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>(suppliers);

  // Filtrar fornecedores baseado nos critérios
  useEffect(() => {
    let result = suppliers;

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(term) ||
          supplier.city.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoria
    if (selectedCategory) {
      result = result.filter(
        (supplier) => supplier.categoryId === selectedCategory
      );
    }

    // Filtrar apenas favoritos
    if (showOnlyFavorites && user) {
      result = result.filter((supplier) =>
        user.favorites.includes(supplier.id)
      );
    }

    setFilteredSuppliers(result);
  }, [suppliers, searchTerm, selectedCategory, showOnlyFavorites, user]);

  return (
    <AppLayout title="Fornecedores" subtitle="Gerencie e visualize fornecedores">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar fornecedores..."
              className="w-full pl-8 md:w-[280px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Card className="border-dashed">
              <CardContent className="flex items-center gap-2 p-2">
                <Select 
                  value={selectedCategory || ""} 
                  onValueChange={(value) => setSelectedCategory(value || null)}
                >
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSelectedCategory(null)}
                >
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Limpar filtro</span>
                </Button>
              </CardContent>
            </Card>

            <Button
              variant={showOnlyFavorites ? "default" : "outline"}
              size="sm"
              className="h-10"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              {showOnlyFavorites ? "Somente Favoritos" : "Todos"}
            </Button>
          </div>
        </div>

        {hasPermission(["master", "admin"]) && (
          <Button className="gap-1" onClick={() => navigate("/supplier/new")}>
            <Plus className="h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        )}
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Filter className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum fornecedor encontrado</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Não foram encontrados fornecedores com os filtros selecionados. Tente ajustar seus critérios de busca.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory(null);
              setShowOnlyFavorites(false);
            }}>
              Limpar Filtros
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
