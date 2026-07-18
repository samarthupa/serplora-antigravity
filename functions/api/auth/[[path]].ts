import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/d1";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export async function onRequest(context) {
    const url = new URL(context.request.url);
    
    // 1. Give Better Auth access to your D1 Database
    const db = drizzle(context.env.DB); 

    // 2. Initialize the unified system
    const auth = betterAuth({
        baseURL: url.origin, // Dynamically uses your live or staging domain
        database: drizzleAdapter(db, { provider: "sqlite" }),
        socialProviders: {
            github: {
                clientId: context.env.GITHUB_CLIENT_ID,
                clientSecret: context.env.GITHUB_CLIENT_SECRET,
            },
            google: {
                clientId: context.env.GOOGLE_CLIENT_ID, 
                clientSecret: context.env.GOOGLE_CLIENT_SECRET,
            }
        },
    });

    // 3. Better Auth magically handles the rest!
    return auth.handler(context.request);
}