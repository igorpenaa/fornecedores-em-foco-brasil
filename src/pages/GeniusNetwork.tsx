
import { useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { SupplierCard } from "@/components/suppliers/supplier-card";

export default function GeniusNetwork() {
  const { suppliers } = useData();
  const { user } = useAuth();

  const geniusSuppliers = suppliers.filter(supplier => supplier.isGeniusStudent);

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
