'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Award, FileText, Clock, ExternalLink, Loader2 } from 'lucide-react';

type Task = {
    id: string;
    taskName: string;
    description: string;
    maxPoints: number;
    createdAt?: any;
    domain?: string;
    dueDate?: any;
};

export default function MyTasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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
    };

    const getDomainColor = (domain: string) => {
        const colors = {
            'video-editing': 'bg-red-100 text-red-800',
            'social-media': 'bg-blue-100 text-blue-800',
            'content-writing': 'bg-green-100 text-green-800',
            default: 'bg-gray-100 text-gray-800'
        };
        return colors[domain as keyof typeof colors] || colors.default;
    };    return (
        <div className="min-h-screen flex flex-col">
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
                            </div>
                        ) : (
                            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                                {tasks.map(task => (
                                    <div key={task.id} className="glass-card glass-card-hover transition-all duration-300">
                                        <div className="flex justify-between items-start mb-6">
                                            <h3 className="text-xl font-bold text-gray-800 leading-tight">
                                                {task.taskName}
                                            </h3>
                                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 ml-4 px-3 py-1 text-sm font-semibold rounded-xl">
                                                <Award className="w-4 h-4 mr-1" />
                                                {task.maxPoints}
                                            </Badge>
                                        </div>
                                        
                                        {task.domain && (
                                            <Badge variant="secondary" className={`w-fit mb-4 px-3 py-1 rounded-xl ${getDomainColor(task.domain)}`}>
                                                {task.domain.replace('-', ' ').toUpperCase()}
                                            </Badge>
                                        )}
                                        
                                        <p className="text-gray-600 mb-8 text-base leading-relaxed">
                                            {task.description}
                                        </p>
                                        
                                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(task.createdAt)}</span>
                                            </div>
                                            {task.dueDate && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Due {formatDate(task.dueDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <Button 
                                            asChild 
                                            size="lg"
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 py-3 rounded-2xl text-base font-medium"
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
                    </div>
                )}
            </main>
        </div>
    );
}