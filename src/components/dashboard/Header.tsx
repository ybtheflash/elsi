'use client';

import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Send, ListChecks, HeartPulse, Users, ClipboardList, ClipboardCheck, ClipboardEdit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            router.push('/login');
        }
    };    const navLinkClasses = "flex items-center gap-4 px-5 py-3 text-base font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap";
    const activeLinkClasses = "bg-white/90 text-indigo-700 shadow-xl backdrop-blur-sm border border-white/30 rounded-2xl";
    const inactiveLinkClasses = "text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm rounded-2xl";

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'super-admin': return 'bg-gradient-to-r from-purple-500 to-pink-500';
            case 'admin': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
            case 'intern': return 'bg-gradient-to-r from-green-500 to-emerald-500';
            default: return 'bg-gray-500';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'super-admin': return 'Super Admin';
            case 'admin': return 'Admin';
            case 'intern': return 'Intern';
            default: return 'User';
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
            <div className="px-8 py-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <LayoutDashboard className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white">
                                {title}
                            </h1>
                        </div>
                    </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-white/20 shadow-lg">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                    {user?.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-base font-semibold text-white leading-tight">
                                    {user?.displayName || 'User'}
                                </span>
                                <Badge variant="secondary" className={`text-sm px-4 py-2 text-white border-0 ${getRoleColor(user?.role || '')} shadow-md w-fit mt-2`}>
                                    {getRoleLabel(user?.role || '')}
                                </Badge>
                            </div>
                        </div>
                        
                        <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                        
                        <Button
                            onClick={handleLogout}
                            size="lg"
                            className="flex items-center gap-3 bg-red-500/20 border border-red-400/30 text-red-200 hover:bg-red-500/30 hover:border-red-400/50 hover:text-white transition-all duration-300 px-5 py-3 rounded-2xl shadow-md backdrop-blur-sm text-base"
                        >
                            <LogOut size={20} />
                            <span className="hidden sm:inline font-medium">Logout</span>
                        </Button>
                    </div>
                </div>

                <nav className="flex items-center gap-4 overflow-x-auto pb-3 scrollbar-hide">
                    {user?.role === 'intern' && (
                        <>
                            <Link href="/dashboard" className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <Send size={22} />
                                <span>Submit Work</span>
                            </Link>
                            <Link href="/dashboard/my-tasks" className={`${navLinkClasses} ${pathname === '/dashboard/my-tasks' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ClipboardCheck size={22} />
                                <span>My Tasks</span>
                            </Link>
                            <Link href="/dashboard/my-submissions" className={`${navLinkClasses} ${pathname === '/dashboard/my-submissions' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ListChecks size={22} />
                                <span>My Submissions</span>
                            </Link>
                        </>
                    )}

                    {(user?.role === 'admin' || user?.role === 'super-admin') && (
                        <>
                            <Link href="/dashboard" className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <LayoutDashboard size={22} />
                                <span>Review</span>
                            </Link>
                            <Link href="/dashboard/health" className={`${navLinkClasses} ${pathname === '/dashboard/health' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <HeartPulse size={22} />
                                <span>Analytics</span>
                            </Link>
                            <Link href="/dashboard/allot-task" className={`${navLinkClasses} ${pathname === '/dashboard/allot-task' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ClipboardList size={22} />
                                <span>Assign Tasks</span>
                            </Link>
                            <Link href="/dashboard/view-tasks" className={`${navLinkClasses} ${pathname === '/dashboard/view-tasks' ? activeLinkClasses : inactiveLinkClasses}`}>
                                <ClipboardEdit size={22} />
                                <span>Manage Tasks</span>
                            </Link>
                        </>
                    )}

                    {user?.role === 'super-admin' && (
                        <Link href="/dashboard/manage-users" className={`${navLinkClasses} ${pathname === '/dashboard/manage-users' ? activeLinkClasses : inactiveLinkClasses}`}>
                            <Users size={22} />
                            <span>Manage Users</span>
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}