// functions/api/sync-history.ts
import { createErrorResponse } from './utils/apiHelper';
import type { Env, SyncHistoryRequest, HistoryItem, UserRecord } from './utils/types';

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // 1. Get the user's email securely from the cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(/user_session=([^;]+)/);
    if (!match) return createErrorResponse("Unauthorized", 401);
    
    const email = match[1];
    const body = (await request.json()) as SyncHistoryRequest;

    if (!body.url || !body.title) return createErrorResponse("Missing url or title", 400);

    // 2. Fetch their current history from the database
    const user = await env.DB.prepare('SELECT recent_pages FROM users WHERE email = ?')
      .bind(email)
      .first<UserRecord>();
      
    if (!user) return createErrorResponse("User not found", 404);

    let history: HistoryItem[] = JSON.parse((user.recent_pages as string) || '[]');

    // 3. Update the history array (move current page to top, keep only last 10)
    history = history.filter(p => p.url !== body.url);
    history.unshift({ url: body.url, title: body.title });
    if (history.length > 10) history = history.slice(0, 10);

    // 4. Save the new history back to D1
    await env.DB.prepare('UPDATE users SET recent_pages = ? WHERE email = ?')
      .bind(JSON.stringify(history), email).run();

    return new Response(JSON.stringify({ success: true, history }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return createErrorResponse("Server Error", 500);
  }
}