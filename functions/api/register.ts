// functions/api/register.ts
import { createErrorResponse, verifyGoogleToken } from './utils/apiHelper';
import type { Env, RegisterRequest } from './utils/types';

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = (await request.json()) as RegisterRequest;

    if (!body.country) return createErrorResponse("Country is required", 400);

    const googleData = await verifyGoogleToken(body.token);
    if (!googleData) return createErrorResponse("Invalid or Missing Token", 401);

    // Insert new user into D1
    await env.DB.prepare(`
      INSERT INTO users (email, name, country) VALUES (?, ?, ?)
    `).bind(googleData.email, googleData.name, body.country).run();

    return new Response(JSON.stringify({ 
      success: true, 
      user: { name: googleData.name, email: googleData.email, country: body.country } 
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `user_session=${googleData.email}; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    });
  } catch (error) {
    return createErrorResponse("Server Error", 500);
  }
}