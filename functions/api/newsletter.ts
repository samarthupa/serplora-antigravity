// functions/api/newsletter.ts
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
    session: { id: string; token: string; userId: string; expiresAt: Date | string; };
    user: { id: string; email: string; name: string; };
}

// Direct DB Session Validator
async function getSecureSession(request: Request, db: Kysely<Database>) {
    try {
        const cookieHeader = request.headers.get('Cookie') || '';
        const match = cookieHeader.match(/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/);
        const token = match ? match[1] : null;

        if (!token) return null;

        const session = await db.selectFrom('session')
            .selectAll()
            .where('token', '=', token)
            .executeTakeFirst();

        if (!session || new Date(session.expiresAt) < new Date()) return null;

        const user = await db.selectFrom('user')
            .selectAll()
            .where('id', '=', session.userId)
            .executeTakeFirst();

        return user ? { user } : null;
    } catch (error) {
        console.error("Direct session verification failed:", error);
        return null;
    }
}

// ==========================================
// [GET] Check if the user is subscribed
// ==========================================
export async function onRequestGet(context: any) {
    const db = new Kysely<Database>({ dialect: new D1Dialect({ database: context.env.DB }) });
    const sessionData = await getSecureSession(context.request, db);
    
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
    const sessionData = await getSecureSession(context.request, db);
    
    if (!sessionData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401, headers: { "Content-Type": "application/json" } 
        });
    }

    const referer = context.request.headers.get('referer') || '/';
    const user = sessionData.user;

    try {
        const existing = await db.selectFrom('newsletter_subscribers')
            .select('id')
            .where('user_id', '=', user.id)
            .executeTakeFirst();

        if (existing) {
            return new Response(JSON.stringify({ success: true, message: 'Already subscribed' }), { 
                status: 200, headers: { "Content-Type": "application/json" } 
            });
        }

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
    const sessionData = await getSecureSession(context.request, db);
    
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