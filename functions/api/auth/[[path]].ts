import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function onRequest(context) {
    try {
        const url = new URL(context.request.url);
        
        const db = new Kysely({
            dialect: new D1Dialect({ database: context.env.DB })
        });

        // Initialize the AWS SES Client using your Cloudflare environment variables
        const ses = new SESClient({
            region: context.env.AWS_REGION,
            credentials: {
                accessKeyId: context.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: context.env.AWS_SECRET_ACCESS_KEY,
            },
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
            plugins: [
                magicLink({
                    sendMagicLink: async ({ email, token, url }) => {
                        const command = new SendEmailCommand({
                            Destination: {
                                ToAddresses: [email],
                            },
                            Message: {
                                Body: {
                                    Html: {
                                        Charset: "UTF-8",
                                        Data: `
                                            <div style="font-family: sans-serif; padding: 20px;">
                                                <h2>Sign in to Serplora</h2>
                                                <p>Click the button below to securely sign in to your account. This link expires in 15 minutes.</p>
                                                <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
                                                    Sign In
                                                </a>
                                                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                                            </div>
                                        `,
                                    },
                                    Text: {
                                        Charset: "UTF-8",
                                        Data: `Sign in to Serplora by clicking this link: ${url}`,
                                    },
                                },
                                Subject: {
                                    Charset: "UTF-8",
                                    Data: "Sign in to Serplora",
                                },
                            },
                            Source: context.env.EMAIL_FROM, 
                        });

                        try {
                            await ses.send(command);
                        } catch (sesError) {
                            console.error("SES Email Failed:", sesError);
                            throw new Error("Failed to send login email.");
                        }
                    },
                }),
            ],
            socialProviders: {
                github: {
                    clientId: context.env.GITHUB_CLIENT_ID || "",
                    clientSecret: context.env.GITHUB_CLIENT_SECRET || "",
                    mapProfileToUser: (profile) => ({
                        emailVerified: true
                    })
                },
                google: {
                    clientId: context.env.GOOGLE_CLIENT_ID || "", 
                    clientSecret: context.env.GOOGLE_CLIENT_SECRET || "",
                    mapProfileToUser: (profile) => ({
                        emailVerified: true
                    })
                },
                microsoft: {
                    clientId: context.env.MICROSOFT_CLIENT_ID || "",
                    clientSecret: context.env.MICROSOFT_CLIENT_SECRET || "",
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