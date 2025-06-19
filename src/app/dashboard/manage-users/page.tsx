'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

type UserProfile = {
    uid: string;
    displayName: string;
    email: string;
    role: 'intern' | 'admin' | 'super-admin';
    domain?: string[];
    studentClass?: string;
};

export default function ManageUsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Protect this route for super-admin only
    useEffect(() => {
        if (user && user.role !== 'super-admin') {
            toast.error("You don't have permission to access this page.");
            router.push('/dashboard');
        }
    }, [user, router]);
      useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const userList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                setUsers(userList);
            } catch (error) {
                console.warn('Failed to fetch users:', error);
                toast.error('Failed to load users. Please refresh the page.');
                setUsers([]); // Set empty array as fallback
            } finally {
                setLoading(false);
            }
        };
        if (user?.role === 'super-admin') {
            fetchUsers();
        }
    }, [user]);    const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { role: newRole });
            setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            toast.success("User role updated successfully.");
        } catch (error: any) {
            let errorMessage = "Failed to update role.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to update user roles.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please check your connection and try again.";
            }
            
            toast.error(errorMessage);
        }
    };    if (loading || user?.role !== 'super-admin') {
        return (
            <div className="min-h-screen flex flex-col">
                <Header title="Manage Users" />
                <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
                    <div className="w-full max-w-md mx-auto text-center">
                        <div className="glass-card">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Users</h3>
                            <p className="text-gray-600">Fetching user data, please wait...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
      return (
        <div className="min-h-screen flex flex-col">
            <Toaster 
                richColors 
                position="top-center" 
                toastOptions={{ 
                    style: { 
                        zIndex: 99999,
                        marginTop: '100px'
                    } 
                }} 
            />
            <Header title="Manage Users" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">User Administration</h2>
                <p className="text-white/80 text-lg">Manage roles and permissions for all users.</p>
            </div>
            <main className="flex-grow p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200/80">
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Role</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Domain(s)</th>
                                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Class</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.uid} className="hover:bg-gray-500/10 transition-colors duration-200">
                                            <td className="px-6 py-5 text-gray-800 font-medium whitespace-nowrap">{u.displayName}</td>
                                            <td className="px-6 py-5 text-gray-600 whitespace-nowrap">{u.email}</td>
                                            <td className="px-6 py-5">
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.uid, e.target.value as UserProfile['role'])}
                                                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all appearance-none"
                                                >
                                                    <option value="intern" style={{padding: '10px'}}>Intern</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="super-admin" style={{padding: '10px'}}>Super Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-5 text-gray-600">{u.domain?.join(', ') || 'N/A'}</td>
                                            <td className="px-6 py-5 text-center text-gray-600">{u.studentClass || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}