import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AT_USERNAME = "efootball";
const AT_API_KEY = Deno.env.get("REACT_APP_AT_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apiKey, content-type",
      },
    });
  }

  try {
    const { phone, message } = await req.json();

    // 1. Correctly build the URL search params payload
    const payload = new URLSearchParams();
    payload.append("username", AT_USERNAME);
    payload.append("to", phone);
    payload.append("message", message);

    // 2. Transmit using the correct urlencoded content-type header
    const response = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded", // Fix: Tell AT form data is incoming
          "apiKey": AT_API_KEY || "",
        },
        body: payload.toString(), // Fix: Pass the converted parameters string
      }
    );

    const rawText = await response.text();

    return new Response(
      JSON.stringify({
        status: response.status,
        response: rawText,
      }),
      {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});