import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { AppLayout } from "@/components/layout/app-layout";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Favorites() {
  const { user, canAccessGenius } = useAuth();
  const { suppliers } = useData();
  const navigate = useNavigate();

  // Prevent access to favorites for free plan users
  useEffect(() => {
    if (user?.plano === 'free') {
      navigate('/plans');
    }
  }, [user, navigate]);

  // Helper function to check if user is a Genius student with pending access
  const isGeniusStudentPending = user?.geniusCoupon === "ALUNOREDEGENIUS" && user?.geniusStatus !== "approved";

  // Helper function to check if user is a Genius student with blocked access
  const isGeniusStudentBlocked = user?.geniusCoupon === "ALUNOREDEGENIUS" && user?.geniusStatus === "blocked";

  // Function to filter suppliers based on user role and status
  const filterSuppliersByUserAccess = () => {
    if (!user) return [];
    
    if (user.role === "master" || user.role === "admin") {
      return suppliers.filter((supplier) => user.favorites.includes(supplier.id));
    }

    if (user.geniusCoupon === "ALUNOREDEGENIUS") {
      if (user.geniusStatus === "approved") {
        // Only show free suppliers and Genius student suppliers that are in favorites
        return suppliers.filter((supplier) => 
          user.favorites.includes(supplier.id) && 
          (supplier.isFreeSupplier || supplier.isGeniusStudent)
        );
      }
      return []; // If not approved, show no suppliers
    }

    // Regular users see all suppliers in their favorites
    return suppliers.filter((supplier) => user.favorites.includes(supplier.id));
  };

  const favoriteSuppliers = filterSuppliersByUserAccess();

  if (isGeniusStudentPending) {
    return (
      <AppLayout title="Favoritos" subtitle="Seus fornecedores favoritos">
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-yellow-800 dark:text-yellow-400">
              <AlertCircle size={24} />
              Acesso Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-yellow-700 dark:text-yellow-300">
              Olá <strong>{user?.name}</strong>, estamos verificando sua matrícula diretamente no sistema. 
              Favor aguarde a autorização de acesso do administrador.
            </CardDescription>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (isGeniusStudentBlocked) {
    return (
      <AppLayout title="Favoritos" subtitle="Seus fornecedores favoritos">
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-red-800 dark:text-red-400">
              <AlertCircle size={24} />
              Acesso Bloqueado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-red-700 dark:text-red-300">
              Seu acesso está temporariamente bloqueado. Entre em contato com o administrador para mais informações.
            </CardDescription>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

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
