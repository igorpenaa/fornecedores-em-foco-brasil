
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { stripeService, PlanType } from "@/services/stripe-service";

export default function PlansPage() {
  const { user, canAccessApp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const plans = stripeService.getAvailablePlans();

  // Redirecionar admin/master para o dashboard
  useEffect(() => {
    console.log("PlansPage - user role:", user?.role);
    if (user && (user.role === "admin" || user.role === "master")) {
      console.log("Redirecionando admin/master para dashboard");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Verificar se o usuário já tem uma assinatura ativa e pode acessar o app
  // Remova esta redireção para permitir que usuários com assinatura vejam os planos
  // para mudar de assinatura se desejarem
  // useEffect(() => {
  //  console.log("PlansPage - can access app:", canAccessApp());
  //  if (canAccessApp() && user?.role !== "admin" && user?.role !== "master") {
  //    console.log("Usuário com assinatura, redirecionando para dashboard");
  //    navigate("/dashboard");
  //  }
  // }, [canAccessApp, navigate, user]);

  const handleSelectPlan = async (planId: PlanType) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para assinar um plano",
        variant: "destructive",
      });
      return navigate("/login");
    }

    try {
      const checkoutUrl = await stripeService.createCheckoutSession(planId, user.id);
      
      // Para plano free, redirecionar diretamente para dashboard em vez da seleção de categorias
      if (planId === 'free') {
        // Garantir que o usuário tenha o campo plano atualizado para 'free' antes de redirecionar
        navigate("/dashboard");
      } else {
        // Para planos pagos, redirecionar para o Stripe Checkout
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Não foi possível processar sua solicitação",
        variant: "destructive",
      });
    }
  };

  // Se for um usuário admin ou master, não mostra a página de planos
  if (user && (user.role === "admin" || user.role === "master")) {
    return null;
  }

  return (
    <AppLayout title="Planos de Assinatura" subtitle="Escolha o plano ideal para o seu negócio">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col border-2 ${
              plan.highlighted 
                ? "border-blue-500 dark:border-blue-400 shadow-lg" 
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            {plan.highlighted && (
              <div className="bg-blue-500 text-white py-1 px-3 text-xs font-semibold uppercase tracking-wider text-center">
                Mais vendido
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-xl">{plan.title}</CardTitle>
              <CardDescription>
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow">
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {plan.price === 0 ? "Grátis" : `R$ ${plan.price},00`}
                  {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">
                    {plan.id === 'monthly' ? '/mês' : plan.id === 'semi_annual' ? '/semestre' : '/ano'}
                  </span>}
                </p>
                {plan.savings && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                    {plan.savings}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Principais recursos:</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2 mt-0.5 text-green-500 dark:text-green-400">
                        <Check size={16} />
                      </span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full ${
                  plan.highlighted 
                    ? "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" 
                    : ""
                }`}
                variant={plan.id === 'free' ? "outline" : "default"}
              >
                {plan.id === 'free' ? "Iniciar Gratuitamente" : "Assinar Agora"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
