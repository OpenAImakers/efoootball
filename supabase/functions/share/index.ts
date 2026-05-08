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
  const { data: reg } = await supabase
    .from('registrations')
    .select('name, avatar_url, registration_amount')
    .eq('id', id)
    .single()

  // 3. Define fallback values
  const title = reg?.name || "eFootball Tournament";
  const image = reg?.avatar_url || "https://computerscience.website/assets/websitepreview.jpg";
  const desc = `Join the tournament! Entry: KES ${reg?.registration_amount || '0'}`;
  
  // 4. THE MAGIC: Return HTML with Meta Tags + Redirect
  // Replace 'https://yourapp.com' with your actual hosted URL
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc}">
      <meta property="og:image" content="${image}">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="${image}">
      
      <!-- Redirect the human to your CRA app -->
      <script>
        window.location.href = "https://efootballkenyaleague.website/registration/${id}";
      </script>
      <meta http-equiv="refresh" content="0;url=https://efootballkenyaleague.website/registration/${id}">
    </head>
    <body style="background: black; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
      <p>Loading tournament details...</p>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8" },
  })
})