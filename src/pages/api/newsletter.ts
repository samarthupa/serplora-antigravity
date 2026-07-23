import type { APIRoute } from 'astro';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';

// 1. Define the DB Types for Kysely Type Safety
interface Database {
    newsletter_subscribers: {
        id: string;
        user_id: string;
        email: string;
        name: string | null;
        subscribed_url: string;
    };
}

// 2. Helper Function to Securely Validate Session via Better Auth
async function getSession(request: Request) {
    try {
        const cookieHeader = request.headers.get('Cookie') || '';
        const sessionReq = await fetch(new URL('/api/auth/get-session', request.url).toString(), {
            headers: { 'Cookie': cookieHeader }
        });
        
        if (!sessionReq.ok) return null;
        
        const data = await sessionReq.json() as any;
        return data?.user ? data : null;
    } catch (error) {
        console.error("Session verification failed:", error);
        return null;
    }
}

// ==========================================
// [GET] Check if the user is subscribed
// ==========================================
export const GET: APIRoute = async ({ request, locals }) => {
    const sessionData = await getSession(request);
    
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ isSubscribed: false, error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    const env = (locals as any).runtime.env;
    const db = new Kysely<Database>({
        dialect: new D1Dialect({ database: env.DB })
    });

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
};

// ==========================================
// [POST] Subscribe the user
// ==========================================
export const POST: APIRoute = async ({ request, locals }) => {
    const sessionData = await getSession(request);
    
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    const env = (locals as any).runtime.env;
    const db = new Kysely<Database>({
        dialect: new D1Dialect({ database: env.DB })
    });

    // Capture the exact page they subscribed from using the HTTP Referer header
    const referer = request.headers.get('referer') || '/';
    const user = sessionData.user;

    try {
        // Double-check they aren't already subscribed to avoid SQLite unique constraint crashes
        const existing = await db.selectFrom('newsletter_subscribers')
            .select('id')
            .where('user_id', '=', user.id)
            .executeTakeFirst();

        if (existing) {
            return new Response(JSON.stringify({ success: true, message: 'Already subscribed' }), { 
                status: 200, headers: { "Content-Type": "application/json" } 
            });
        }

        // Insert new subscriber utilizing native Cloudflare Crypto API for UUID
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
};

// ==========================================
// [DELETE] Unsubscribe the user
// ==========================================
export const DELETE: APIRoute = async ({ request, locals }) => {
    const sessionData = await getSession(request);
    
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    const env = (locals as any).runtime.env;
    const db = new Kysely<Database>({
        dialect: new D1Dialect({ database: env.DB })
    });

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
};