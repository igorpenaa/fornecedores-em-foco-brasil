
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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    logStep("CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Obter chave do Stripe do ambiente
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Missing Stripe secret key");
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is not set in environment variables" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Inicializando o cliente Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Inicializando o cliente Supabase
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
        logStep("ERROR: Invalid JSON in request body", { error: String(jsonError) });
        return new Response(
          JSON.stringify({ error: `Invalid JSON in request body: ${String(jsonError)}` }),
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
    
    const { planId, userId } = requestData;
    logStep("Received request data", { planId, userId });

    if (!planId) {
      logStep("ERROR: Missing plan ID");
      return new Response(
        JSON.stringify({ error: "Plan ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

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

    // Para plano gratuito, tratar diretamente
    if (planId === 'free') {
      logStep("Processing free plan");
      
      // CORREÇÃO: Não tentar converter o ID do Firebase para UUID pois isso está
      // causando o erro "invalid input syntax for type uuid"
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      try {
        // Atualizar perfil do usuário com plano gratuito
        // Como o userId é do Firebase, precisamos buscar pelo perfil sem assumir que é um UUID
        const { data: userProfile, error: findError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        
        if (findError) {
          logStep("ERROR: Failed to find user profile", { error: findError.message });
          return new Response(
            JSON.stringify({ error: `Failed to find user profile: ${findError.message}` }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        if (!userProfile) {
          logStep("ERROR: User not found", { userId });
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { 
              status: 404, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        // Agora podemos atualizar o perfil
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ plan: 'free' })
          .eq('id', userId);
        
        if (updateError) {
          logStep("ERROR: Failed to update user profile", { error: updateError.message });
          return new Response(
            JSON.stringify({ error: `Failed to update user profile: ${updateError.message}` }),
            { 
              status: 500, 
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
        
        logStep("Free plan activated successfully");
        return new Response(JSON.stringify({ url: '/dashboard' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } catch (error: any) {
        logStep("ERROR: Failed to process free plan", { error: String(error) });
        return new Response(
          JSON.stringify({ error: `Failed to process free plan: ${String(error)}` }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Para planos pagos, criar uma sessão de checkout do Stripe
    logStep("Creating Stripe checkout session for plan", { planId });
    
    // Definir preços com base no plano - usando os IDs de preço corretos
    const prices = {
      'monthly': 'price_1RHSBjF8ZVI3gHwEhAFQHohQ',      // Mensal - R$ 47,00
      'semi_annual': 'price_1RHSCpF8ZVI3gHwEvCvRPy3w',  // Semestral - R$ 145,00
      'annual': 'price_1RHSCpF8ZVI3gHwEDBNsrmXI'        // Anual - R$ 193,00
    };
    
    const priceId = prices[planId as keyof typeof prices];
    if (!priceId) {
      logStep("ERROR: Invalid plan ID");
      return new Response(
        JSON.stringify({ error: `Invalid plan ID: ${planId}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // IMPORTANTE: Corrigido para trabalhar com Firebase ID
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Buscar usuário por ID diretamente sem esperar um UUID
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !userData) {
      logStep("ERROR: Could not find user", { error: userError?.message, userId });
      return new Response(
        JSON.stringify({ error: `User not found: ${userError?.message || 'Unknown error'}` }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!userData.email) {
      logStep("ERROR: User email not found");
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verificar se o usuário já existe como cliente no Stripe
    let customerId;
    try {
      const email = userData.email;
      logStep("Checking if user exists as Stripe customer", { email });
      const customers = await stripe.customers.list({ 
        email: email,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      } else {
        // Criar um novo cliente no Stripe
        const newCustomer = await stripe.customers.create({
          email: email,
          metadata: {
            userId: userId
          }
        });
        customerId = newCustomer.id;
        logStep("Created new Stripe customer", { customerId });
      }
    } catch (stripeError) {
      logStep("ERROR: Failed to check or create Stripe customer", { error: String(stripeError) });
      return new Response(
        JSON.stringify({ error: `Stripe error: ${String(stripeError)}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Criar a sessão de checkout
    try {
      const origin = req.headers.get('origin') || 'https://id-preview--686bd920-c5cb-4628-8600-94a0584b0d92.lovable.app';
      logStep("Creating checkout session with origin", { origin });
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/plans`,
        metadata: {
          userId: userId,
          planId: planId
        }
      });
      
      logStep("Checkout session created", { sessionId: session.id, url: session.url });
      
      // Registrar a sessão de checkout no banco de dados
      await supabaseAdmin
        .from('stripe_checkout_sessions')
        .insert({
          session_id: session.id,
          user_id: userId,
          plan_id: planId,
          price_id: priceId,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      // Retornar a URL de checkout
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (checkoutError: any) {
      logStep("ERROR: Failed to create checkout session", { error: String(checkoutError) });
      return new Response(
        JSON.stringify({ error: `Failed to create checkout session: ${String(checkoutError)}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR in create-checkout", { message: errorMessage });
    
    // Retornar uma resposta de erro adequada
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
