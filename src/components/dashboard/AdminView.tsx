'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storage } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { History, Link as LinkIcon } from 'lucide-react';

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

    // State for the logs modal
    const [viewingLogsFor, setViewingLogsFor] = useState<Submission | null>(null);
    const [currentLogs, setCurrentLogs] = useState<Log[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

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
            </div>
        );
    }    return (
        <div className="w-full glass-container p-8 rounded-3xl">
            <div className="overflow-hidden rounded-2xl border border-white/20">
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-black/20 backdrop-blur-xl">
                        <thead className="bg-black/30">
                            <tr>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Intern</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Files & Links</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Feedback</th>
                                <th className="px-6 py-5 text-left text-sm font-semibold text-white/80 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-5 text-center text-sm font-semibold text-white/80 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-black/20 transition-colors">
                                    <td className="px-6 py-5 align-top text-white font-medium whitespace-nowrap">{sub.internName}</td>
                                    <td className="px-6 py-5 align-top max-w-xs">
                                        <p className="font-bold text-white text-base">{sub.title}</p>
                                        <p className="text-white/70 mt-1 text-sm">{sub.domain}</p>
                                        {sub.description && (
                                            <p className="text-white/60 text-sm mt-2 line-clamp-2">{sub.description}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 align-top space-y-3">
                                        {sub.fileDetails?.map(file => (
                                            <a 
                                                key={file.id} 
                                                href={getFileUrl(file.id)} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-3 text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium"
                                            >
                                                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full flex-shrink-0"></div>
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
                                                <LinkIcon size={16} className="flex-shrink-0"/>
                                                <span className="truncate">{link}</span>
                                            </a>
                                        ))}
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <select 
                                            value={sub.status} 
                                            onChange={(e) => handleUpdateStatus(sub.id, e.target.value as Submission['status'])} 
                                            className="p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm [color-scheme:dark]"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="revision_needed">Needs Revision</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <textarea 
                                            defaultValue={sub.feedback || ''} 
                                            onBlur={(e) => handleUpdateFeedback(sub.id, e.target.value)} 
                                            className="w-full p-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-lg backdrop-blur-sm"
                                            rows={3}
                                            placeholder="Add feedback..."
                                        />
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <input 
                                            type="number" 
                                            defaultValue={sub.points} 
                                            onBlur={(e) => handleUpdatePoints(sub.id, parseInt(e.target.value))} 
                                            className="w-24 text-center p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="0"
                                        />
                                    </td>
                                    <td className="px-6 py-5 text-center align-top">
                                        <button 
                                            onClick={() => handleViewLogs(sub)} 
                                            className="flex items-center gap-2 mx-auto px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 rounded-xl font-medium transition-all duration-200 hover:scale-105 text-sm backdrop-blur-sm"
                                        >
                                            <History size={16} /> View Logs
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>            {/* Logs Modal */}
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