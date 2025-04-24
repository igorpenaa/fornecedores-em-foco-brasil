
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Initialize Supabase client with anon key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Authenticate user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("ERROR: Authentication error", { message: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      logStep("ERROR: User not authenticated");
      throw new Error("User not authenticated");
    }
    
    logStep("User authenticated", { userId: user.id });

    // Get request data
    const requestData = await req.json();
    const { planId } = requestData;
    logStep("Received request data", { planId });

    if (!planId) {
      logStep("ERROR: Missing plan ID");
      throw new Error("Plan ID is required");
    }

    // For free plan, we'll handle it directly without Stripe checkout
    if (planId === 'free') {
      logStep("Processing free plan");
      
      // Update user profile with free plan
      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({ plano: 'free' })
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

    // For paid plans, we would normally create a Stripe checkout session
    // Since we don't have Stripe integrated yet, we'll simulate the process
    
    // In a real implementation, we would create a Stripe checkout session here
    // For now, simulate by redirecting to a payment simulation page
    const simulationUrl = `/payment-simulation?planId=${planId}&sessionId=sim_${Date.now()}`;
    logStep("Redirecting to payment simulation", { url: simulationUrl });
    
    return new Response(JSON.stringify({ url: simulationUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
