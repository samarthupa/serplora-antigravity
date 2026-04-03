// functions/api/login.ts

export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json();

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) return new Response("Invalid Token", { status: 400 });

    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(googleData.email).first();

    if (existingUser) {
      // 🟢 NEW: Parse their database history and attach it to the user object
      const history = JSON.parse(existingUser.recent_pages || '[]');
      existingUser.recent_pages = history;

      return new Response(JSON.stringify({ success: true, user: existingUser }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `user_session=${existingUser.email}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      return new Response(JSON.stringify({ isNew: true }), { status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}