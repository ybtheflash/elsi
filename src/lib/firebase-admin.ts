import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin() {
    if (firebaseApp) {
        return firebaseApp;
    }

    if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0] as admin.app.App;
        return firebaseApp;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing required Firebase environment variables');
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey, // Use as-is, no replace
            }),
        });
        return firebaseApp;
    } catch (error) {
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function getFirestore() {
    const app = getFirebaseAdmin();
    return admin.firestore(app);
}

export function getAuth() {
    const app = getFirebaseAdmin();
    return admin.auth(app);
}
