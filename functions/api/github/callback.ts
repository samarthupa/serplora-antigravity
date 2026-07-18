export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return Response.redirect('/login?error=github_auth_failed', 302);
  }

  // 1. Exchange the code for an Access Token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 
      'Accept': 'application/json', 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      client_id: context.env.GITHUB_CLIENT_ID,
      client_secret: context.env.GITHUB_CLIENT_SECRET, 
      code: code
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  // 2. Fetch the user's GitHub profile data
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { 
      'Authorization': `Bearer ${tokenData.access_token}`, 
      'User-Agent': 'Serplora-Academy' 
    }
  });
  const githubUser = await userResponse.json();

  // 3. Return an HTML script that sets your cookie and localStorage
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Authenticating...</title></head>
      <body>
        <script>
          document.cookie = "auth_token=true; path=/; max-age=604800; Secure; SameSite=Lax";
          
          const userData = {
            name: "${githubUser.name || githubUser.login}",
            email: "${githubUser.email || 'Hidden'}",
            country: "Unknown"
          };
          localStorage.setItem('serplora_user', JSON.stringify(userData));
          
          window.location.href = '/';
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}