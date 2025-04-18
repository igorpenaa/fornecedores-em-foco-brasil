
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle, AlertTriangle } from "lucide-react";
import { stripeService, PlanType } from "@/services/stripe-service";

export default function PaymentSimulation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get("sessionId");
  const planId = searchParams.get("planId") as PlanType | null;
  
  const plan = planId 
    ? stripeService.getAvailablePlans().find(p => p.id === planId) 
    : null;
  
  useEffect(() => {
    if (!sessionId || !planId || !user) {
      setError("Informações de pagamento inválidas");
    }
  }, [sessionId, planId, user]);
  
  const handlePaymentSimulation = async () => {
    if (!sessionId || !planId || !user) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Registrar a assinatura
      await stripeService.simulatePaymentSuccess(sessionId, user.id, planId);
      
      setCompleted(true);
      toast({
        title: "Pagamento processado com sucesso!",
        description: "Sua assinatura foi ativada.",
      });
      
      // Aguardar alguns segundos e redirecionar para a página de seleção de categorias
      setTimeout(() => {
        navigate(`/select-categories?plan=${planId}`);
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      setError(error instanceof Error ? error.message : "Erro ao processar pagamento");
      toast({
        title: "Falha no processamento",
        description: "Não foi possível processar seu pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AppLayout title="Processamento de Pagamento" subtitle="Finalize sua assinatura">
      <div className="max-w-md mx-auto">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">
              {completed ? "Pagamento Concluído" : "Simulação de Pagamento"}
            </CardTitle>
            <CardDescription>
              {completed 
                ? "Sua assinatura foi ativada com sucesso!" 
                : `Finalize a assinatura do plano ${plan?.title || ""}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error ? (
              <div className="flex flex-col items-center p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-red-500 font-medium">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/plans")}>
                  Voltar para planos
                </Button>
              </div>
            ) : completed ? (
              <div className="flex flex-col items-center p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="font-medium">Pagamento processado com sucesso!</p>
                <p className="text-muted-foreground mt-2">
                  Você será redirecionado para selecionar suas categorias em instantes...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <p className="font-medium">Resumo da compra:</p>
                  <div className="flex justify-between mt-2">
                    <span>Plano {plan?.title}</span>
                    <span>R$ {plan?.price},00</span>
                  </div>
                  {plan?.savings && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      {plan.savings}
                    </p>
                  )}
                </div>
                
                <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-muted-foreground mb-2">
                    Simulação de Pagamento
                  </p>
                  <p className="text-sm">
                    Esta é uma simulação para fins de demonstração. Em um ambiente real, 
                    você seria redirecionado para o Stripe para processar o pagamento.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          {!completed && !error && (
            <CardFooter>
              <Button 
                onClick={handlePaymentSimulation} 
                className="w-full" 
                disabled={loading || !sessionId || !planId}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Simular Pagamento
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
