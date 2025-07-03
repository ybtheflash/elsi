import { get } from '@vercel/edge-config';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export async function getFirebaseAdmin() {
    if (firebaseApp) return firebaseApp;
    if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0] as admin.app.App;
        return firebaseApp;
    }

    // Fetch the service account JSON from Edge Config
    const serviceAccount = await get('firebaseServiceAccount');
    if (!serviceAccount || typeof serviceAccount !== 'object') throw new Error('Missing or invalid service account in Edge Config');

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    return firebaseApp;
}

export async function getFirestore() {
    const app = await getFirebaseAdmin();
    return admin.firestore(app);
}

export async function getAuth() {
    const app = await getFirebaseAdmin();
    return admin.auth(app);
}
