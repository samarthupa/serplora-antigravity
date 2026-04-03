// functions/api/sync-history.ts

export async function onRequestPost({ request, env }) {
  try {
    // 1. Get the user's email securely from the cookie we set during login
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/user_session=([^;]+)/);
    if (!match) return new Response("Unauthorized", { status: 401 });
    
    const email = match[1];
    const { url, title } = await request.json();

    // 2. Fetch their current history from the database
    const user = await env.DB.prepare('SELECT recent_pages FROM users WHERE email = ?').bind(email).first();
    if (!user) return new Response("User not found", { status: 404 });

    let history = JSON.parse(user.recent_pages || '[]');

    // 3. Update the history array (move current page to top, keep only last 10)
    history = history.filter(p => p.url !== url);
    history.unshift({ url, title });
    if (history.length > 10) history = history.slice(0, 10);

    // 4. Save the new history back to D1
    await env.DB.prepare('UPDATE users SET recent_pages = ? WHERE email = ?')
      .bind(JSON.stringify(history), email).run();

    return new Response(JSON.stringify({ success: true, history }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}