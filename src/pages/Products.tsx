
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin or master
  if (user?.role !== "admin" && user?.role !== "master") {
    navigate("/dashboard");
    return null;
  }
  
  return (
    <AppLayout title="Produtos" subtitle="Gerenciar produtos em destaque">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Gerencie os produtos que aparecerão em destaque na página inicial.
              </CardDescription>
            </div>
            <Button>Adicionar Produto</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Esta funcionalidade será implementada em breve.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
