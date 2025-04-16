
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Issue } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin or master
  if (user?.role !== "admin" && user?.role !== "master") {
    navigate("/dashboard");
    return null;
  }
  
  return (
    <AppLayout title="Termos de Avaliação" subtitle="Gerenciar termos para avaliações negativas">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Termos de Avaliação</CardTitle>
              <CardDescription>
                Gerencie os termos que os usuários podem selecionar em avaliações negativas.
              </CardDescription>
            </div>
            <Button>Adicionar Termo</Button>
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
