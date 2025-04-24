
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get Stripe secret from environment
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: Missing Stripe secret key");
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    logStep("Supabase client initialized");
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("ERROR: Authentication error", { message: userError.message });
      return new Response(
        JSON.stringify({ error: `Authentication error: ${userError.message}` }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const user = userData.user;
    if (!user) {
      logStep("ERROR: User not authenticated");
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    logStep("User authenticated", { userId: user.id });

    // Get request data
    let requestData;
    try {
      requestData = await req.json();
      logStep("Request data parsed", requestData);
    } catch (jsonError) {
      logStep("ERROR: Invalid JSON in request body");
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { planId } = requestData;
    logStep("Received request data", { planId });

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

    // For free plan, handle it directly
    if (planId === 'free') {
      logStep("Processing free plan");
      
      // Use service role key for admin access to update user profile
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      // Update user profile with free plan
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ plan: 'free' })
        .eq('id', user.id);
      
      if (updateError) {
        logStep("ERROR: Failed to update user profile", { error: updateError.message });
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }
      
      logStep("Free plan activated successfully");
      return new Response(JSON.stringify({ url: '/dashboard' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For paid plans, create a Stripe checkout session
    logStep("Creating Stripe checkout session for plan", { planId });
    
    // Define prices based on plan
    const prices = {
      'monthly': 'price_1RDxMLF8ZVI3gHwE4BYIgzy1',
      'semi_annual': 'price_1RDxRCF8ZVI3gHwEhCAB049h',
      'annual': 'price_1RDxRCF8ZVI3gHwEbf17KfeO'
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
    
    // Check if user already exists as a Stripe customer
    const { data: customers, error: customerError } = await stripe.customers.list({ 
      email: user.email,
      limit: 1
    });
    
    if (customerError) {
      logStep("ERROR: Failed to check Stripe customer", { error: customerError });
      throw new Error(`Failed to check Stripe customer: ${customerError}`);
    }
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create a new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }
    
    // Create the checkout session
    const origin = req.headers.get('origin') || 'http://localhost:5173';
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
        userId: user.id,
        planId: planId
      }
    });
    
    logStep("Checkout session created", { sessionId: session.id, url: session.url });
    
    // Return the checkout URL
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    // Return a proper error response
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
