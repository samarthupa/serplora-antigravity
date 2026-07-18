import type { APIRoute } from 'astro';

export const prerender = false; 

export const GET: APIRoute = async ({ request }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID; 
  
  // 1. Parse the incoming request URL to get the current domain dynamically
  const currentUrl = new URL(request.url);
  
  // 2. Build the redirect URI using the current origin (e.g., https://serplora.com OR https://serplora-antigravity.pages.dev)
  const redirectUri = `${currentUrl.origin}/api/github/callback`; 
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email`;
  
  return Response.redirect(githubAuthUrl, 302);
};