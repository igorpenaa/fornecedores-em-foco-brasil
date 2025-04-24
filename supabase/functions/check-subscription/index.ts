
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
      throw new Error("No authorization header provided");
    }

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("ERROR: Authentication error", { message: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    logStep("Stripe initialized");

    // Try to get an existing subscription from the database first
    logStep("Checking user profile for subscription data");
    
    // Get the user profile which might contain plan information
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('plano')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      logStep("Failed to get user profile", { error: profileError.message });
    }
    
    // Get the plan from user profile
    const plano = userProfile?.plano || null;
    const isSubscribed = plano !== null && plano !== 'free';
    
    // For demonstration purposes, calculate an end date based on plan
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
