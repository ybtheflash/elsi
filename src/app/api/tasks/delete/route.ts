import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Client, Storage } from 'node-appwrite';

// Initialize Firebase Admin
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

// Initialize Appwrite Client (Server-side)
const appwriteClient = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!); // IMPORTANT: You need to create a server API key in Appwrite

const appwriteStorage = new Storage(appwriteClient);
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export async function POST(request: Request) {
    try {
        const { taskId } = await request.json();
        const authToken = request.headers.get('Authorization')?.split('Bearer ')[1];

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await getAuth().verifyIdToken(authToken);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userRole = userDoc.data()?.role;

        // SECURITY CHECK: Only admins can delete tasks
        if (!['admin', 'super-admin'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const taskDocRef = db.collection('tasks').doc(taskId);
        const taskDoc = await taskDocRef.get();

        if (!taskDoc.exists) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const taskData = taskDoc.data()!;

        // 1. Delete associated attachments from Appwrite
        if (taskData.attachments && taskData.attachments.length > 0) {
            for (const attachment of taskData.attachments) {
                try {
                    await appwriteStorage.deleteFile(BUCKET_ID, attachment.fileId);
                } catch (appwriteError) {
                    // Log error but continue, so the Firestore doc is still deleted
                    console.warn(`Failed to delete Appwrite file ${attachment.fileId}:`, appwriteError);
                }
            }
        }

        // 2. Delete the task document from Firestore
        await taskDocRef.delete();

        return NextResponse.json({ message: 'Task and associated files deleted successfully.' }, { status: 200 });
    } catch (error: any) {
        console.warn("Delete Task Error:", error);
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}