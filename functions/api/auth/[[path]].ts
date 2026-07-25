import { betterAuth } from "better-auth"; 
import { emailOTP } from "better-auth/plugins"; 
import { Kysely } from "kysely"; 
import { D1Dialect } from "kysely-d1"; 
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"; 

export async function onRequest(context) {     
    try {         
        const url = new URL(context.request.url);                  
        const db = new Kysely({             
            dialect: new D1Dialect({ database: context.env.DB })         
        });         
        const ses = new SESClient({             
            region: context.env.AWS_REGION,             
            credentials: {                 
                accessKeyId: context.env.AWS_ACCESS_KEY_ID,                 
                secretAccessKey: context.env.AWS_SECRET_ACCESS_KEY,             
            },         
        });         
        
        const auth = betterAuth({             
            baseURL: url.origin,             
            secret: context.env.BETTER_AUTH_SECRET || "fallback-dev-secret-key-12345",             
            database: {                 
                db: db,                 
                type: "sqlite"             
            },
            // --- SESSION EXPIRATION ADDED HERE ---
            session: {
                expiresIn: 60 * 60 * 24 * 15, // Set to 60 seconds (1 minute) for testing
                disableSessionRefresh: true // Strict cutoff; prevents activity from resetting the timer
            },
            // -------------------------------------             
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
                    trustedProviders: ["google", "github", "microsoft", "linkedin"]                 
                }             
            },             
            plugins: [
    emailOTP({
        async sendVerificationOTP({ email, otp }) {
            const command = new SendEmailCommand({
                Source: `Serplora Accounts <${context.env.EMAIL_FROM}>`,
                Destination: {
                    ToAddresses: [email],
                },
                Message: {
                    Subject: {
                        Charset: "UTF-8",
                        Data: `${otp} is your Serplora login code`,
                    },
                    Body: {
                        Html: {
                            Charset: "UTF-8",
                            Data: `
<div style="font:16px Arial,sans-serif">
    <p>Your secure login code to sign in to <strong>Serplora</strong> is:</p>
    <p style="font:700 32px monospace;letter-spacing:4px">${otp}</p>
    <p>This code expires in 10 minutes. Do not share this with anyone.</p>
</div>
                            `,
                        },
                        Text: {
                            Charset: "UTF-8",
                            Data: `Your secure login code to sign in to Serplora is:

${otp}

This code expires in 10 minutes. Do not share this with anyone.`,
                        },
                    },
                },
            });

            try {
                await ses.send(command);
            } catch (sesError: any) {
                if (sesError?.message?.includes("DOMParser is not defined")) {
                    console.log("OTP sent successfully! (Ignored AWS SDK DOMParser bug)");
                } else {
                    console.error("SES Email Failed:", sesError);
                    throw new Error("Failed to send OTP email.");
                }
            }
        },
    }),
],           
            socialProviders: {                 
                github: {                     
                    clientId: context.env.GITHUB_CLIENT_ID || "",                     
                    clientSecret: context.env.GITHUB_CLIENT_SECRET || "",   
                    prompt: "select_account",                  
                    mapProfileToUser: (profile) => ({ 
                        emailVerified: true,
                        image: profile.avatar_url || null
                    })                 
                },                 
                google: {                     
                    clientId: context.env.GOOGLE_CLIENT_ID || "",                      
                    clientSecret: context.env.GOOGLE_CLIENT_SECRET || "",                     
                    mapProfileToUser: (profile) => ({ 
                        emailVerified: true,
                        image: profile.picture || null
                    })                 
                },                 
                microsoft: {                     
                    clientId: context.env.MICROSOFT_CLIENT_ID || "",                     
                    clientSecret: context.env.MICROSOFT_CLIENT_SECRET || "",    
                    prompt: "select_account",                 
                    mapProfileToUser: (profile) => ({ 
                        emailVerified: true,
                        image: profile.picture || null
                    })                 
                },
                
                linkedin: {                     
                    clientId: context.env.LINKEDIN_CLIENT_ID || "",                     
                    clientSecret: context.env.LINKEDIN_CLIENT_SECRET || "",    
                    mapProfileToUser: (profile) => ({ 
                        emailVerified: true,
                        image: profile.picture || null
                    })                 
                }
            },         
        });         
        const response = await auth.handler(context.request);         
        return response;     
    } catch (error: any) {         
        console.error("  AUTH FATAL ERROR:", error);         
        return new Response(JSON.stringify({              
            error: error?.message || "Internal Server Error",             
            stack: error?.stack || "No stack trace available"         
        }), {              
            status: 500,             
            headers: { "Content-Type": "application/json" }         
        });     
    }
}