import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getFirestore, getAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        let db;
        try {
            db = getFirestore();
        } catch (initError) {
            return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
        }

        const { submissionId } = await request.json();

        if (!submissionId) {
            return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
        }

        const token = request.headers.get('Authorization')?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(token);
        } catch (authError) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        const subDocRef = db.collection('submissions').doc(submissionId);
        let subDoc;

        try {
            subDoc = await subDocRef.get();
        } catch (firestoreError) {
            return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
        }

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
        try {
            await subDocRef.delete();
        } catch (deleteError) {
            return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
        }

        // Action 2: Log the recall action in a new subcollection on the user
        try {
            const logRef = db.collection('users').doc(userId).collection('activityLogs').doc();
            await logRef.set({
                action: 'recalled_submission',
                details: `Recalled submission titled: "${submission.title || 'Unknown'}"`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (logError) {
            // Don't fail the whole operation if logging fails
            // The submission has already been deleted successfully
        }

        return NextResponse.json({ message: 'Submission successfully recalled.' }, { status: 200 });

    } catch (error: any) {
        // Return generic error without exposing internal details
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}