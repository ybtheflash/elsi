'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import { db } from '@/lib/firebase';
import { storage, ID } from '@/lib/appwrite'; // For attachments
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { toast, Toaster } from 'sonner';

type Intern = { uid: string; displayName: string; domain: string[]; studentClass: string; };
type FormData = {
    taskName: string;
    domain: 'Content Writing' | 'Video Editing' | 'Social Media Management' | 'General';
    description: string;
    instructions: string;
    links: string;
    maxPoints: number;
    assignedTo: string[];
};

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export default function AllotTaskPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const { register, handleSubmit, control, watch, setValue, reset } = useForm<FormData>({ defaultValues: { assignedTo: [] }});

    // Protect route for admins
    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'super-admin') {
            toast.error("Access Denied");
            router.push('/dashboard');
        }
    }, [user, router]);
      // Fetch all interns to populate checkboxes
    useEffect(() => {
        const fetchInterns = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'intern'));
                const querySnapshot = await getDocs(q);
                const internList = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Intern));
                setInterns(internList);
            } catch (error) {
                console.warn('Failed to fetch interns:', error);
                toast.error('Failed to load intern list. Please refresh the page.');
                setInterns([]); // Set empty array as fallback
            }
        };
        fetchInterns();
    }, []);

    const selectedDomain = watch('domain');

    const selectByDomain = () => {
        if (!selectedDomain || selectedDomain === 'General') {
            const allInternIds = interns.map(i => i.uid);
            setValue('assignedTo', allInternIds);
        } else {
            const domainInternIds = interns.filter(i => i.domain.includes(selectedDomain)).map(i => i.uid);
            setValue('assignedTo', domainInternIds);
        }
    };    const onSubmit = async (data: FormData) => {
        // Validate required fields
        if (!data.taskName?.trim()) {
            toast.error("Task name is required.");
            return;
        }
        
        if (!data.description?.trim()) {
            toast.error("Task description is required.");
            return;
        }
        
        if (!data.assignedTo || data.assignedTo.length === 0) {
            toast.error("Please assign the task to at least one intern.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Allotting task...");

        try {
            // 1. Upload attachments
            const uploadedAttachments = [];
            for (const file of attachments) {
                const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
                uploadedAttachments.push({ name: file.name, fileId: uploadedFile.$id });
            }
            
            // 2. Create task document in Firestore
            await addDoc(collection(db, 'tasks'), {
                ...data,
                links: data.links ? data.links.split(',').map(l => l.trim()).filter(Boolean) : [],
                attachments: uploadedAttachments,
                assignedBy: user?.displayName,
                createdAt: serverTimestamp()
            });
            
            toast.success("Task allotted successfully!", { id: toastId });
            
            // Reset form after successful submission
            reset(); // This clears all form fields (taskName, description, etc.)
            setAttachments([]); // This clears the file input state
        } catch (error: any) {
            let errorMessage = "Failed to allot task.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to create tasks.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please check your connection and try again.";
            } else if (error.message && error.message.includes('storage')) {
                errorMessage = "File upload failed. Please try again.";
            }
            
            toast.error(errorMessage, { id: toastId });
            
            // Don't log detailed errors to console
        } finally {
            setLoading(false);
        }
    };    return (
        <div className="min-h-screen bg-black/90 text-white">
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
            <Header title="Allot New Task" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">Create New Task</h2>
                <p className="text-white/80 text-lg">Fill in the details below to assign a new task to interns.</p>
            </div>
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className="glass-container p-8 sm:p-10 md:p-12 space-y-10 rounded-3xl">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-lg font-semibold text-white/90 mb-3">Task Name</label>
                                <input 
                                    {...register('taskName', { required: true })} 
                                    className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm"
                                    placeholder="e.g., Weekly Social Media Campaign"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-semibold text-white/90 mb-3">Domain</label>
                                <select 
                                    {...register('domain')} 
                                    className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm [color-scheme:dark]"
                                >
                                    <option value="General">General</option>
                                    <option value="Content Writing">Content Writing</option>
                                    <option value="Video Editing">Video Editing</option>
                                    <option value="Social Media Management">Social Media Management</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-white/90 mb-3">Task Description</label>
                            <textarea 
                                {...register('description')} 
                                rows={6} 
                                className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-lg backdrop-blur-sm"
                                placeholder="Provide a detailed description of the task requirements, objectives, and expected deliverables..."
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-white/90 mb-3">Special Instructions <span className="text-white/50 font-normal">(Optional)</span></label>
                            <textarea 
                                {...register('instructions')} 
                                rows={4} 
                                className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-lg backdrop-blur-sm"
                                placeholder="Any special instructions, tips, or additional notes for the interns..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-lg font-semibold text-white/90 mb-3">Relevant Links <span className="text-white/50 font-normal">(Comma-separated)</span></label>
                                <input 
                                    {...register('links')} 
                                    className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm"
                                    placeholder="https://example.com, https://docs.example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-semibold text-white/90 mb-3">Max Points</label>
                                <select 
                                    {...register('maxPoints', { valueAsNumber: true })} 
                                    className="w-full p-5 bg-black/20 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg backdrop-blur-sm [color-scheme:dark]"
                                >
                                    {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(p => 
                                        <option key={p} value={p}>{p} Points</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-white/90 mb-3">Attachments</label>
                            <div className="relative w-full p-6 bg-black/20 border-2 border-dashed border-white/30 rounded-2xl text-center cursor-pointer hover:bg-black/30 transition-all shadow-lg backdrop-blur-sm">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={e => setAttachments(Array.from(e.target.files || []))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <p className="text-white/70">Drag & drop files here, or click to select</p>
                            </div>
                            {attachments.length > 0 && (
                                <div className="mt-4 text-white/80 text-sm">
                                    {attachments.length} file(s) selected: {attachments.map(f => f.name).join(', ')}
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <label className="text-xl font-semibold text-white">Assign To</label>
                                <button 
                                    type="button" 
                                    onClick={selectByDomain} 
                                    className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-2xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-md"
                                >
                                    Select all in '{selectedDomain || 'General'}' domain
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-black/20 rounded-2xl max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent border border-white/10">
                                <Controller
                                    name="assignedTo"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            {interns.map(intern => (
                                                <label key={intern.uid} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl hover:bg-black/30 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        value={intern.uid}
                                                        checked={field.value.includes(intern.uid)}
                                                        onChange={e => {
                                                            const selectedIds = field.value;
                                                            if (e.target.checked) {
                                                                setValue('assignedTo', [...selectedIds, intern.uid]);
                                                            } else {
                                                                setValue('assignedTo', selectedIds.filter(id => id !== intern.uid));
                                                            }
                                                        }}
                                                        className="w-5 h-5 text-indigo-500 bg-black/30 border-white/30 rounded focus:ring-indigo-400 focus:ring-offset-0 focus:ring-2 transition-all"
                                                    />
                                                    <div className="text-white">
                                                        <div className="font-medium">{intern.displayName}</div>
                                                        <div className="text-sm text-white/60">({intern.studentClass})</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </>
                                    )}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-[1.03] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-2xl shadow-green-500/20 disabled:shadow-none"
                        >
                            {loading ? "Creating Task..." : "Create & Assign Task"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}