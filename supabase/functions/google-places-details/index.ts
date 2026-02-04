import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const { placeId, sessionToken } = await req.json();

    if (!placeId) {
      throw new Error("placeId is required");
    }

    // Use Google Places Details API (New)
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,addressComponents,location",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places Details API error:", response.status, errorText);
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse address components
    const components = data.addressComponents || [];
    
    const getComponent = (types: string[]): string => {
      const component = components.find((c: AddressComponent) => 
        types.some(t => c.types.includes(t))
      );
      return component?.longText || component?.shortText || "";
    };

    const getShortComponent = (types: string[]): string => {
      const component = components.find((c: AddressComponent) => 
        types.some(t => c.types.includes(t))
      );
      return component?.shortText || component?.longText || "";
    };

    // Extract structured address
    const address = {
      placeId: data.id,
      formattedAddress: data.formattedAddress,
      street: getComponent(["route"]),
      houseNumber: getComponent(["street_number"]),
      postalCode: getComponent(["postal_code"]),
      city: getComponent(["locality", "administrative_area_level_3", "administrative_area_level_2"]),
      country: getComponent(["country"]),
      countryCode: getShortComponent(["country"]),
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      isValid: Boolean(
        getComponent(["route"]) && 
        getComponent(["postal_code"]) && 
        getComponent(["locality", "administrative_area_level_3", "administrative_area_level_2"])
      ),
    };

    return new Response(
      JSON.stringify({ address }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in google-places-details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
