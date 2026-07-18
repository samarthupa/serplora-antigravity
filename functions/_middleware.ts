export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 1. Edge Authentication Guard
  if (url.pathname.startsWith("/account")) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const isLoggedIn = cookieHeader.includes("auth_token=true"); 

    if (!isLoggedIn) {
      // Bounce unauthenticated users to your signin page
      return Response.redirect(`${url.origin}/login`, 307);
    }
  }

  // 2. Existing 410 / 503 Logic
  const gonePaths = ['/tools/wysiwyg-editor/', '/deleted-article'];
  const unavailablePaths = ['/compilers/c-compiler/', '/compilers/cpp-compiler/', '/compilers/csharp-compiler/', '/tools/' ];

  if (gonePaths.includes(url.pathname)) {
    const response = await env.ASSETS.fetch(new Request(new URL('/410.html', request.url)));
    return new Response(response.body, { status: 410, statusText: 'Gone', headers: response.headers });
  }

  if (unavailablePaths.includes(url.pathname)) {
    const response = await env.ASSETS.fetch(new Request(new URL('/503.html', request.url)));
    const headers = new Headers(response.headers);
    headers.set('Retry-After', '1296000');
    return new Response(response.body, { status: 503, statusText: 'Service Unavailable', headers: headers });
  }

  return next();
};