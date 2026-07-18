export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 1. Edge Authentication Guard
  if (url.pathname.startsWith("/account")) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const isLoggedIn = cookieHeader.includes("auth_token=true"); 

    if (!isLoggedIn) {
      // Bounce unauthenticated users to your signin page
      return Response.redirect(`${url.origin}/signin`, 307);
    }
  }

  // 2. Existing 410 / 503 Logic
  const gonePaths = ['/tools/wysiwyg-editor/', '/deleted-article'];[cite: 1]
  const unavailablePaths = ['/compilers/c-compiler/', '/compilers/cpp-compiler/', '/compilers/csharp-compiler/', '/tools/' ];[cite: 1]

  if (gonePaths.includes(url.pathname)) {
    const response = await env.ASSETS.fetch(new Request(new URL('/410.html', request.url)));[cite: 1]
    return new Response(response.body, { status: 410, statusText: 'Gone', headers: response.headers });[cite: 1]
  }

  if (unavailablePaths.includes(url.pathname)) {
    const response = await env.ASSETS.fetch(new Request(new URL('/503.html', request.url)));[cite: 1]
    const headers = new Headers(response.headers);[cite: 1]
    headers.set('Retry-After', '1296000');[cite: 1]
    return new Response(response.body, { status: 503, statusText: 'Service Unavailable', headers: headers });[cite: 1]
  }

  return next();[cite: 1]
};