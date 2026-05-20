import { createClient } from "npm:@supabase/supabase-js";
import { Resend } from "npm:resend";

Deno.serve(async (req) => {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );

  try {
    const { record } = await req.json();
    let tournament = record;
    
    // Fallback if manual test execution lacks a webhook payload
    if (!tournament) {
      const { data: latestTournament, error: tournamentError } = await supabase
        .from("registrations")
        .select(`
          id,
          name,
          created_at,
          tournament_type,
          max_players,
          avatar_url,
          registration_amount,
          created_by
        `)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (tournamentError) throw tournamentError;
      tournament = latestTournament;
    }

    if (!tournament?.created_by) {
      throw new Error("Missing creator reference ID mapping.");
    }

    // Resolve structural email information safely via Supabase administrative layer
    const { data: creator, error: creatorError } = await supabase.auth.admin.getUserById(
      tournament.created_by
    );

    if (creatorError) throw creatorError;
    const creatorEmail = creator.user.email;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111">
        <h1 style="margin-bottom:10px;">
          Tournament Created Successfully: ${tournament.name}
        </h1>

        <a href="https://efootballkenyaleague.website/" target="_blank">
          <img 
            src="${tournament.avatar_url || 'https://via.placeholder.com/600x300'}"
            style="width:100%;border-radius:12px;display:block"
            alt="Tournament banner"
          />
        </a>

        <p><strong>Created At:</strong> ${new Date(tournament.created_at).toLocaleString()}</p>
        <p><strong>Type:</strong> ${tournament.tournament_type}</p>
        <p><strong>Max Players:</strong> ${tournament.max_players}</p>
        <p><strong>Registration Amount:</strong> KES ${tournament.registration_amount}</p>

        <div style="background-color:#f0f0f0;padding:15px;border-radius:8px;margin:20px 0">
          <h3 style="margin-top:0;">Your Registration is now running</h3>
          <p><strong>Important Information:</strong></p>
          <ul>
            <li>Download our efootball app from our website to manage players conviniently</li>
            <li>You have been granted admin privileges in this tournament</li>
            <li>Once your registration is full create a tournament and import the registered players</li>
            <li>You can now generate fixtures and match schedules</li>
            <li>Invite players to join your tournament</li>
          </ul>
          
          <p style="margin-bottom:0;">
            <strong>Share this link with players:</strong><br/>
            https://efootballkenyaleague.website/registration/${tournament.id}
          </p>
        </div>

        <hr style="margin:20px 0" />
        <p>Skyla<sup>TM</sup><br/>Smart Gaming Ecosystem</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: "EFootball Kenya League <noreply@efootballkenyaleague.website>",
      to: [creatorEmail],
      subject: `Tournament Live: ${tournament.name} - Admin Access Granted`,
      html,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to tournament creator: ${creatorEmail}`,
        result,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: err.message,
        details: err 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});