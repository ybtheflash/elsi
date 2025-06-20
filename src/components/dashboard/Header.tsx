'use client';

import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, Send, ListChecks, HeartPulse, Users, ClipboardList, ClipboardCheck, ClipboardEdit, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const { user } = useAuth();
    const { setLoading } = useLoading();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);    // Handle keyboard events for accessibility
    useEffect(() => {
        setIsMounted(true);
        
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            router.push('/login');
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };    const handleNavigation = (href: string) => {
        if (pathname !== href) {
            setLoading(true);
            closeMobileMenu();
            // Navigate immediately without delay
            router.push(href);
        } else {
            closeMobileMenu();
        }
    };const navLinkClasses = "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap";
    const activeLinkClasses = "bg-white/90 text-indigo-700 shadow-lg backdrop-blur-sm border border-white/30 rounded-xl";
    const inactiveLinkClasses = "text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm rounded-xl";

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
    };    return (
        <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex justify-between items-center">
                    {/* Left side - Logo and Title */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                            {title}
                        </h1>
                    </div>

                    {/* Mobile menu button */}
                    <Button
                        onClick={toggleMobileMenu}
                        size="sm"
                        className="lg:hidden flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200 px-3 py-2 rounded-xl shadow-md backdrop-blur-sm"
                    >
                        {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                    </Button>

                    {/* Desktop right side - User info and logout */}
                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                        {/* User avatar and info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 border-2 border-white/20 shadow-md">
                                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm">
                                    {user?.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-white leading-tight truncate max-w-32">
                                    {user?.displayName || 'User'}
                                </span>
                                <Badge variant="secondary" className={`text-xs px-2 py-1 text-white border-0 ${getRoleColor(user?.role || '')} shadow-sm w-fit mt-1`}>
                                    {getRoleLabel(user?.role || '')}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Separator */}
                        <div className="w-px h-8 bg-white/20"></div>
                        
                        {/* Logout button */}
                        <Button
                            onClick={handleLogout}
                            size="sm"
                            className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-200 hover:bg-red-500/30 hover:border-red-400/50 hover:text-white transition-all duration-200 px-3 py-2 rounded-xl shadow-md backdrop-blur-sm text-sm"
                        >
                            <LogOut size={16} />
                            <span className="font-medium">Logout</span>
                        </Button>
                    </div>
                </div>                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2 overflow-x-auto pb-2 mt-3 scrollbar-hide">
                    {user?.role === 'intern' && (
                        <>
                            <button 
                                onClick={() => handleNavigation('/dashboard')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <Send size={18} />
                                <span>Submit Work</span>
                            </button>
                            <button 
                                onClick={() => handleNavigation('/dashboard/my-tasks')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard/my-tasks' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <ClipboardCheck size={18} />
                                <span>My Tasks</span>
                            </button>
                            <button 
                                onClick={() => handleNavigation('/dashboard/my-submissions')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard/my-submissions' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <ListChecks size={18} />
                                <span>My Submissions</span>
                            </button>
                        </>
                    )}                    {(user?.role === 'admin' || user?.role === 'super-admin') && (
                        <>
                            <button 
                                onClick={() => handleNavigation('/dashboard')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <LayoutDashboard size={18} />
                                <span>Review</span>
                            </button>
                            <button 
                                onClick={() => handleNavigation('/dashboard/health')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard/health' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <HeartPulse size={18} />
                                <span>Analytics</span>
                            </button>
                            <button 
                                onClick={() => handleNavigation('/dashboard/allot-task')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard/allot-task' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <ClipboardList size={18} />
                                <span>Assign Tasks</span>
                            </button>
                            <button 
                                onClick={() => handleNavigation('/dashboard/view-tasks')} 
                                className={`${navLinkClasses} ${pathname === '/dashboard/view-tasks' ? activeLinkClasses : inactiveLinkClasses}`}
                            >
                                <ClipboardEdit size={18} />
                                <span>Manage Tasks</span>
                            </button>
                        </>
                    )}                    {user?.role === 'super-admin' && (
                        <button 
                            onClick={() => handleNavigation('/dashboard/manage-users')} 
                            className={`${navLinkClasses} ${pathname === '/dashboard/manage-users' ? activeLinkClasses : inactiveLinkClasses}`}
                        >
                            <Users size={18} />
                            <span>Manage Users</span>
                        </button>
                    )}
                </nav>
            </div>            {/* Mobile Menu Portal */}
            {isMounted && isMobileMenuOpen && createPortal(                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999999] animate-in fade-in duration-200"
                    onClick={closeMobileMenu}
                >                    <div 
                        className="bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-2xl mt-[73px] animate-in slide-in-from-top duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile User Info */}
                        <div className="px-4 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-white/20 shadow-md">
                                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                                        {user?.displayName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-white leading-tight truncate">
                                        {user?.displayName || 'User'}
                                    </span>
                                    <Badge variant="secondary" className={`text-xs px-2 py-1 text-white border-0 ${getRoleColor(user?.role || '')} shadow-sm w-fit mt-1`}>
                                        {getRoleLabel(user?.role || '')}
                                    </Badge>
                                </div>
                            </div>
                        </div>                        {/* Mobile Navigation */}
                        <nav className="px-4 py-4 space-y-1">
                            {user?.role === 'intern' && (
                                <>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <Send size={18} />
                                        <span>Submit Work</span>
                                    </button>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard/my-tasks')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard/my-tasks' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <ClipboardCheck size={18} />
                                        <span>My Tasks</span>
                                    </button>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard/my-submissions')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard/my-submissions' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <ListChecks size={18} />
                                        <span>My Submissions</span>
                                    </button>
                                </>
                            )}                            {(user?.role === 'admin' || user?.role === 'super-admin') && (
                                <>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <LayoutDashboard size={18} />
                                        <span>Review</span>
                                    </button>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard/health')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard/health' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <HeartPulse size={18} />
                                        <span>Analytics</span>
                                    </button>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard/allot-task')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard/allot-task' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <ClipboardList size={18} />
                                        <span>Assign Tasks</span>
                                    </button>
                                    <button 
                                        onClick={() => handleNavigation('/dashboard/view-tasks')}
                                        className={`${navLinkClasses} ${pathname === '/dashboard/view-tasks' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                    >
                                        <ClipboardEdit size={18} />
                                        <span>Manage Tasks</span>
                                    </button>
                                </>
                            )}                            {user?.role === 'super-admin' && (
                                <button 
                                    onClick={() => handleNavigation('/dashboard/manage-users')}
                                    className={`${navLinkClasses} ${pathname === '/dashboard/manage-users' ? activeLinkClasses : inactiveLinkClasses} w-full justify-start`}
                                >
                                    <Users size={18} />
                                    <span>Manage Users</span>
                                </button>
                            )}
                        </nav>

                        {/* Mobile Logout */}
                        <div className="px-4 py-4 border-t border-white/10">
                            <Button
                                onClick={() => {
                                    handleLogout();
                                    closeMobileMenu();
                                }}
                                size="sm"
                                className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-200 hover:bg-red-500/30 hover:border-red-400/50 hover:text-white transition-all duration-200 px-3 py-2 rounded-xl shadow-md backdrop-blur-sm text-sm w-full justify-center"
                            >
                                <LogOut size={16} />
                                <span className="font-medium">Logout</span>
                            </Button>                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}