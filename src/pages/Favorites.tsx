
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { AppLayout } from "@/components/layout/app-layout";
import { SupplierCard } from "@/components/suppliers/supplier-card";

export default function Favorites() {
  const { user } = useAuth();
  const { suppliers } = useData();

  const favoriteSuppliers = suppliers.filter((supplier) =>
    user?.favorites.includes(supplier.id)
  );

  return (
    <AppLayout title="Favoritos" subtitle="Seus fornecedores favoritos">
      {favoriteSuppliers.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">Nenhum favorito encontrado</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Você ainda não adicionou nenhum fornecedor aos favoritos.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
