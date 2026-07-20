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
            user: {
                additionalFields: {
                    country: { type: "string", required: false },
                    phone: { type: "string", required: false },
                    whatsapp: { type: "string", required: false }
                }
            },
            account: {
                accountLinking: {
                    enabled: true,
                    trustedProviders: ["google", "github", "microsoft"]
                }
            },
            socialProviders: {
                github: {
                    clientId: context.env.GITHUB_CLIENT_ID || "",
                    clientSecret: context.env.GITHUB_CLIENT_SECRET || "",
                    // 🟢 Automates emailVerified = 1 for new GitHub logins
                    mapProfileToUser: (profile) => ({
                        emailVerified: true
                    })
                },
                google: {
                    clientId: context.env.GOOGLE_CLIENT_ID || "", 
                    clientSecret: context.env.GOOGLE_CLIENT_SECRET || "",
                    // 🟢 Automates emailVerified = 1 for new Google logins
                    mapProfileToUser: (profile) => ({
                        emailVerified: true
                    })
                },
                microsoft: {
                    clientId: context.env.MICROSOFT_CLIENT_ID || "",
                    clientSecret: context.env.MICROSOFT_CLIENT_SECRET || "",
                    // 🟢 Automates emailVerified = 1 for new Microsoft logins
                    mapProfileToUser: (profile) => ({
                        emailVerified: true 
                    })
                }
            },
        });

        return auth.handler(context.request);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}