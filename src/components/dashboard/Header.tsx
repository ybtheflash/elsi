'use client';

import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth'; // Import the signOut function
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Send, ListChecks, HeartPulse, Users } from 'lucide-react';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();    // --- THIS FUNCTION WAS MISSING ---
    // This function calls Firebase to sign the user out and then redirects to the login page.
    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            // Show user-friendly error message instead of logging to console
            // Most logout errors are not critical and user will be redirected anyway
            router.push('/login'); // Fallback redirect
        }
    };

    const navLinkClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors";
    const activeLinkClasses = "bg-gray-200 text-gray-900";
    const inactiveLinkClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

    return (
        <header className="bg-white shadow-sm p-4 sticky top-0 z-40">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 hidden sm:block">
                        Welcome, <span className="font-semibold">{user?.displayName}</span> ({user?.role})
                    </span>
                    {/* --- THE onClick EVENT WAS MISSING HERE --- */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>

            <nav className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                 {/* Navigation links remain the same */}
                 {user?.role === 'intern' && (
                    <>
                        <Link href="/dashboard" className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}>
                            <Send size={16} /> Submit Task
                        </Link>
                        <Link href="/dashboard/my-submissions" className={`${navLinkClasses} ${pathname === '/dashboard/my-submissions' ? activeLinkClasses : inactiveLinkClasses}`}>
                            <ListChecks size={16} /> My Submissions
                        </Link>
                    </>
                )}

                {(user?.role === 'admin' || user?.role === 'super-admin') && (
                    <>
                         <Link href="/dashboard" className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}>
                            <LayoutDashboard size={16} /> Review
                        </Link>
                        <Link href="/dashboard/health" className={`${navLinkClasses} ${pathname === '/dashboard/health' ? activeLinkClasses : inactiveLinkClasses}`}>
                           <HeartPulse size={16} /> Health
                        </Link>
                    </>
                )}

                {user?.role === 'super-admin' && (
                    <Link href="/dashboard/manage-users" className={`${navLinkClasses} ${pathname === '/dashboard/manage-users' ? activeLinkClasses : inactiveLinkClasses}`}>
                        <Users size={16} /> Manage Users
                    </Link>
                )}
            </nav>
        </header>
    );
}