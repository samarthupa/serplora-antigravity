export async function onRequest(context) {
  // Cloudflare automatically injects the visitor's country code into the cf object
  const countryCode = context.request.cf?.country || 'US';
  
  return new Response(JSON.stringify({ country: countryCode }), {
    headers: { 'Content-Type': 'application/json' }
  });
}