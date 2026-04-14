// functions/api/login.ts
import { createErrorResponse, verifyGoogleToken } from './utils/apiHelper';
import type { Env, LoginRequest, UserRecord } from './utils/types';

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = (await request.json()) as LoginRequest;

    const googleData = await verifyGoogleToken(body.token);
    if (!googleData) return createErrorResponse("Invalid or Missing Token", 401);

    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(googleData.email)
      .first<UserRecord>();

    if (existingUser) {
      // Parse database history
      const history = JSON.parse((existingUser.recent_pages as string) || '[]');
      existingUser.recent_pages = history;

      return new Response(JSON.stringify({ success: true, user: existingUser }), { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `user_session=${existingUser.email}; Path=/; HttpOnly; Secure; SameSite=Lax`
        }
      });
    } else {
      return new Response(JSON.stringify({ isNew: true }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    return createErrorResponse("Server Error", 500);
  }
}