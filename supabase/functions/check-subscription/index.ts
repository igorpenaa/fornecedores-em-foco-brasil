
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Initialize Supabase client with anon key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

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

    // For now, simulate getting subscription information from Firebase
    // In a production environment, this would be replaced with calls to Stripe's API
    
    // Check if user has plan information (simulated logic)
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('plano')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      logStep("Failed to get user profile", { error: profileError.message });
    }
    
    // Determine subscription status based on plan
    const plano = userProfile?.plano || null;
    const isSubscribed = plano !== null && plano !== 'free';
    
    // Calculate end date (for demonstration)
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
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
