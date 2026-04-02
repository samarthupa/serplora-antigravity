// functions/api/register.ts
export async function onRequestPost({ request, env }) {
  try {
    const { token, country } = await request.json();

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) return new Response("Invalid Token", { status: 400 });

    // Insert new user into D1
    await env.DB.prepare(`
      INSERT INTO users (email, name, country) VALUES (?, ?, ?)
    `).bind(googleData.email, googleData.name, country).run();

    return new Response(JSON.stringify({ 
      success: true, 
      user: { name: googleData.name, email: googleData.email, country } 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `user_session=${googleData.email}; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}