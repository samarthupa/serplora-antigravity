// This middleware runs on Cloudflare Pages before serving assets

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Lists of paths to handle
  const gonePaths = ['/tools/wysiwyg-editor/', '/deleted-article']; // Example paths for 410
  const unavailablePaths = ['/compilers/c-compiler/', '/compilers/cpp-compiler/', '/compilers/csharp-compiler/', '/tools/' ]; // Example paths for 503

  // Handle 410 Gone
  if (gonePaths.includes(url.pathname)) {
    // Fetch the statically built 410.html page from Cloudflare Assets
    const response = await env.ASSETS.fetch(new Request(new URL('/410.html', request.url)));

    // Create a new response with the 410 status code, keeping the original body and headers
    return new Response(response.body, {
      status: 410,
      statusText: 'Gone',
      headers: response.headers
    });
  }

  // Handle 503 Service Unavailable
  if (unavailablePaths.includes(url.pathname)) {
    // Fetch the statically built 503.html page from Cloudflare Assets
    const response = await env.ASSETS.fetch(new Request(new URL('/503.html', request.url)));

    // Create a new response with the 503 status code and Retry-After header
    const headers = new Headers(response.headers);
    headers.set('Retry-After', '1296000'); // Tell clients to retry after 1 hour (1296000 seconds)

    return new Response(response.body, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: headers
    });
  }

  // For all other requests, continue to the next middleware or asset fetch
  return next();
};
