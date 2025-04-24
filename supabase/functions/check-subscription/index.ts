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
  // Lidar com requisições OPTIONS ( CORS preflight )
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

    // Inicializar o cliente Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Inicializar o cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    logStep("Supabase client initialized");

    // CORREÇÃO: Processar o body da requisição com tratamento de erro robusto
    let requestData;
    try {
      // Verificar se o body está vazio ou é nulo
      if (!req.body) {
        logStep("ERROR: Request body is null");
        return new Response(
          JSON.stringify({ error: "Request body is required" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Tentar ler o corpo da requisição como texto
      const bodyText = await req.text();
      logStep("Request body received", { bodyText });
      
      if (!bodyText || bodyText.trim() === '') {
        logStep("ERROR: Empty request body");
        return new Response(
          JSON.stringify({ error: "Empty request body" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Tentar fazer parsing do JSON
      try {
        requestData = JSON.parse(bodyText);
        logStep("Request data parsed", requestData);
      } catch (jsonError) {
        logStep("JSON parse error", { error: String(jsonError) });
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } catch (bodyError) {
      logStep("ERROR: Failed to read request body", { error: String(bodyError) });
      return new Response(
        JSON.stringify({ error: "Failed to read request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Verificar se userId está presente
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
    
    // Obter o perfil do usuário que pode conter informações do cliente Stripe
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .maybeSingle();
    
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
    
    if (!userProfile?.stripe_customer_id) {
      logStep("No Stripe customer ID found", { userId });
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan_type: 'free',
          subscription_end: null
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    try {
      // Buscar assinaturas ativas do cliente no Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: userProfile.stripe_customer_id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        logStep("No active subscriptions found", { customerId: userProfile.stripe_customer_id });
        return new Response(
          JSON.stringify({ 
            subscribed: false,
            plan_type: 'free',
            subscription_end: null
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      const subscription = subscriptions.data[0];
      const planType = subscription.items.data[0].price.lookup_key || 'unknown';
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id,
        planType,
        endDate: new Date(subscription.current_period_end * 1000).toISOString()
      });

      return new Response(JSON.stringify({
        subscribed: true,
        plan_type: planType,
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
      
    } catch (stripeError) {
      logStep("ERROR: Failed to check Stripe subscription", { error: String(stripeError) });
      return new Response(
        JSON.stringify({ error: `Failed to check subscription: ${String(stripeError)}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});