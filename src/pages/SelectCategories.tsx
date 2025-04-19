
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { stripeService, PlanType } from "@/services/stripe-service";

export default function SelectCategories() {
  const { user, refreshSubscription } = useAuth();
  const { categories } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  
  const planId = searchParams.get("plan") as PlanType | null;
  
  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (!user) {
        navigate("/plans");
        return;
      }
      
      try {
        // Atualizar a assinatura do usuário
        await refreshSubscription();
        
        const userSubscription = await stripeService.getUserSubscription(user.id);
        if (!userSubscription) {
          toast({
            title: "Assinatura não encontrada",
            description: "Não foi possível encontrar sua assinatura. Verifique seu plano.",
            variant: "destructive",
          });
          navigate("/plans");
          return;
        }
        
        setSubscription(userSubscription);
        
        // Se for plano anual, redirecionar para o dashboard (não precisa selecionar categorias)
        if (userSubscription.planType === 'annual' || user.plano === 'annual') {
          navigate("/dashboard");
          return;
        }
        
        // Se já tem categorias selecionadas, carrega-as
        if (userSubscription.selectedCategories && userSubscription.selectedCategories.length > 0) {
          setSelectedCategories(userSubscription.selectedCategories);
        }
        
        // Carrega detalhes do plano
        const planDetails = stripeService.getAvailablePlans().find(p => p.id === userSubscription.planType);
        if (planDetails) {
          setPlan(planDetails);
        }
      } catch (error) {
        console.error("Erro ao carregar assinatura:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar sua assinatura. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSubscriptionData();
  }, [user, planId, navigate, toast, refreshSubscription]);
  
  const handleCategorySelection = (categoryId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };
  
  const handleSaveCategories = async () => {
    if (!user || !subscription) return;
    
    // Obtém o limite de categorias com base no plano atual do usuário
    let maxCategories = 0;
    if (user.plano === 'monthly' || subscription.planType === 'monthly') {
      maxCategories = 10;
    } else if (user.plano === 'semi_annual' || subscription.planType === 'semi_annual') {
      maxCategories = 20;
    } else if (user.plano === 'annual' || subscription.planType === 'annual') {
      // Plano anual não tem limite de categorias
      maxCategories = Infinity;
    }
    
    // Verificar se não excedeu o limite de categorias
    if (selectedCategories.length > maxCategories) {
      toast({
        title: "Limite excedido",
        description: `Você só pode selecionar até ${maxCategories} categorias com o seu plano atual`,
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      await stripeService.updateSelectedCategories(user.id, selectedCategories);
      
      toast({
        title: "Categorias salvas",
        description: "Suas categorias foram salvas com sucesso!",
      });
      
      // Redirecionar para a dashboard após salvar
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar categorias:", error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar suas categorias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Carregando..." subtitle="Aguarde enquanto carregamos suas informações">
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Determinar o limite de categorias com base no plano atual
  let categoriesLimit = 0;
  if (user?.plano === 'monthly' || subscription?.planType === 'monthly') {
    categoriesLimit = 10;
  } else if (user?.plano === 'semi_annual' || subscription?.planType === 'semi_annual') {
    categoriesLimit = 20;
  } else if (user?.plano === 'annual' || subscription?.planType === 'annual') {
    // Return a UI for annual plan users indicating they have access to all categories
    return (
      <AppLayout title="Assinatura Anual" subtitle="Acesso a todas as categorias">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Acesso Completo
            </CardTitle>
            <CardDescription>
              Parabéns! Com seu plano anual, você tem acesso a todas as categorias e recursos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você não precisa selecionar categorias específicas, pois tem acesso ilimitado a todas elas.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Ir para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </AppLayout>
    );
  }
  
  const categoriesCount = selectedCategories.length;
  const reachedLimit = categoriesCount >= categoriesLimit;
  
  return (
    <AppLayout 
      title="Selecione suas Categorias" 
      subtitle={`Escolha até ${categoriesLimit} categorias de fornecedores`}
    >
      <div className="mb-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Seu plano: {plan?.title || user?.plano}</CardTitle>
            <CardDescription>
              {plan?.description || (user?.plano === 'monthly' ? 'Acesso a até 10 categorias' : 'Acesso a até 20 categorias')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                Categorias selecionadas:
              </p>
              <p className={`text-sm font-medium ${
                reachedLimit ? "text-orange-500 dark:text-orange-400" : "text-green-500 dark:text-green-400"
              }`}>
                {categoriesCount} de {categoriesLimit}
              </p>
            </div>
            
            {reachedLimit && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm text-orange-700 dark:text-orange-300">
                <AlertCircle className="h-4 w-4" />
                <p>Limite de categorias atingido. Desmarque alguma para selecionar outra.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map(category => (
          <Card key={category.id} className="overflow-hidden">
            <div className="relative pb-[56.25%]">
              <img 
                src={category.image} 
                alt={category.name} 
                className="absolute h-full w-full object-cover"
              />
            </div>
            <div className="p-4 flex items-start gap-3">
              <Checkbox 
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)} 
                onCheckedChange={(checked) => {
                  if (checked && reachedLimit && !selectedCategories.includes(category.id)) {
                    toast({
                      title: "Limite atingido",
                      description: `Você já selecionou o máximo de ${categoriesLimit} categorias.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  handleCategorySelection(category.id, !!checked);
                }}
              />
              <label 
                htmlFor={`category-${category.id}`} 
                className="font-medium cursor-pointer"
              >
                {category.name}
              </label>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleSaveCategories} 
          className="min-w-32"
          disabled={saving || categoriesCount === 0}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar e Continuar"
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
