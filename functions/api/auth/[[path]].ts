import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export async function onRequest(context) {
    try {
        const url = new URL(context.request.url);
        
        // 1. Connect to D1 without requiring a strict schema
        const db = new Kysely({
            dialect: new D1Dialect({ database: context.env.DB })
        });

        // 2. Initialize Better Auth
        const auth = betterAuth({
            baseURL: url.origin,
            database: {
                db: db,
                type: "sqlite"
            },
            socialProviders: {
                github: {
                    clientId: context.env.GITHUB_CLIENT_ID || "",
                    clientSecret: context.env.GITHUB_CLIENT_SECRET || "",
                },
                google: {
                    clientId: context.env.GOOGLE_CLIENT_ID || "", 
                    clientSecret: context.env.GOOGLE_CLIENT_SECRET || "",
                }
            },
        });

        return auth.handler(context.request);
    } catch (error) {
        // If anything crashes, tell the browser exactly why
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}