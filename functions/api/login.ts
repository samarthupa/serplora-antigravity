// functions/api/login.ts
export async function onRequestPost({ request, env }) {
  try {
    const { token } = await request.json();

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await googleRes.json();

    if (!googleData.email) return new Response("Invalid Token", { status: 400 });

    // Check if user already exists in D1
    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(googleData.email).first();

    if (existingUser) {
      // User exists! Log them in instantly.
      return new Response(JSON.stringify({ success: true, user: existingUser }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `user_session=${existingUser.email}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      // New user! Tell the frontend to ask for their country.
      return new Response(JSON.stringify({ isNew: true }), { status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}