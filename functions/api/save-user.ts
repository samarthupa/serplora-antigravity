// functions/api/save-user.ts

export async function onRequestPost({ request, env }) {
  try {
    const { token, country } = await request.json();

    // 1. Verify the token securely with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) {
      return new Response("Invalid Token", { status: 400 });
    }

    const { email, name } = googleData;

    // 2. Save user to Cloudflare D1 (Using the 'DB' binding we set in the dashboard)
    await env.DB.prepare(`
      INSERT INTO users (email, name, country) 
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET country = excluded.country
    `).bind(email, name, country).run();

    // 3. Set a browser cookie so the frontend knows the user is logged in
    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `user_session=${email}; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}