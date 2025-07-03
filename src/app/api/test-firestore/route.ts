import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin-edge';

export async function GET() {
    try {
        // Debug: Fetch service account info from Edge Config
        const db = await getFirestore();
        // Try to fetch a document
        const test = await db.collection('submissions').limit(1).get();
        return NextResponse.json({ ok: true, count: test.size });
    } catch (e: any) {
        // Debug: Return error and stack trace
        return NextResponse.json({ error: String(e), stack: e?.stack });
    }
}
