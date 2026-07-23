// functions/api/newsletter.ts
import { betterAuth } from "better-auth";
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

interface Database {
    newsletter_subscribers: {
        id: string;
        user_id: string;
        email: string;
        name: string | null;
        subscribed_url: string;
    };
    // We no longer need to manually define user/session tables here
    // because Better Auth handles them automatically!
}

// 1. Use Better Auth's Native API to validate the signed cookie securely
async function getSecureSession(context: any, db: Kysely<Database>) {
    try {
        const url = new URL(context.request.url);
        
        // Initialize a lightweight Better Auth instance just for session validation
        const auth = betterAuth({
            baseURL: url.origin,
            secret: context.env.BETTER_AUTH_SECRET || "fallback-dev-secret-key-12345",
            database: {
                db: db,
                type: "sqlite"
            }
        });

        // This built-in method automatically unsigns the cookie, 
        // hashes the token (if needed), and verifies it against the D1 database.
        const sessionData = await auth.api.getSession({
            headers: context.request.headers
        });

        return sessionData;
    } catch (error) {
        console.error("Better Auth session verification failed:", error);
        return null;
    }
}

// ==========================================
// [GET] Check if the user is subscribed
// ==========================================
export async function onRequestGet(context: any) {
    const db = new Kysely<Database>({ dialect: new D1Dialect({ database: context.env.DB }) });
    
    const sessionData = await getSecureSession(context, db);
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ isSubscribed: false, error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        const subscriber = await db.selectFrom('newsletter_subscribers')
            .select('id')
            .where('user_id', '=', sessionData.user.id)
            .executeTakeFirst();

        return new Response(JSON.stringify({ isSubscribed: !!subscriber }), { 
            status: 200, headers: { "Content-Type": "application/json" } 
        });
    } catch (error: any) {
        console.error('Newsletter GET Error:', error);
        return new Response(JSON.stringify({ isSubscribed: false, error: 'Database error' }), { 
            status: 500, headers: { "Content-Type": "application/json" } 
        });
    }
}

// ==========================================
// [POST] Subscribe the user
// ==========================================
export async function onRequestPost(context: any) {
    const db = new Kysely<Database>({ dialect: new D1Dialect({ database: context.env.DB }) });
    
    const sessionData = await getSecureSession(context, db);
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    const referer = context.request.headers.get('referer') || '/';
    const user = sessionData.user;

    try {
        // Prevent duplicate subscriptions
        const existing = await db.selectFrom('newsletter_subscribers')
            .select('id')
            .where('user_id', '=', user.id)
            .executeTakeFirst();

        if (existing) {
            return new Response(JSON.stringify({ success: true, message: 'Already subscribed' }), { 
                status: 200, headers: { "Content-Type": "application/json" } 
            });
        }

        // Generate ID and insert into database
        await db.insertInto('newsletter_subscribers')
            .values({
                id: crypto.randomUUID(),
                user_id: user.id,
                email: user.email,
                name: user.name || null,
                subscribed_url: referer,
            })
            .execute();

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, headers: { "Content-Type": "application/json" } 
        });
    } catch (error: any) {
        console.error('Newsletter POST Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to subscribe' }), { 
            status: 500, headers: { "Content-Type": "application/json" } 
        });
    }
}

// ==========================================
// [DELETE] Unsubscribe the user
// ==========================================
export async function onRequestDelete(context: any) {
    const db = new Kysely<Database>({ dialect: new D1Dialect({ database: context.env.DB }) });
    
    const sessionData = await getSecureSession(context, db);
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    try {
        await db.deleteFrom('newsletter_subscribers')
            .where('user_id', '=', sessionData.user.id)
            .execute();

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, headers: { "Content-Type": "application/json" } 
        });
    } catch (error: any) {
        console.error('Newsletter DELETE Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to unsubscribe' }), { 
            status: 500, headers: { "Content-Type": "application/json" } 
        });
    }
}