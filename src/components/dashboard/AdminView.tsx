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
    };

    if (loading) return <p className="text-center p-6">Loading submissions...</p>;

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Review Submissions</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Intern</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Details</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Files & Links</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Feedback</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Points</th>
                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {submissions.map((sub) => (
                            <tr key={sub.id}>
                                <td className="px-4 py-3 align-top">{sub.internName}</td>
                                <td className="px-4 py-3 align-top max-w-xs">
                                    <p className="font-bold">{sub.title}</p>
                                    <p className="text-gray-600">{sub.domain}</p>
                                </td>
                                <td className="px-4 py-3 align-top">                                    {sub.fileDetails?.map(file => (
                                        <a 
                                            key={file.id} 
                                            href={getFileUrl(file.id)} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:underline block truncate"
                                        >
                                            {file.name}
                                        </a>
                                    ))}
                                    {sub.links?.map((link, i) => (
                                        <a 
                                            key={i} 
                                            href={link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-green-600 hover:underline block truncate"
                                        >
                                            <LinkIcon size={14} className="inline-block mr-1"/>
                                            {link}
                                        </a>
                                    ))}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <select 
                                        value={sub.status} 
                                        onChange={(e) => handleUpdateStatus(sub.id, e.target.value as Submission['status'])} 
                                        className="p-2 border rounded-md"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="revision_needed">Needs Revision</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <textarea 
                                        defaultValue={sub.feedback || ''} 
                                        onBlur={(e) => handleUpdateFeedback(sub.id, e.target.value)} 
                                        className="w-full text-sm border rounded p-2" 
                                        rows={2}
                                    />
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <input 
                                        type="number" 
                                        defaultValue={sub.points} 
                                        onBlur={(e) => handleUpdatePoints(sub.id, parseInt(e.target.value))} 
                                        className="w-20 text-center border rounded p-2"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center align-top">
                                    <button 
                                        onClick={() => handleViewLogs(sub)} 
                                        className="flex items-center gap-1.5 mx-auto text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        <History size={16} /> Logs
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Logs Modal */}
            {viewingLogsFor && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" 
                    onClick={() => setViewingLogsFor(null)}
                >
                    <div 
                        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-bold">Edit History for "{viewingLogsFor.title}"</h3>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {logsLoading ? (
                                <p>Loading logs...</p>
                            ) : (
                                <ul className="space-y-4">
                                    {currentLogs.length > 0 ? (
                                        currentLogs.map(log => (
                                            <li key={log.id} className="text-sm">
                                                <p className="font-semibold">{log.action}</p>
                                                <p className="text-gray-500">
                                                    by <span className="font-medium text-gray-700">{log.actorName}</span> at {new Date(log.timestamp.seconds * 1000).toLocaleString()}
                                                </p>
                                            </li>
                                        ))
                                    ) : (
                                        <p>No edit history found for this submission.</p>
                                    )}
                                </ul>
                            )}
                        </div>
                        <div className="bg-gray-50 px-4 py-3 text-right">
                             <button 
                                onClick={() => setViewingLogsFor(null)} 
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
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