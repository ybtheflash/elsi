'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import Header from '@/components/dashboard/Header';
import { db } from '@/lib/firebase';
import { storage } from '@/lib/appwrite';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Award, FileText, Clock, ExternalLink, Loader2, Link as LinkIcon, User, Info, Paperclip } from 'lucide-react';

type Task = {
    id: string;
    taskName: string;
    description: string;
    instructions?: string;
    maxPoints: number;
    createdAt?: any;
    dueDate?: any;
    domain?: string;
    links?: string[];
    attachments?: Array<{ name: string; fileId: string }>;
    assignedBy?: string;
};

export default function MyTasksPage() {
    const { user } = useAuth();
    const { setLoading: setGlobalLoading } = useLoading();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Utility function to get due date status
    const getDueDateStatus = (dueDate: any) => {
        if (!dueDate) return { status: 'none', text: '', className: '' };
        
        const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                status: 'overdue',
                text: `Overdue by ${Math.abs(diffDays)} day(s)`,
                className: 'bg-red-100 text-red-700 border-red-200'
            };
        } else if (diffDays <= 2) {
            return {
                status: 'urgent',
                text: diffDays === 0 ? 'Due today' : `Due in ${diffDays} day(s)`,
                className: 'bg-orange-100 text-orange-700 border-orange-200'
            };
        } else {
            return {
                status: 'normal',
                text: `Due in ${diffDays} day(s)`,
                className: 'bg-blue-100 text-blue-700 border-blue-200'
            };
        }
    };

    useEffect(() => {
        if (!user) return;
        const fetchTasks = async () => {
            try {
                const q = query(
                    collection(db, 'tasks'),
                    where('assignedTo', 'array-contains', user.uid),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);                const taskList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setTasks(taskList);
            } catch (error) {
                console.warn('Failed to fetch tasks:', error);
                setTasks([]);
            } finally {
                setLoading(false);
                // Turn off global loading when this page is ready
                setGlobalLoading(false);
            }
        };
        fetchTasks();
    }, [user]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'No due date';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };    const getDomainColor = (domain: string) => {
        const normalizedDomain = domain.toLowerCase().replace(/\s+/g, '-');
        const colors = {
            'video-editing': 'bg-red-100 text-red-800',
            'social-media-management': 'bg-blue-100 text-blue-800',
            'content-writing': 'bg-green-100 text-green-800',
            'general': 'bg-gray-100 text-gray-800',
            default: 'bg-purple-100 text-purple-800'
        };
        return colors[normalizedDomain as keyof typeof colors] || colors.default;
    };

    const getFileUrl = (fileId: string) => {
        try {
            const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
            return storage.getFileView(BUCKET_ID, fileId);
        } catch (error) {
            console.warn('Failed to generate file URL:', error);
            return '#';
        }
    };    return (
        <>
            <Header title="My Tasks" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">Your Assigned Tasks</h2>
                <p className="text-white/80 text-lg">Complete your tasks and track your progress</p>
            </div>
            <main className="flex-grow p-4 sm:p-8">
                {loading ? (
                    <div className="w-full max-w-md mx-auto text-center">
                        <div className="glass-card">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Tasks</h3>
                            <p className="text-gray-600">Fetching your assigned tasks...</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-6xl mx-auto">
                        {tasks.length === 0 ? (
                            <div className="max-w-lg mx-auto text-center">
                                <div className="glass-card">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                        <FileText className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4">No Tasks Yet</h3>
                                    <p className="text-gray-600 text-lg mb-8">You don't have any tasks assigned yet. Check back later or contact your admin.</p>
                                    <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 rounded-2xl text-lg font-medium">
                                        <Link href="/dashboard">Go to Dashboard</Link>
                                    </Button>
                                </div>
                            </div>                        ) : (
                            <div className="grid gap-6 lg:grid-cols-2">
                                {tasks.map(task => (
                                    <div key={task.id} className="glass-card transition-all duration-300 hover:shadow-xl">
                                        {/* Header Section */}
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                                            <div className="flex-1">
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight mb-2">
                                                    {task.taskName}
                                                </h3>                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                    {task.domain && (
                                                        <Badge variant="secondary" className={`px-3 py-1 rounded-xl ${getDomainColor(task.domain)}`}>
                                                            {task.domain.replace(/[_-]/g, ' ').toUpperCase()}
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1 text-sm font-semibold rounded-xl">
                                                        <Award className="w-4 h-4 mr-1" />
                                                        {task.maxPoints} Points
                                                    </Badge>
                                                    {task.dueDate && (() => {
                                                        const dueDateStatus = getDueDateStatus(task.dueDate);
                                                        return (
                                                            <Badge className={`px-3 py-1 rounded-xl border ${dueDateStatus.className}`}>
                                                                <Clock className="w-4 h-4 mr-1" />
                                                                {dueDateStatus.text}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Task Description */}
                                        <div className="mb-6">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Description
                                            </h4>
                                            <p className="text-gray-600 text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
                                                {task.description}
                                            </p>
                                        </div>

                                        {/* Special Instructions */}
                                        {task.instructions && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Info className="w-4 h-4" />
                                                    Special Instructions
                                                </h4>
                                                <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                                    {task.instructions}
                                                </p>
                                            </div>
                                        )}

                                        {/* Relevant Links */}
                                        {task.links && task.links.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Relevant Links
                                                </h4>
                                                <div className="space-y-2">
                                                    {task.links.map((link, index) => (
                                                        <a
                                                            key={index}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors group"
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                            <span className="text-emerald-700 text-sm truncate group-hover:text-emerald-800">
                                                                {link}
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}                                        {/* Attachments */}
                                        {task.attachments && task.attachments.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4" />
                                                    Attachments
                                                </h4>
                                                <div className="space-y-2">
                                                    {task.attachments.map((attachment, index) => (
                                                        <a
                                                            key={index}
                                                            href={getFileUrl(attachment.fileId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group cursor-pointer"
                                                        >
                                                            <Paperclip className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                                            <span className="text-purple-700 text-sm group-hover:text-purple-800">
                                                                {attachment.name}
                                                            </span>
                                                            <ExternalLink className="w-3 h-3 text-purple-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}                                        {/* Task Meta Information */}
                                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-6 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                <span>Created: {formatDate(task.createdAt)}</span>
                                            </div>
                                            {task.dueDate && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                                    <span>Due: {formatDate(task.dueDate)}</span>
                                                </div>
                                            )}
                                            {task.assignedBy && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 flex-shrink-0" />
                                                    <span>By: {task.assignedBy}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <Button 
                                            asChild 
                                            size="lg"
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 py-4 rounded-2xl text-base font-medium"
                                        >
                                            <Link 
                                                href={`/dashboard?taskId=${task.id}&taskName=${encodeURIComponent(task.taskName)}`}
                                                className="flex items-center justify-center gap-3"
                                            >
                                                <FileText className="w-5 h-5" />
                                                Submit Work
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>                )}
            </main>
        </>
    );
}