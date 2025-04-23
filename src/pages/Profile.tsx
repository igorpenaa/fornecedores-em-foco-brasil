
import { useAuth } from "@/contexts/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout title="Perfil" subtitle="Gerencie suas informações e assinatura">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
              <p className="text-lg">{user?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tipo de Usuário</h3>
              <p className="text-lg capitalize">
                {user?.role === "master" 
                  ? "Master" 
                  : user?.role === "admin" 
                  ? "Administrador" 
                  : "Usuário"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === "master" || user?.role === "admin" ? (
              <p className="text-muted-foreground">
                Como {user.role === "master" ? "Master" : "Administrador"}, 
                você tem acesso completo ao sistema sem necessidade de assinatura.
              </p>
            ) : user?.plano && user.plano !== 'free' ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Plano Atual</h3>
                  <p className="text-lg">{user.plano}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Validade</h3>
                  <p className="text-lg">Em vigor</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/plans")}
                >
                  Ver Outros Planos
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Você ainda não possui uma assinatura ativa.
                </p>
                <Button 
                  onClick={() => navigate("/plans")}
                >
                  Escolher um Plano
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
