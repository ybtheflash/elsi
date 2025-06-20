// app/dashboard/my-submissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { db, auth } from '@/lib/firebase';
import { storage, ID } from '@/lib/appwrite';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { toast, Toaster } from 'sonner';
import Header from '@/components/dashboard/Header';
import { Edit, MessageSquare, CheckCircle, Clock, AlertCircle, Award, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type Submission = {
    id: string;
    title: string;
    domain: string;
    description?: string;
    links?: string[];
    fileIds?: string[];
    fileDetails?: { id: string; name: string }[];
    status: 'pending' | 'approved' | 'revision_needed';
    points: number;
    feedback?: string;
    submittedAt: any; // Firestore Timestamp
};

type EditFormData = {
    title: string;
    description: string;
    links: string;
};

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export default function MySubmissionsPage() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
    const [feedbackToShow, setFeedbackToShow] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue } = useForm<EditFormData>();

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(db, 'submissions'), where('internId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs: Submission[] = [];
            querySnapshot.forEach((doc) => {
                subs.push({ id: doc.id, ...doc.data() } as Submission);
            });
            setSubmissions(subs.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis()));
            setLoading(false);        }, (error: any) => {
            let errorMessage = "Failed to load submissions.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to view submissions.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            }
            
            toast.error(errorMessage);
            setLoading(false);
            
            // Don't log detailed errors to console
        });

        return () => unsubscribe();
    }, [user]);

    const openEditModal = (sub: Submission) => {
        setEditingSubmission(sub);
        setValue('title', sub.title);
        setValue('description', sub.description || '');
        setValue('links', sub.links?.join(', ') || '');
    };

    const handleEditSubmit = async (data: EditFormData) => {
        if (!editingSubmission || !user) return;

        toast.loading('Updating submission...');
        const originalData = { ...editingSubmission };
        let changes: string[] = [];

        const updatedData: Partial<Submission> = {};
        if (data.title !== originalData.title) {
            updatedData.title = data.title;
            changes.push(`Title updated.`);
        }
        if (data.description !== originalData.description) {
            updatedData.description = data.description;
            changes.push(`Description updated.`);
        }
        const newLinks = data.links.split(',').map(l => l.trim()).filter(Boolean);
        if (JSON.stringify(newLinks) !== JSON.stringify(originalData.links || [])) {
            updatedData.links = newLinks;
            changes.push(`Links updated.`);
        }

        try {
            if (Object.keys(updatedData).length > 0) {
                const subDocRef = doc(db, 'submissions', editingSubmission.id);
                await updateDoc(subDocRef, updatedData);

                // Log the edit action
                const logCollectionRef = collection(subDocRef, 'logs');
                await addDoc(logCollectionRef, {                    actorId: user.uid,
                    actorName: user.displayName,
                    timestamp: serverTimestamp(),
                    action: `Edited submission. Changes: ${changes.join(' ')}`,
                });
            }
            toast.success('Submission updated successfully!');
            setEditingSubmission(null);
            reset();
        } catch (error: any) {
            let errorMessage = 'Failed to update submission.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to edit this submission.';
            } else if (error.code === 'network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            toast.error(errorMessage);
              // Don't log detailed errors to console
        }
    };

    const handleRecallSubmission = async (subId: string) => {
        if (!window.confirm("Are you sure you want to recall this submission? This action cannot be undone.")) {
            return;
        }

        const toastId = toast.loading("Recalling submission...");
        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/submissions/recall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ submissionId: subId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to recall submission.');
            }

            toast.success("Submission recalled successfully.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const getStatusIcon = (status: Submission['status']) => {
        switch (status) {
            case 'approved': return <CheckCircle className="text-green-500" />;
            case 'pending': return <Clock className="text-yellow-500" />;
            case 'revision_needed': return <AlertCircle className="text-red-500" />;        }
    };

    const getFileUrl = (fileId: string) => {
        return storage.getFileView(BUCKET_ID, fileId);
    };    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header title="My Submissions" />
                <div className="text-center py-8 px-4">
                    <h2 className="text-4xl font-bold text-white mb-3">My Submissions</h2>
                    <p className="text-white/80 text-lg">Track, edit, and view feedback on your work.</p>
                </div>
                <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
                    <div className="w-full max-w-md mx-auto text-center">
                        <div className="glass-card p-16">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Submissions</h3>
                            <p className="text-gray-600">Fetching your submission history...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }return (
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
            <Header title="My Submissions" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">My Submissions</h2>
                <p className="text-white/80 text-lg">Track, edit, and view feedback on your work.</p>
            </div>
            <main className="flex-grow p-4 sm:p-8">
                <div className="w-full max-w-6xl mx-auto">                    {submissions.length === 0 ? (
                        <div className="max-w-lg mx-auto text-center">
                            <div className="glass-card p-16">
                                <div className="w-24 h-24 bg-indigo-100 rounded-3xl mx-auto mb-8 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">No Submissions Yet</h3>
                                <p className="text-gray-600 text-lg">You haven't made any submissions yet. Check your tasks to get started!</p>
                            </div>
                        </div>
                    ) : (<div className="space-y-8">
                            {submissions.map(sub => (
                                <div key={sub.id} className="glass-card glass-card-hover transition-all duration-300 p-8">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-800 mb-3">{sub.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                                <span className="px-4 py-2 bg-gray-100 rounded-xl font-medium text-gray-700">
                                                    {sub.domain}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(sub.status)}
                                                    <span className="capitalize text-gray-700 font-medium">
                                                        {sub.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-purple-600">
                                                    <Award size={20} />
                                                    <span className="font-bold text-lg">{sub.points} Points</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-sm text-gray-500 font-mono">
                                                {new Date(sub.submittedAt.seconds * 1000).toLocaleDateString()} at{' '}
                                                {new Date(sub.submittedAt.seconds * 1000).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>

                                    {sub.description && (
                                        <div className="mb-6">
                                            <p className="text-gray-600 leading-relaxed text-lg">{sub.description}</p>
                                        </div>
                                    )}
                                    
                                    {(sub.fileDetails && sub.fileDetails.length > 0) || (sub.links && sub.links.length > 0) ? (
                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                            {sub.fileDetails && sub.fileDetails.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 mb-4 text-lg">Attached Files:</h4>
                                                    <div className="grid gap-3">
                                                        {sub.fileDetails.map(file => (
                                                            <a 
                                                                key={file.id} 
                                                                href={getFileUrl(file.id)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-gray-800 hover:scale-[1.02] border border-gray-200"
                                                            >
                                                                <FileText size={20} className="text-blue-500" />
                                                                <span className="font-medium">{file.name}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {sub.links && sub.links.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 mb-4 text-lg">External Links:</h4>
                                                    <div className="grid gap-3">
                                                        {sub.links.map((link, i) => (
                                                            <a 
                                                                key={i} 
                                                                href={link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-gray-800 hover:scale-[1.02] truncate border border-gray-200"
                                                            >
                                                                <LinkIcon size={20} className="text-green-500 flex-shrink-0" />
                                                                <span className="truncate">{link}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    <div className="border-t border-gray-200 pt-6 flex flex-wrap items-center gap-4">
                                        <button 
                                            onClick={() => openEditModal(sub)} 
                                            className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                        >
                                            <Edit size={18} /> Edit
                                        </button>
                                        {sub.feedback && (
                                            <button 
                                                onClick={() => setFeedbackToShow(sub.feedback!)} 
                                                className="flex items-center gap-2 px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                            >
                                                <MessageSquare size={18} /> View Feedback
                                            </button>
                                        )}
                                        {sub.status === 'pending' && (
                                            <button
                                                onClick={() => handleRecallSubmission(sub.id)}
                                                className="flex items-center gap-2 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                            >
                                                <Trash2 size={18} /> Recall Submission
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>            {/* Edit Modal */}
            {editingSubmission && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={() => setEditingSubmission(null)}>
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit(handleEditSubmit)}>
                            <div className="p-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-8">Edit Submission</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Title</label>
                                        <input 
                                            {...register('title')} 
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
                                </div>
                            </div>
                            <div className="bg-gray-50/80 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 rounded-b-3xl">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingSubmission(null)} 
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

            {/* Feedback Modal */}
            {feedbackToShow && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={() => setFeedbackToShow(null)}>
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-8">
                            <h3 className="text-3xl font-bold text-gray-800 mb-6">Admin Feedback</h3>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">{feedbackToShow}</p>
                            </div>
                            <div className="text-right mt-8">
                                <button 
                                    onClick={() => setFeedbackToShow(null)} 
                                    className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}