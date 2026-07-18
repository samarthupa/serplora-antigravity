export async function onRequest(context) {
  // Cloudflare injects environment variables via context.env
  const clientId = context.env.GITHUB_CLIENT_ID; 
  
  const currentUrl = new URL(context.request.url);
  const redirectUri = `${currentUrl.origin}/api/github/callback`; 
  
  // 👇 Notice the new &prompt=select_account at the very end of this string
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email&prompt=select_account`;
  
  return Response.redirect(githubAuthUrl, 302);
}