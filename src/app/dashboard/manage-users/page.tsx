'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const userList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            setUsers(userList);
            setLoading(false);
        };
        if (user?.role === 'super-admin') {
            fetchUsers();
        }
    }, [user]);

    const handleRoleChange = async (uid: string, newRole: UserProfile['role']) => {
        const userRef = doc(db, 'users', uid);
        try {
            await updateDoc(userRef, { role: newRole });
            setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
            toast.success("User role updated successfully.");
        } catch (error) {
            toast.error("Failed to update role.");
        }
    };

    if (loading || user?.role !== 'super-admin') {
        return (
            <>
                <Header title="Manage Users" />
                <div className="mt-6 text-center">Loading or unauthorized...</div>
            </>
        );
    }
    
    return (
        <>
            <Header title="Manage Users" />
            <div className="mt-6 bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">User Administration</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Email</th>
                                <th className="px-4 py-2 text-left">Role</th>
                                <th className="px-4 py-2 text-left">Domain(s)</th>
                                <th className="px-4 py-2 text-center">Class</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map(u => (
                                <tr key={u.uid}>
                                    <td className="px-4 py-2">{u.displayName}</td>
                                    <td className="px-4 py-2">{u.email}</td>
                                    <td className="px-4 py-2">
                                        <select 
                                            value={u.role} 
                                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserProfile['role'])}
                                            className="p-1 border rounded-md"
                                        >
                                            <option value="intern">Intern</option>
                                            <option value="admin">Admin</option>
                                            <option value="super-admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">{u.domain?.join(', ') || 'N/A'}</td>
                                    <td className="px-4 py-2 text-center">{u.studentClass || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}