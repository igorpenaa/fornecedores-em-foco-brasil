
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle } from "lucide-react";

export default function GeniusNetwork() {
  const { suppliers } = useData();
  const { user, canAccessGenius } = useAuth();

  const geniusSuppliers = suppliers.filter(supplier => supplier.isGeniusStudent);
  const hasAccess = canAccessGenius();

  if (!hasAccess && user?.geniusCoupon === "ALUNOREDEGENIUS") {
    return (
      <AppLayout 
        title="Rede Genius" 
        subtitle="Fornecedores da Rede Genius"
      >
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

  if (!hasAccess) {
    return (
      <AppLayout 
        title="Rede Genius" 
        subtitle="Fornecedores da Rede Genius"
      >
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-red-800 dark:text-red-400">
              <Lock size={24} />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base text-red-700 dark:text-red-300">
              Esta área é exclusiva para alunos da Rede Genius. Cadastre-se com o cupom 
              ALUNOREDEGENIUS para solicitar acesso.
            </CardDescription>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Rede Genius" 
      subtitle="Fornecedores da Rede Genius"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {geniusSuppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </AppLayout>
  );
}
