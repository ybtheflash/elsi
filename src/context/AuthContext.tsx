'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface UserProfile extends User {
    role?: 'intern' | 'admin' | 'super-admin';
    domain?: string[];
    studentClass?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const docRef = doc(db, 'users', firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUser({ ...firebaseUser, ...docSnap.data() });
                    } else {
                        // User exists in Auth but not Firestore, handle this case
                        setUser(firebaseUser);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                // If there's an error fetching user data, still set the firebase user
                // This prevents the app from breaking due to network issues
                console.warn('Error fetching user profile:', error);
                if (firebaseUser) {
                    setUser(firebaseUser);
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// This component will protect routes
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {        const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div>Loading...</div>; // Or a nice spinner
    }

    return <>{children}</>;
};