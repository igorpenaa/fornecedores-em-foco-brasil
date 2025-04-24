
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { stripeService } from "@/services/stripe/stripe-service";
import { PlanType } from "@/services/stripe/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function PlansPage() {
  const { user, canAccessApp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const plans = stripeService.getAvailablePlans();

  useEffect(() => {
    console.log("PlansPage - user role:", user?.role);
    if (user && (user.role === "admin" || user.role === "master")) {
      console.log("Redirecionando admin/master para dashboard");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSelectPlan = async (planId: string) => {
    // Validate that planId is a valid PlanType
    const validPlanId = planId as PlanType;
    
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para assinar um plano",
        variant: "destructive",
      });
      return navigate("/login");
    }

    setErrorMessage(null);

    if (processingPlan) return;
    setProcessingPlan(planId);

    try {
      console.log(`Iniciando processo para plano: ${planId} para usuário: ${user.id}`);
      
      if (validPlanId === 'free') {
        console.log("Atualizando usuário para plano free");
        await stripeService.registerFreeSubscription(user.id);
        
        toast({
          title: "Plano gratuito ativado",
          description: "Você agora tem acesso aos fornecedores gratuitos",
        });
        
        navigate("/dashboard");
        return;
      }
      
      const checkoutUrl = await stripeService.createCheckoutSession(validPlanId, user.id);
      console.log("URL de checkout recebida:", checkoutUrl);
      
      if (checkoutUrl.startsWith('http')) {
        window.location.href = checkoutUrl;
      } else {
        navigate(checkoutUrl);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Não foi possível processar sua solicitação";
      setErrorMessage(errorMsg);
      
      toast({
        title: "Erro ao processar",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  if (user && (user.role === "admin" || user.role === "master")) {
    return null;
  }

  return (
    <AppLayout title="Planos de Assinatura" subtitle="Escolha o plano ideal para o seu negócio">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao processar pagamento</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <p className="mt-2">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
          </AlertDescription>
        </Alert>
      )}
      
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
                disabled={processingPlan !== null}
              >
                {processingPlan === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  plan.id === 'free' ? "Iniciar Gratuitamente" : "Assinar Agora"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
