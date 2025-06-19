'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, where, collectionGroup } from 'firebase/firestore';
import { toast, Toaster } from 'sonner';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

type Task = {
    id: string;
    taskName: string;
    assignedTo: string[];
    submissionCount?: number;
    // Add other fields for editing
    domain: string;
    description: string;
    instructions: string;
    links: string[];
    maxPoints: number;
};

type FormData = Omit<Task, 'id' | 'submissionCount' | 'assignedTo'> & { links: string };

export default function ViewTasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const { register, handleSubmit, reset } = useForm<FormData>();    const fetchTasksAndSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all tasks
            const tasksQuery = query(collection(db, 'tasks'));
            const tasksSnapshot = await getDocs(tasksQuery);
            const taskList = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

            // Fetch all submissions to calculate counts
            const submissionsQuery = query(collection(db, 'submissions'));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submissions = submissionsSnapshot.docs.map(doc => doc.data());

            // Map submission counts to each task
            const tasksWithCounts = taskList.map(task => {
                const count = submissions.filter(sub => sub.taskId === task.id).length;
                return { ...task, submissionCount: count };
            });

            setTasks(tasksWithCounts);
        } catch (error) {
            console.warn('Failed to fetch tasks:', error);
            toast.error('Failed to load tasks. Please refresh the page.');
            setTasks([]); // Set empty array as fallback
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasksAndSubmissions();
    }, [fetchTasksAndSubmissions]);

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        reset({
            taskName: task.taskName,
            domain: task.domain,
            description: task.description,
            instructions: task.instructions,
            links: task.links.join(', '),
            maxPoints: task.maxPoints,
        });
    };

    const handleEditSubmit = async (data: FormData) => {
        if (!editingTask) return;
        const toastId = toast.loading("Updating task...");
        try {
            const taskDocRef = doc(db, 'tasks', editingTask.id);
            await updateDoc(taskDocRef, {
                ...data,
                links: data.links.split(',').map(l => l.trim()).filter(Boolean),
            });
            toast.success("Task updated successfully!", { id: toastId });
            setEditingTask(null);
            fetchTasksAndSubmissions(); // Refresh data
        } catch (error) {
            toast.error("Failed to update task.", { id: toastId });
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone and will delete all associated attachments.")) {
            return;
        }
        const toastId = toast.loading("Deleting task...");
        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/tasks/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ taskId }),
            });
            if (!response.ok) throw new Error("Failed to delete task.");
            toast.success("Task deleted successfully.", { id: toastId });
            fetchTasksAndSubmissions(); // Refresh data
        } catch (error) {
            toast.error("Deletion failed.", { id: toastId });
        }
    };    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header title="Manage Tasks" />
                <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
                    <div className="w-full max-w-md mx-auto text-center">
                        <div className="glass-card">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Tasks</h3>
                            <p className="text-gray-600">Just a moment, fetching all tasks...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }    return (
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
            <Header title="Manage Allotted Tasks" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">Manage Allotted Tasks</h2>
                <p className="text-white/80 text-lg">View, edit, or delete existing tasks.</p>
            </div>
            <main className="flex-grow p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">
                    {tasks.length === 0 ? (
                        <div className="max-w-lg mx-auto text-center">
                            <div className="glass-card p-16">
                                <div className="w-24 h-24 bg-white/10 rounded-3xl mx-auto mb-8 flex items-center justify-center">
                                    <Edit className="w-12 h-12 text-white/80" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">No Tasks Created Yet</h3>
                                <p className="text-white/80 text-lg">Create your first task to get started with managing assignments.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {tasks.map(task => (
                                <div key={task.id} className="glass-card p-8 hover:shadow-2xl transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-800 mb-3">{task.taskName}</h3>
                                            <div className="flex items-center gap-4 text-gray-600">
                                                <span className="px-4 py-2 bg-gray-100 rounded-xl font-medium">{task.domain}</span>
                                                <span className="text-lg font-semibold">
                                                    {task.submissionCount} / {task.assignedTo.length} Submitted
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-4xl font-bold text-indigo-600 mb-1">
                                                    {task.submissionCount}
                                                </div>
                                                <div className="text-sm text-gray-500">of {task.assignedTo.length}</div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => openEditModal(task)} 
                                                    className="p-4 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-2xl transition-all duration-200 hover:scale-105"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTask(task.id)} 
                                                    className="p-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-2xl transition-all duration-200 hover:scale-105"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={() => setEditingTask(null)}>
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit(handleEditSubmit)}>
                            <div className="p-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-8">Edit Task</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Task Name</label>
                                        <input 
                                            {...register('taskName')} 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Description</label>
                                        <textarea 
                                            {...register('description')} 
                                            rows={5} 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Links (comma-separated)</label>
                                        <input 
                                            {...register('links')} 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-3">Domain</label>
                                            <input 
                                                {...register('domain')} 
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-3">Max Points</label>
                                            <input 
                                                {...register('maxPoints', { valueAsNumber: true })} 
                                                type="number"
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Instructions</label>
                                        <textarea 
                                            {...register('instructions')} 
                                            rows={5} 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50/80 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 rounded-b-3xl">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingTask(null)} 
                                    className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}