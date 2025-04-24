
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função de log para depuração aprimorada
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Obter chave do Stripe do ambiente
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Missing Stripe secret key");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Inicializar o cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    logStep("Supabase client initialized");

    // Verificar se há dados no corpo da requisição
    let requestData;
    try {
      if (req.body) {
        const reader = req.body.getReader();
        const { value } = await reader.read();
        const bodyText = new TextDecoder().decode(value);
        logStep("Request body as text", { bodyText });
        
        if (!bodyText || bodyText.trim() === '') {
          logStep("No JSON body or empty body");
          requestData = {};
        } else {
          requestData = JSON.parse(bodyText);
          logStep("Request data parsed", requestData);
        }
      } else {
        logStep("No request body");
        requestData = {};
      }
    } catch (jsonError) {
      // Se não conseguir fazer parse do corpo, isso pode ser uma requisição GET
      logStep("No JSON body or parse error (GET request likely)", { error: String(jsonError) });
      requestData = {};
    }
    
    const { userId } = requestData;

    if (!userId) {
      logStep("ERROR: Missing user ID");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    logStep("Checking subscription for user", { userId });
    
    // Use service role para acessar o banco de dados diretamente
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Obter o perfil do usuário que pode conter informações do plano
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('plano, email')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      logStep("Failed to get user profile", { error: profileError.message });
      return new Response(
        JSON.stringify({ error: `Failed to get user profile: ${profileError.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!userProfile) {
      logStep("User profile not found", { userId });
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Obter o plano do perfil do usuário
    const plano = userProfile?.plano || null;
    const isSubscribed = plano !== null && plano !== 'free';
    
    // Para fins de demonstração, calcular uma data de término com base no plano
    let subscriptionEnd = null;
    if (isSubscribed) {
      const endDate = new Date();
      if (plano === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plano === 'semi_annual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (plano === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      subscriptionEnd = endDate.toISOString();
    }
    
    logStep("Returning subscription status", { 
      subscribed: isSubscribed, 
      plan_type: plano,
      subscription_end: subscriptionEnd 
    });

    return new Response(JSON.stringify({
      subscribed: isSubscribed,
      plan_type: plano,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
