
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { stripeService, PlanType } from "@/services/stripe-service";

interface PlanSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanSelectionDialog({ open, onOpenChange }: PlanSelectionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const plans = stripeService.getAvailablePlans();

  const handleSelectPlan = async (planId: PlanType) => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para assinar um plano",
        variant: "destructive",
      });
      onOpenChange(false);
      return navigate("/login");
    }

    // Evita cliques múltiplos
    if (processingPlan) return;
    setProcessingPlan(planId);

    try {
      // Fechar o diálogo imediatamente para evitar problemas de estado
      onOpenChange(false);
      
      // Para o plano gratuito
      if (planId === 'free') {
        await stripeService.registerFreeSubscription(user.id);
        toast({
          title: "Plano gratuito ativado",
          description: "Você agora tem acesso aos fornecedores gratuitos",
        });
        navigate("/dashboard");
        return;
      }

      // Para planos pagos, redirecionar para o Stripe Checkout ou simulação
      const checkoutUrl = await stripeService.createCheckoutSession(planId, user.id);
      console.log("URL de checkout recebida:", checkoutUrl);
      
      // No caso da migração para Supabase, vamos manter o comportamento de redirecionamento
      // e apenas modificar o back-end posteriormente
      if (checkoutUrl.startsWith('http')) {
        window.location.href = checkoutUrl;
      } else {
        navigate(checkoutUrl);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      toast({
        title: "Erro ao processar",
        description: error instanceof Error ? error.message : "Não foi possível processar sua solicitação",
        variant: "destructive",
      });
      setProcessingPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Escolha seu plano</DialogTitle>
          <DialogDescription>
            Selecione o plano ideal para acessar todos os recursos
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-4">
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
      </DialogContent>
    </Dialog>
  );
}
