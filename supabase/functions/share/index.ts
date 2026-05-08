import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  // 1. Initialize Supabase Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // 2. Fetch the specific registration data
  // We use the service_role-like access inherent in Edge Functions 
  // or rely on public select permissions in your RLS.
  const { data: reg } = await supabase
    .from('registrations')
    .select('name, avatar_url, registration_amount')
    .eq('id', id)
    .single()

  // 3. Define fallback values
  const title = reg?.name || "eFootball Tournament";
  // Fallback to your main site logo if no tournament image exists
  const image = reg?.avatar_url || "https://computerscience.website/assets/websitepreview.jpg";
  const desc = reg ? `Entry Fee: KES ${reg.registration_amount}. Join the eFootball Kenya League squad!` : "Click to view tournament details and register.";
  
  // The destination URL on your main React site
  const redirectUrl = `https://efootballkenyaleague.website/registration/${id}`;
  
  // 4. THE MAGIC: Return HTML with Meta Tags for Bots + Redirect for Humans
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>

      <!-- Open Graph / Facebook / WhatsApp -->
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc}">
      <meta property="og:image" content="${image}">
      <meta property="og:url" content="${redirectUrl}">
      <meta property="og:type" content="website">

      <!-- Twitter Card -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${desc}">
      <meta name="twitter:image" content="${image}">
      
      <!-- Redirect the human user to the CRA app -->
      <script>
        // Immediate JS redirect
        window.location.href = "${redirectUrl}";
      </script>
      
      <!-- Fallback meta refresh if JS is disabled (0 seconds delay) -->
      <meta http-equiv="refresh" content="0;url=${redirectUrl}">
    </head>
    <body style="background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin: 0 auto 20px;"></div>
        <p style="font-size: 1.2rem; font-weight: 500;">Loading Tournament...</p>
      </div>

      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 
      "Content-Type": "text/html; charset=UTF-8",
      // Prevent browser caching so data stays fresh
      "Cache-Control": "no-cache, no-store, must-revalidate"
    },
  })
})