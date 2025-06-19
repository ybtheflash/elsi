import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK (if not already done elsewhere)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}
const db = admin.firestore();

export async function POST(request: Request) {
    try {
        const { submissionId } = await request.json();
        const token = request.headers.get('Authorization')?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const subDocRef = db.collection('submissions').doc(submissionId);
        const subDoc = await subDocRef.get();

        if (!subDoc.exists) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        const submission = subDoc.data()!;

        // SECURITY CHECK: Ensure user owns the submission and it's pending
        if (submission.internId !== userId) {
            return NextResponse.json({ error: 'Forbidden: You do not own this submission' }, { status: 403 });
        }
        if (submission.status !== 'pending') {
            return NextResponse.json({ error: 'Forbidden: Cannot recall an already reviewed submission' }, { status: 403 });
        }

        // Action 1: Delete the submission document
        await subDocRef.delete();

        // Action 2: Log the recall action in a new subcollection on the user
        const logRef = db.collection('users').doc(userId).collection('activityLogs').doc();
        await logRef.set({
            action: 'recalled_submission',
            details: `Recalled submission titled: "${submission.title}"`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // We can consider deleting associated Appwrite files here too, but for simplicity, we'll leave them.

        return NextResponse.json({ message: 'Submission successfully recalled.' }, { status: 200 });

    } catch (error: any) {
        console.error("Recall Submission Error:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}