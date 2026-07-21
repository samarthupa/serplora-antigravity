// functions/middleware.ts

// Define the environment variables expected by the middleware
interface Env {
  ASSETS: { fetch: typeof fetch };
  TURNSTILE_SECRET_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // --- 1. EXISTING 410 / 503 LOGIC ---
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

  // --- 2. NEW TURNSTILE VERIFICATION LOGIC ---
  if (request.method === "POST" && url.pathname.includes("/email-otp/send-verification-otp")) {
    const token = request.headers.get("X-Turnstile-Token");
    
    if (!token) {
        return new Response(JSON.stringify({ 
            error: "Security check required",
            message: "Missing Turnstile token"
        }), { 
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    formData.append('remoteip', request.headers.get('CF-Connecting-IP') || '');

    try {
        const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });

        const outcome = await verificationResponse.json() as any;

        if (!outcome.success) {
            console.error("Turnstile verification failed:", outcome['error-codes']);
            return new Response(JSON.stringify({ 
                error: "Security verification failed",
                message: "Invalid Turnstile token"
            }), { 
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }
    } catch (err) {
        console.error("Failed to reach Turnstile API:", err);
        return new Response(JSON.stringify({ 
            error: "Internal Server Error",
            message: "Could not verify security token"
        }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
  }

  // --- 3. PROCEED TO NEXT HANDLER (e.g., Better Auth) ---
  return next();
};