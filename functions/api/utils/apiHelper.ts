// functions/api/utils/apiHelper.ts
import type { GoogleAuthData } from './types';

// 1. Standardized Error Handling
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 2. Centralized Google Authentication Logic
export async function verifyGoogleToken(token: string): Promise<GoogleAuthData | null> {
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!googleRes.ok) return null;
    
    const googleData: GoogleAuthData = await googleRes.json();
    if (!googleData.email) return null;
    
    return googleData;
  } catch (error) {
    return null;
  }
}