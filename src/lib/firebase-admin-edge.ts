import { get } from '@vercel/edge-config';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export async function getFirebaseAdmin() {
    if (firebaseApp) return firebaseApp;
    if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0] as admin.app.App;
        return firebaseApp;
    }

    // Fetch each field from Edge Config as individual keys
    const [type, project_id, private_key_id, private_key, client_email, client_id, auth_uri, token_uri, auth_provider_x509_cert_url, client_x509_cert_url, universe_domain] = await Promise.all([
        get('type'),
        get('project_id'),
        get('private_key_id'),
        get('private_key'),
        get('client_email'),
        get('client_id'),
        get('auth_uri'),
        get('token_uri'),
        get('auth_provider_x509_cert_url'),
        get('client_x509_cert_url'),
        get('universe_domain'),
    ]);

    const serviceAccount = {
        type,
        project_id,
        private_key_id,
        private_key,
        client_email,
        client_id,
        auth_uri,
        token_uri,
        auth_provider_x509_cert_url,
        client_x509_cert_url,
        universe_domain,
    };

    if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        throw new Error('Missing required service account fields from Edge Config');
    }

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
