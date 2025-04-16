
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Highlight } from "@/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

export default function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is admin or master
  if (user?.role !== "admin" && user?.role !== "master") {
    navigate("/dashboard");
    return null;
  }
  
  return (
    <AppLayout title="Destaques" subtitle="Gerenciar destaques para o slideshow">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Destaques</CardTitle>
              <CardDescription>
                Gerencie os destaques que aparecerão no slideshow da página inicial.
              </CardDescription>
            </div>
            <Button>Adicionar Destaque</Button>
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
