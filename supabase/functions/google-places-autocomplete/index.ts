import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { input, sessionToken } = await req.json();

    if (!input || input.trim().length < 3) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Places Autocomplete API (New)
    const url = new URL("https://places.googleapis.com/v1/places:autocomplete");
    
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        includedRegionCodes: ["DE", "AT", "CH"], // Deutschland, Österreich, Schweiz
        languageCode: "de",
        sessionToken: sessionToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", response.status, errorText);
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform to simpler format
    const predictions = (data.suggestions || []).map((suggestion: any) => ({
      placeId: suggestion.placePrediction?.placeId,
      description: suggestion.placePrediction?.text?.text,
      mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text,
      secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text,
    })).filter((p: any) => p.placeId);

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in google-places-autocomplete:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
