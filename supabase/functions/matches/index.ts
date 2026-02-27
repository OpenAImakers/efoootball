import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey"
      }
    });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json(); // Get POST body
    const league = body.league || 1; // default to Premier League

    const res = await fetch(`https://sports.bzzoiro.com/api/events/?league=${league}`, {
      headers: {
        "Authorization": "Token 8b58c662fa8f89fc82a5d2d5d015841a5751696e"
      }
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // <- allows browser requests
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, apikey"
      }
    });
  }
});