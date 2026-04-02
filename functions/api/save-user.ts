// functions/api/save-user.ts

export async function onRequestPost({ request, env }) {
  try {
    const { token, country } = await request.json();

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) {
      return new Response("Invalid Token", { status: 400 });
    }

    const { email, name } = googleData;

    await env.DB.prepare(`
      INSERT INTO users (email, name, country) 
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET country = excluded.country
    `).bind(email, name, country).run();

    // 🟢 NEW: We are now sending the user object back to the frontend
    return new Response(JSON.stringify({ 
      success: true, 
      user: { name, email, country } 
    }), { 
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