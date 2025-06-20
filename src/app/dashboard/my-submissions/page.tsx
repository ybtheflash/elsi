// app/dashboard/my-submissions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useLoading } from '@/context/LoadingContext';
import { db, auth } from '@/lib/firebase';
import { storage, ID } from '@/lib/appwrite';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import Header from '@/components/dashboard/Header';
import { Edit, MessageSquare, CheckCircle, Clock, AlertCircle, Award, FileText, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { PaginationControls, usePagination } from '@/components/ui/pagination';
import { SubmissionCard } from '@/components/ui/submission-card';

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
    submissionDate?: any; // Date for the week
    taskId?: string;
    taskName?: string;
};

type EditFormData = {
    title: string;
    description: string;
    links: string;
};

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export default function MySubmissionsPage() {
    const { user } = useAuth();
    const { setLoading: setGlobalLoading } = useLoading();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'revision_needed'>('pending');
    const [loading, setLoading] = useState(true);
    const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
    const [feedbackToShow, setFeedbackToShow] = useState<string | null>(null);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [filesToKeep, setFilesToKeep] = useState<{ id: string; name: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, reset, setValue } = useForm<EditFormData>();

    // Filter submissions by active tab and search
    const currentTabSubmissions = submissions.filter(sub => sub.status === activeTab);
    
    // Use pagination hook for current tab
    const {
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        isCompactView,
        setIsCompactView,
        showArchived,
        setShowArchived,
        paginatedItems,
        totalPages,
        totalItems,
        archivedCount
    } = usePagination(
        currentTabSubmissions,
        searchTerm,
        ['title', 'domain', 'description', 'taskName'],
        10, // Items per page
        14  // Auto-archive after 14 days
    );

    // Tab counts
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const revisionCount = submissions.filter(s => s.status === 'revision_needed').length;

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(collection(db, 'submissions'), where('internId', '==', user.uid));        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs: Submission[] = [];
            querySnapshot.forEach((doc) => {
                subs.push({ id: doc.id, ...doc.data() } as Submission);
            });            setSubmissions(subs.sort((a, b) => {
                // Handle null/undefined submittedAt values
                const aTime = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
                const bTime = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
                return bTime - aTime;
            }));
            setLoading(false);
            // Turn off global loading when this page is ready
            setGlobalLoading(false);
        }, (error: any) => {
            let errorMessage = "Failed to load submissions.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to view submissions.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            }
            
            toast.error(errorMessage);
            setLoading(false);
            // Turn off global loading even on error
            setGlobalLoading(false);
            
            // Don't log detailed errors to console
        });        return () => unsubscribe();
    }, [user, setGlobalLoading]);const openEditModal = (sub: Submission, forResubmission = false) => {
        setEditingSubmission(sub);
        setIsResubmitting(forResubmission);
        setValue('title', sub.title);
        setValue('description', sub.description || '');
        setValue('links', sub.links?.join(', ') || '');
        
        // For resubmission, initialize with existing files
        if (forResubmission) {
            setFilesToKeep(sub.fileDetails || []);
            setNewFiles([]);
        } else {
            setFilesToKeep([]);
            setNewFiles([]);
        }
    };    const handleEditSubmit = async (data: EditFormData) => {
        if (!editingSubmission || !user) return;

        const loadingToastId = toast.loading(isResubmitting ? 'Resubmitting...' : 'Updating submission...');

        try {            if (isResubmitting) {
                // For resubmission: delete old submission first, then create new one
                
                // 1. Move old submission to logs collection first
                await addDoc(collection(db, 'submission_logs'), {
                    ...editingSubmission,
                    supersededAt: serverTimestamp(),
                    supersededBy: user.uid,
                    reason: 'resubmission'
                });

                // 2. Delete old submission from active collection
                const oldSubRef = doc(db, 'submissions', editingSubmission.id);
                await deleteDoc(oldSubRef);
                console.log('Successfully deleted old submission:', editingSubmission.id);
                
                // 3. Upload new files to Appwrite
                const uploadedFileDetails: { id: string, name: string }[] = [...filesToKeep];
                for (const file of newFiles) {
                    const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
                    uploadedFileDetails.push({ id: uploadedFile.$id, name: file.name });
                }

                // 4. Create new submission
                const newSubmissionData = {
                    internId: user.uid,
                    internName: user.displayName,
                    domain: editingSubmission.domain,
                    submissionDate: editingSubmission.submissionDate,
                    title: data.title,
                    description: data.description,
                    links: data.links ? data.links.split(',').map((link: string) => link.trim()).filter(Boolean) : [],
                    fileDetails: uploadedFileDetails,
                    fileIds: uploadedFileDetails.map(file => file.id),
                    status: 'pending',
                    points: 0,
                    taskId: editingSubmission.taskId || null,
                    taskName: editingSubmission.taskName || 'General Submission',
                    submittedAt: serverTimestamp(),
                    isResubmission: true,
                    originalSubmissionId: editingSubmission.id
                };                await addDoc(collection(db, 'submissions'), newSubmissionData);

                toast.dismiss(loadingToastId);
                // Small delay to ensure real-time listener processes the deletion
                setTimeout(() => {
                    toast.success('Resubmitted successfully! Your new submission is now under review.');
                }, 500);
            } else {
                // Regular edit: just update the existing submission
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

                if (Object.keys(updatedData).length > 0) {
                    const subDocRef = doc(db, 'submissions', editingSubmission.id);
                    await updateDoc(subDocRef, updatedData);

                    // Log the edit action
                    const logCollectionRef = collection(subDocRef, 'logs');
                    await addDoc(logCollectionRef, {
                        actorId: user.uid,
                        actorName: user.displayName,
                        timestamp: serverTimestamp(),
                        action: `Edited submission. Changes: ${changes.join(' ')}`,
                    });
                }

                toast.dismiss(loadingToastId);
                toast.success('Submission updated successfully!');
            }

            setEditingSubmission(null);
            setIsResubmitting(false);
            setFilesToKeep([]);
            setNewFiles([]);
            reset();        } catch (error: any) {
            console.error('Resubmission error:', error);
            let errorMessage = isResubmitting ? 'Failed to resubmit.' : 'Failed to update submission.';
            
            if (error.code === 'permission-denied') {
                errorMessage = 'You do not have permission to edit this submission.';
            } else if (error.code === 'network-request-failed') {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message && error.message.includes('storage')) {
                errorMessage = 'File upload failed. Please try again.';
            }
            
            toast.dismiss(loadingToastId);
            toast.error(errorMessage);
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
    };    const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewFiles(Array.from(e.target.files));
        }
    };

    const removeExistingFile = (fileId: string) => {
        setFilesToKeep(prev => prev.filter(file => file.id !== fileId));
    };

    const removeNewFile = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Filter submissions based on active tab
    useEffect(() => {
        const filtered = submissions.filter(sub => sub.status === activeTab);
        setFilteredSubmissions(filtered);
    }, [submissions, activeTab]);    if (loading) {
        return (
            <>
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
            </>
        );
    }    return (
        <>
            <Header title="My Submissions" />                <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">My Submissions</h2>
                <p className="text-white/80 text-lg">Track, edit, and view feedback on your work.</p>
            </div>
                  {/* Tab Navigation */}
                <div className="flex justify-center px-4 mb-8">
                    <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-2 gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`relative flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                                activeTab === 'pending'
                                    ? 'bg-yellow-500 text-white shadow-lg scale-110'
                                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                            }`}
                            title="Pending Submissions"
                        >
                            <Clock size={24} />
                            {submissions.filter(s => s.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-yellow-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {submissions.filter(s => s.status === 'pending').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`relative flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                                activeTab === 'approved'
                                    ? 'bg-green-500 text-white shadow-lg scale-110'
                                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                            }`}
                            title="Approved Submissions"
                        >
                            <CheckCircle size={24} />
                            {submissions.filter(s => s.status === 'approved').length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {submissions.filter(s => s.status === 'approved').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('revision_needed')}
                            className={`relative flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                                activeTab === 'revision_needed'
                                    ? 'bg-red-500 text-white shadow-lg scale-110'
                                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                            }`}
                            title="Revision Needed"
                        >
                            <AlertCircle size={24} />
                            {submissions.filter(s => s.status === 'revision_needed').length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {submissions.filter(s => s.status === 'revision_needed').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
                
                <main className="flex-grow p-4 sm:p-8">                    <div className="w-full max-w-6xl mx-auto">{filteredSubmissions.length === 0 ? (
                        <div className="max-w-lg mx-auto text-center">
                            <div className="glass-card p-16">
                                <div className={`w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center ${
                                    activeTab === 'pending' ? 'bg-yellow-100' :
                                    activeTab === 'approved' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    {activeTab === 'pending' && <Clock className="w-12 h-12 text-yellow-600" />}
                                    {activeTab === 'approved' && <CheckCircle className="w-12 h-12 text-green-600" />}
                                    {activeTab === 'revision_needed' && <AlertCircle className="w-12 h-12 text-red-600" />}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                    {activeTab === 'pending' && 'No Pending Submissions'}
                                    {activeTab === 'approved' && 'No Approved Submissions'}
                                    {activeTab === 'revision_needed' && 'No Submissions Need Revision'}
                                </h3>
                                <p className="text-gray-600 text-lg">
                                    {activeTab === 'pending' && "You don't have any pending submissions. Submit your work to see it here!"}
                                    {activeTab === 'approved' && "You don't have any approved submissions yet. Keep up the great work!"}
                                    {activeTab === 'revision_needed' && "Great! You don't have any submissions that need revision."}
                                </p>
                            </div>
                        </div>
                    ) : (<div className="space-y-8">
                            {filteredSubmissions.map(sub => (
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
                                    ) : null}                                    <div className="border-t border-gray-200 pt-6 flex flex-wrap items-center gap-4">
                                        {/* Edit button - only for pending submissions */}
                                        {sub.status === 'pending' && (
                                            <button 
                                                onClick={() => openEditModal(sub)} 
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                            >
                                                <Edit size={18} /> Edit
                                            </button>
                                        )}
                                        
                                        {/* Resubmit button - only for revision needed */}
                                        {sub.status === 'revision_needed' && (
                                            <button 
                                                onClick={() => openEditModal(sub, true)} 
                                                className="flex items-center gap-2 px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                            >
                                                <Edit size={18} /> Resubmit
                                            </button>
                                        )}
                                        
                                        {/* View feedback button */}
                                        {sub.feedback && (
                                            <button 
                                                onClick={() => setFeedbackToShow(sub.feedback!)} 
                                                className="flex items-center gap-2 px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105"
                                            >
                                                <MessageSquare size={18} /> View Feedback
                                            </button>
                                        )}
                                        
                                        {/* Recall button - only for pending submissions */}
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
                        </div>                    )}                </div>
            </main>

            {/* Edit Modal */}{editingSubmission && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 99999 }} onClick={() => {
                    setEditingSubmission(null);
                    setIsResubmitting(false);
                    setFilesToKeep([]);
                    setNewFiles([]);
                }}>
                    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <form onSubmit={handleSubmit(handleEditSubmit)}>                            <div className="p-8">
                                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                                    {isResubmitting ? 'Resubmit Work' : 'Edit Submission'}
                                </h2>
                                {isResubmitting && (
                                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-orange-800 text-sm">
                                            <strong>Resubmission:</strong> This will create a new submission and move your previous one to history. 
                                            You can modify all fields and manage file attachments.
                                        </p>
                                    </div>
                                )}
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
                                    </div>                                    <div>
                                        <label className="block text-lg font-semibold text-gray-700 mb-3">Links (comma-separated)</label>
                                        <input 
                                            {...register('links')} 
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all" 
                                        />
                                    </div>
                                    
                                    {/* File management section - only for resubmissions */}
                                    {isResubmitting && (
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-3">File Attachments</label>
                                            
                                            {/* Existing files */}
                                            {filesToKeep.length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Current Files (click × to remove):</h4>
                                                    <div className="space-y-2">
                                                        {filesToKeep.map(file => (
                                                            <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                <span className="text-sm text-gray-700">{file.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeExistingFile(file.id)}
                                                                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* New files */}
                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">Add New Files:</h4>
                                                <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-6 text-center relative hover:border-blue-400 transition-colors">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={handleNewFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <div className="flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-gray-600 text-sm">Drag & drop files here, or click to select</span>
                                                        <span className="text-xs text-gray-500 mt-1">Support for multiple file types</span>
                                                    </div>
                                                </div>
                                                {newFiles.length > 0 && (
                                                    <div className="mt-2 space-y-2">
                                                        {newFiles.map((file, index) => (
                                                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                                <span className="text-sm text-gray-700">{file.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeNewFile(index)}
                                                                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50/80 backdrop-blur-sm px-8 py-6 flex justify-end gap-4 rounded-b-3xl">                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setEditingSubmission(null);
                                        setIsResubmitting(false);
                                        setFilesToKeep([]);
                                        setNewFiles([]);
                                    }} 
                                    className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                                >
                                    Cancel
                                </button><button 
                                    type="submit" 
                                    className={`px-8 py-4 font-semibold rounded-2xl transition-all duration-200 hover:scale-105 text-white ${
                                        isResubmitting 
                                            ? 'bg-orange-600 hover:bg-orange-700' 
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {isResubmitting ? 'Resubmit Work' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackToShow && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 99999 }} onClick={() => setFeedbackToShow(null)}>
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
        </>
    );
}