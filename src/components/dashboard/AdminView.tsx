'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storage } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { History, Link as LinkIcon, Filter } from 'lucide-react';
import { PaginationControls, usePagination } from '@/components/ui/pagination';
import { SubmissionCard } from '@/components/ui/submission-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Define types for our data structures
type Submission = {
    id: string;
    internName: string;
    title: string;
    domain: string;
    description: string;
    links?: string[];
    fileDetails?: { id: string, name: string }[];
    status: 'pending' | 'approved' | 'revision_needed';
    points: number;
    feedback?: string;
};

type Log = {
    id: string;
    actorName: string;
    action: string;
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
};

export default function AdminView() {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'revision_needed'>('all');
    const [domainFilter, setDomainFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // State for the logs modal
    const [viewingLogsFor, setViewingLogsFor] = useState<Submission | null>(null);
    const [currentLogs, setCurrentLogs] = useState<Log[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Get unique domains for filter
    const domains = Array.from(new Set(submissions.map(s => s.domain).filter(Boolean)));

    // Filter submissions based on status and domain
    const filteredSubmissions = submissions.filter(submission => {
        const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
        const matchesDomain = domainFilter === 'all' || submission.domain === domainFilter;
        return matchesStatus && matchesDomain;
    });

    // Use pagination hook
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
        filteredSubmissions,
        searchTerm,
        ['title', 'internName', 'domain', 'description'],
        20, // Items per page
        7   // Auto-archive after 7 days
    );

    useEffect(() => {
        const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const subs: Submission[] = [];
            querySnapshot.forEach((doc) => {
                subs.push({ id: doc.id, ...doc.data() } as Submission);
            });
            setSubmissions(subs);
            setLoading(false);
        }, (error: any) => {
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
    }, []);

    const handleUpdatePoints = async (id: string, newPoints: number) => {
        try {
            const subDoc = doc(db, 'submissions', id);
            await updateDoc(subDoc, { points: newPoints });
            toast.success("Points updated.");
        } catch (error: any) {
            let errorMessage = "Failed to update points.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to update points.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please try again.";
            }
            
            toast.error(errorMessage);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: Submission['status']) => {
        try {
            const subDoc = doc(db, 'submissions', id);
            await updateDoc(subDoc, { status: newStatus });
            toast.success("Status updated.");
        } catch (error: any) {
            let errorMessage = "Failed to update status.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to update status.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please try again.";
            }
            
            toast.error(errorMessage);
        }
    };

    const handleUpdateFeedback = async (id: string, newFeedback: string) => {
        try {
            const subDoc = doc(db, 'submissions', id);
            await updateDoc(subDoc, { feedback: newFeedback });
            toast.info("Feedback saved.");
        } catch (error: any) {
            let errorMessage = "Failed to save feedback.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to update feedback.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please try again.";
            }
            
            toast.error(errorMessage);
        }
    };

    const handleViewLogs = async (submission: Submission) => {
        setViewingLogsFor(submission);
        setLogsLoading(true);
        const logCollectionRef = collection(db, 'submissions', submission.id, 'logs');
        const q = query(logCollectionRef, orderBy('timestamp', 'desc'));

        try {
            const querySnapshot = await getDocs(q);
            const logs: Log[] = [];
            querySnapshot.forEach((doc) => {
                logs.push({ id: doc.id, ...doc.data() } as Log);
            });
            setCurrentLogs(logs);
        } catch (error: any) {
            let errorMessage = "Could not fetch edit logs.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to view logs.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please try again.";
            }
            
            toast.error(errorMessage);
        } finally {
            setLogsLoading(false);
        }
    };

    const getFileUrl = (fileId: string) => {
        const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
        return storage.getFileView(BUCKET_ID, fileId);
    };    if (loading) {
        return (
            <div className="w-full text-center p-12 glass-container rounded-3xl">
                <div className="animate-pulse">
                    <div className="w-20 h-20 bg-white/20 rounded-3xl mx-auto mb-6"></div>
                    <div className="h-8 bg-white/20 rounded-xl w-56 mx-auto mb-4"></div>
                    <div className="h-4 bg-white/20 rounded-lg w-40 mx-auto"></div>
                </div>
            </div>        );
    }    return (
        <div className="w-full space-y-8">
            {/* Filters and Search */}
            <div className="glass-container p-6 rounded-3xl">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search submissions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm"
                            />
                        </div>

                        {/* Status Filter */}
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark]"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="revision_needed">Needs Revision</option>
                        </select>

                        {/* Domain Filter */}
                        <select 
                            value={domainFilter} 
                            onChange={(e) => setDomainFilter(e.target.value)}
                            className="p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark]"
                        >
                            <option value="all">All Domains</option>
                            {domains.map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                            ))}
                        </select>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCompactView(!isCompactView)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                                isCompactView 
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' 
                                    : 'bg-black/20 text-white/70 border border-white/20 hover:bg-black/30'
                            }`}
                        >
                            Compact
                        </button>
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                                showArchived 
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' 
                                    : 'bg-black/20 text-white/70 border border-white/20 hover:bg-black/30'
                            }`}
                        >
                            Archived ({archivedCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="glass-container p-4 rounded-2xl">
                <p className="text-white/80 text-center">
                    Showing {paginatedItems.length} of {totalItems} submissions
                    {searchTerm && ` matching "${searchTerm}"`}
                    {archivedCount > 0 && !showArchived && ` (${archivedCount} archived)`}
                </p>
            </div>

            {/* Submissions Cards */}
            <div className="space-y-6">
                {paginatedItems.length === 0 ? (
                    <div className="text-center py-12 glass-container rounded-3xl">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                            <Filter className="w-10 h-10 text-white/40" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No submissions found</h3>
                        <p className="text-white/60">
                            {searchTerm ? 'Try adjusting your search terms or filters.' : 'No submissions have been made yet.'}
                        </p>
                    </div>
                ) : (
                    paginatedItems.map((sub) => (
                        <div key={sub.id} className={`glass-container p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 ${
                            isCompactView ? 'p-4' : 'p-6'
                        }`}>
                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Main Content */}
                                <div className="flex-1 space-y-4">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{sub.title}</h3>
                                            <p className="text-white/70">by {sub.internName}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge 
                                                variant={sub.status === 'approved' ? 'default' : sub.status === 'pending' ? 'secondary' : 'destructive'}
                                                className="capitalize"
                                            >
                                                {sub.status.replace('_', ' ')}
                                            </Badge>
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium">
                                                {sub.domain}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {sub.description && !isCompactView && (
                                        <p className="text-white/80">{sub.description}</p>
                                    )}

                                    {/* Files & Links */}
                                    {(sub.fileDetails?.length || sub.links?.length) && !isCompactView && (
                                        <div className="space-y-2">
                                            {sub.fileDetails?.map(file => (
                                                <a 
                                                    key={file.id} 
                                                    href={getFileUrl(file.id)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium"
                                                >
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                    <span className="truncate">{file.name}</span>
                                                </a>
                                            ))}
                                            {sub.links?.map((link, i) => (
                                                <a 
                                                    key={i} 
                                                    href={link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-3 text-emerald-300 hover:text-emerald-200 transition-colors text-sm font-medium"
                                                >
                                                    <LinkIcon size={14} />
                                                    <span className="truncate">{link}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="xl:w-80 space-y-4">
                                    {/* Status */}
                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Status</label>
                                        <select 
                                            value={sub.status} 
                                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value as Submission['status'])} 
                                            className="w-full p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark]"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="revision_needed">Needs Revision</option>
                                        </select>
                                    </div>

                                    {/* Points */}
                                    <div>
                                        <label className="block text-white/70 text-sm font-medium mb-2">Points</label>
                                        <input 
                                            type="number" 
                                            defaultValue={sub.points} 
                                            onBlur={(e) => handleUpdatePoints(sub.id, parseInt(e.target.value))} 
                                            className="w-full p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="0"
                                        />
                                    </div>

                                    {/* Feedback */}
                                    {!isCompactView && (
                                        <div>
                                            <label className="block text-white/70 text-sm font-medium mb-2">Feedback</label>
                                            <textarea 
                                                defaultValue={sub.feedback || ''} 
                                                onBlur={(e) => handleUpdateFeedback(sub.id, e.target.value)} 
                                                className="w-full p-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                                                rows={3}
                                                placeholder="Add feedback..."
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <button 
                                        onClick={() => handleViewLogs(sub)} 
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                                    >
                                        <History size={16} /> View Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>            {/* Pagination */}
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    totalItems={totalItems}
                    isCompactView={isCompactView}
                    onToggleView={() => setIsCompactView(!isCompactView)}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
            )}{/* Logs Modal */}
            {viewingLogsFor && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-6"
                    onClick={() => setViewingLogsFor(null)}
                >
                    <div 
                        className="glass-container-2 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-8 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-white">Edit History</h3>
                            <p className="text-white/70 mt-2">for "{viewingLogsFor.title}"</p>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {logsLoading ? (
                                <div className="text-center">
                                    <div className="animate-pulse">
                                        <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4"></div>
                                        <div className="h-4 bg-white/20 rounded-lg w-40 mx-auto"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentLogs.length > 0 ? (
                                        currentLogs.map(log => (
                                            <div key={log.id} className="p-5 bg-black/20 rounded-2xl border border-white/10">
                                                <p className="font-semibold text-white mb-2">{log.action}</p>
                                                <p className="text-white/60 text-sm">
                                                    by <span className="font-medium text-white/90">{log.actorName}</span> at{' '}
                                                    <span className="font-mono text-white/90">{new Date(log.timestamp.seconds * 1000).toLocaleString()}</span>
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-20 h-20 bg-black/20 rounded-3xl mx-auto mb-5 flex items-center justify-center border border-white/10">
                                                <History className="w-9 h-9 text-white/40" />
                                            </div>
                                            <p className="text-white/60">No edit history found for this submission.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="bg-black/30 px-8 py-6 rounded-b-3xl text-right border-t border-white/10">
                             <button 
                                onClick={() => setViewingLogsFor(null)} 
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}