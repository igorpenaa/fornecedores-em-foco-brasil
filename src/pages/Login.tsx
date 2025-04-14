
import { useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <div className="flex w-full flex-col items-center space-y-4 sm:w-[350px] md:w-[400px]">
        <div className="flex items-center justify-center space-x-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores em Foco</h1>
        </div>
        <p className="text-center text-muted-foreground">
          Sistema de gestão e visualização de fornecedores
        </p>

        <Card className="w-full">
          <CardHeader>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
            
              <CardContent>
                <TabsContent value="login" className="mt-0">
                  <CardDescription className="mb-4">
                    Entre com suas credenciais para acessar o sistema
                  </CardDescription>
                  <LoginForm />
                  <div className="mt-4 text-center text-sm">
                    Credenciais de teste:<br />
                    <span className="font-medium">Master:</span> master@example.com / senha123<br />
                    <span className="font-medium">Admin:</span> admin@example.com / senha123<br />
                    <span className="font-medium">Usuário:</span> user@example.com / senha123
                  </div>
                </TabsContent>
                <TabsContent value="register" className="mt-0">
                  <CardDescription className="mb-4">
                    Crie sua conta para acessar o sistema
                  </CardDescription>
                  <RegisterForm />
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <Link to="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
              </Link>{" "}
              e{" "}
              <Link to="#" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
              </Link>
              .
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
