import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

export async function onRequest(context) {
    try {
        const url = new URL(context.request.url);
        
        const db = new Kysely({
            dialect: new D1Dialect({ database: context.env.DB })
        });

        const auth = betterAuth({
            baseURL: url.origin,
            database: {
                db: db,
                type: "sqlite"
            },
            // 🟢 NEW: Tell Better Auth about your custom columns
            user: {
                additionalFields: {
                    country: { type: "string", required: false },
                    phone: { type: "string", required: false },
                    whatsapp: { type: "string", required: false }
                }
            },
            socialProviders: {
                github: {
                    clientId: context.env.GITHUB_CLIENT_ID || "",
                    clientSecret: context.env.GITHUB_CLIENT_SECRET || "",
                },
                google: {
                    clientId: context.env.GOOGLE_CLIENT_ID || "", 
                    clientSecret: context.env.GOOGLE_CLIENT_SECRET || "",
                },
                microsoft: {
                    clientId: context.env.MICROSOFT_CLIENT_ID || "",
                    clientSecret: context.env.MICROSOFT_CLIENT_SECRET || "",
                }
            },
        });

        return auth.handler(context.request);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}