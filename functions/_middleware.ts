// This middleware runs on Cloudflare Pages before serving assets

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Lists of paths to handle
  const gonePaths = ['/old-gone-page', '/deleted-article']; // Example paths for 410
  const unavailablePaths = ['/maintenance', '/service-down']; // Example paths for 503

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
    headers.set('Retry-After', '3600'); // Tell clients to retry after 1 hour (3600 seconds)

    return new Response(response.body, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: headers
    });
  }

  // For all other requests, continue to the next middleware or asset fetch
  return next();
};
