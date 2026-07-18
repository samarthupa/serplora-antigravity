export async function onRequest(context) {
  // Cloudflare injects environment variables via context.env
  const clientId = context.env.GITHUB_CLIENT_ID; 
  
  const currentUrl = new URL(context.request.url);
  const redirectUri = `${currentUrl.origin}/api/github/callback`; 
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email`;
  
  return Response.redirect(githubAuthUrl, 302);
}