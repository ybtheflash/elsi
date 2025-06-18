// app/dashboard/my-submissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { db, auth } from '@/lib/firebase';
import { storage, ID } from '@/lib/appwrite';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import Header from '@/components/dashboard/Header';
import { Edit, MessageSquare, CheckCircle, Clock, AlertCircle, Award, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';

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

    const getStatusIcon = (status: Submission['status']) => {
        switch (status) {
            case 'approved': return <CheckCircle className="text-green-500" />;
            case 'pending': return <Clock className="text-yellow-500" />;
            case 'revision_needed': return <AlertCircle className="text-red-500" />;        }
    };

    const getFileUrl = (fileId: string) => {
        return storage.getFileView(BUCKET_ID, fileId);
    };

    if (loading) {
        return <><Header title="My Submissions" /><div className="p-6">Loading...</div></>;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            <Header title="My Submissions" />
            <main className="p-4 sm:p-6">
                <div className="space-y-6">
                    {submissions.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">You haven't made any submissions yet.</p>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub.id} className="bg-white p-5 rounded-lg shadow-md transition-shadow hover:shadow-lg">
                                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                    <h3 className="text-xl font-semibold text-gray-800">{sub.title}</h3>
                                    <span className="text-xs font-mono text-gray-500">{new Date(sub.submittedAt.seconds * 1000).toLocaleString()}</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1.5"><span className="font-semibold">{sub.domain}</span></div>
                                    <div className="flex items-center gap-1.5">{getStatusIcon(sub.status)} <span className="capitalize">{sub.status.replace('_', ' ')}</span></div>
                                    <div className="flex items-center gap-1.5"><Award className="text-indigo-500" /> <span className="font-bold">{sub.points}</span> Points</div>
                                </div>

                                {sub.description && <p className="text-sm text-gray-700 mb-4">{sub.description}</p>}
                                
                                {sub.fileDetails && sub.fileDetails.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-sm mb-2">Files:</h4>
                                        <div className="flex flex-col gap-2">
                                            {sub.fileDetails.map(file => (
                                                <a key={file.id} href={getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                                                    <FileText size={16} /> {file.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sub.links && sub.links.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-sm mb-2">Links:</h4>
                                        <div className="flex flex-col gap-2">
                                            {sub.links.map((link, i) => (
                                                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm truncate">
                                                    <LinkIcon size={16} /> {link}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-3 flex items-center gap-4">
                                    <button onClick={() => openEditModal(sub)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                                        <Edit size={16} /> Edit
                                    </button>
                                    {sub.feedback && (
                                        <button onClick={() => setFeedbackToShow(sub.feedback!)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                                            <MessageSquare size={16} /> View Feedback
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {editingSubmission && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setEditingSubmission(null)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit(handleEditSubmit)}>
                            <div className="p-6">
                                <h2 className="text-xl font-bold mb-4">Edit Submission</h2>
                                <div className="space-y-4">
                                    <div><label className="font-semibold">Title</label><input {...register('title')} className="w-full mt-1 border p-2 rounded" /></div>
                                    <div><label className="font-semibold">Description</label><textarea {...register('description')} rows={4} className="w-full mt-1 border p-2 rounded"></textarea></div>
                                    <div><label className="font-semibold">Links (comma-separated)</label><input {...register('links')} className="w-full mt-1 border p-2 rounded" /></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                                <button type="button" onClick={() => setEditingSubmission(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackToShow && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setFeedbackToShow(null)}>
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-3">Admin Feedback</h3>
                        <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{feedbackToShow}</p>
                        <div className="text-right mt-4">
                            <button onClick={() => setFeedbackToShow(null)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}