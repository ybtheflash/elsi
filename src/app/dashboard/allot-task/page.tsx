'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/dashboard/Header';
import { db } from '@/lib/firebase';
import { storage, ID } from '@/lib/appwrite'; // For attachments
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { toast } from 'sonner';

type Intern = { uid: string; displayName: string; domain: string[]; studentClass: string; };
type FormData = {
    taskName: string;
    domain: 'Content Writing' | 'Video Editing' | 'Social Media Management' | 'General';
    description: string;
    instructions: string;
    links: string;
    maxPoints: number;
    assignedTo: string[];
    dueDate: string; // ISO date string
};

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export default function AllotTaskPage() {
    const { user } = useAuth();
    const router = useRouter();    const [interns, setInterns] = useState<Intern[]>([]);
    const [loading, setLoading] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({ 
        defaultValues: { 
            assignedTo: [],
            domain: 'General',
            maxPoints: 100
        }
    });

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
        // Enhanced validation - these should be caught by react-hook-form, but keeping as backup
        if (!data.taskName?.trim()) {
            toast.error("Task name is required.");
            return;
        }
        
        if (!data.description?.trim()) {
            toast.error("Task description is required.");
            return;
        }
        
        if (!data.domain) {
            toast.error("Please select a domain.");
            return;
        }
        
        if (!data.maxPoints || data.maxPoints <= 0) {
            toast.error("Please select valid points.");
            return;
        }
        
        if (!data.assignedTo || data.assignedTo.length === 0) {
            toast.error("Please assign the task to at least one intern.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Creating task...");

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
                createdAt: serverTimestamp(),
                dueDate: new Date(data.dueDate) // Convert to Date object for Firestore
            });
              toast.success("Task created and assigned successfully!", { id: toastId });
            
            // Reset form after successful submission but keep some defaults
            reset({
                taskName: '',
                description: '',
                instructions: '',
                links: '',
                domain: 'General',
                maxPoints: 100,
                assignedTo: [],
                dueDate: ''
            });
            setAttachments([]); // This clears the file input state
        } catch (error: any) {
            let errorMessage = "Failed to create task.";
            
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
    };return (
        <div className="min-h-screen bg-black/50 text-white">
            <Header title="Allot New Task" />
            <div className="text-center py-8 px-4">                <h2 className="text-4xl font-bold text-white mb-3">Create New Task</h2>
                <p className="text-white/80 text-lg">Fill in the details below to assign a new task to interns.</p>
            </div>            <main className="p-4 sm:p-6 lg:p-8">                <div className="max-w-6xl mx-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className="glass-container p-8 rounded-3xl">
                        {/* Form header with required fields note */}
                        <div className="mb-8 pb-6 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-white mb-2">Task Details</h3>
                            <p className="text-white/70">
                                Fill in all required fields marked with <span className="text-red-400">*</span> to create a new task.
                            </p>
                        </div><div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">
                                    Task Name <span className="text-red-400">*</span>
                                </label>
                                <input 
                                    {...register('taskName', { 
                                        required: 'Task name is required',
                                        minLength: { value: 3, message: 'Task name must be at least 3 characters' },
                                        validate: value => value.trim().length > 0 || 'Task name cannot be empty'
                                    })} 
                                    className={`w-full p-4 bg-black/20 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm ${
                                        errors.taskName ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-indigo-500'
                                    }`}
                                    placeholder="e.g., Weekly Social Media Campaign"
                                />
                                {errors.taskName && (
                                    <p className="text-red-400 text-sm">{errors.taskName.message}</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">
                                    Domain <span className="text-red-400">*</span>
                                </label>
                                <select 
                                    {...register('domain', { required: 'Please select a domain' })} 
                                    className={`w-full p-4 bg-black/20 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark] ${
                                        errors.domain ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-indigo-500'
                                    }`}
                                >
                                    <option value="General">General</option>
                                    <option value="Content Writing">Content Writing</option>
                                    <option value="Video Editing">Video Editing</option>
                                    <option value="Social Media Management">Social Media Management</option>
                                </select>
                                {errors.domain && (
                                    <p className="text-red-400 text-sm">{errors.domain.message}</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">
                                    Task Description <span className="text-red-400">*</span>
                                </label>
                                <textarea 
                                    {...register('description', { 
                                        required: 'Task description is required',
                                        minLength: { value: 10, message: 'Description must be at least 10 characters' },
                                        validate: value => value.trim().length > 0 || 'Description cannot be empty'
                                    })} 
                                    rows={4} 
                                    className={`w-full p-4 bg-black/20 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none backdrop-blur-sm ${
                                        errors.description ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-indigo-500'
                                    }`}
                                    placeholder="Provide a detailed description of the task requirements..."
                                />
                                {errors.description && (
                                    <p className="text-red-400 text-sm">{errors.description.message}</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">Special Instructions <span className="text-white/50 font-normal text-sm">(Optional)</span></label>
                                <textarea 
                                    {...register('instructions')} 
                                    rows={4} 
                                    className="w-full p-4 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                                    placeholder="Any special instructions or notes..."
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">Relevant Links <span className="text-white/50 font-normal text-sm">(Comma-separated)</span></label>
                                <input 
                                    {...register('links')} 
                                    className="w-full p-4 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="https://example.com, https://docs.example.com"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">
                                    Max Points <span className="text-red-400">*</span>
                                </label>
                                <select 
                                    {...register('maxPoints', { 
                                        required: 'Please select points',
                                        valueAsNumber: true,
                                        validate: value => value > 0 || 'Points must be greater than 0'
                                    })} 
                                    className={`w-full p-4 bg-black/20 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark] ${
                                        errors.maxPoints ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-indigo-500'
                                    }`}
                                >
                                    {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(p => 
                                        <option key={p} value={p}>{p} Points</option>
                                    )}
                                </select>                                {errors.maxPoints && (
                                    <p className="text-red-400 text-sm">{errors.maxPoints.message}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div className="space-y-4">
                                <label className="block text-base font-semibold text-white/90">
                                    Due Date <span className="text-red-400">*</span>
                                </label>
                                <input 
                                    type="date"
                                    {...register('dueDate', { 
                                        required: 'Please select a due date',
                                        validate: value => {
                                            const selectedDate = new Date(value);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return selectedDate >= today || 'Due date cannot be in the past';
                                        }
                                    })} 
                                    className={`w-full p-4 bg-black/20 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark] ${
                                        errors.dueDate ? 'border-red-400 focus:ring-red-500' : 'border-white/20 focus:ring-indigo-500'
                                    }`}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                {errors.dueDate && (
                                    <p className="text-red-400 text-sm">{errors.dueDate.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <label className="block text-base font-semibold text-white/90">Attachments</label>
                            <div className="relative w-full p-6 bg-black/20 border-2 border-dashed border-white/30 rounded-xl text-center cursor-pointer hover:bg-black/30 transition-all backdrop-blur-sm">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={e => setAttachments(Array.from(e.target.files || []))} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <p className="text-white/70">Drag & drop files here, or click to select</p>
                            </div>
                            {attachments.length > 0 && (
                                <div className="text-white/80 text-sm">
                                    {attachments.length} file(s) selected: {attachments.map(f => f.name).join(', ')}
                                </div>
                            )}
                        </div>
                          <div className="mt-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <label className="text-lg font-semibold text-white">
                                    Assign To <span className="text-red-400">*</span>
                                </label>
                                <button 
                                    type="button" 
                                    onClick={selectByDomain} 
                                    className="px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                                >
                                    Select all in '{selectedDomain || 'General'}' domain
                                </button>
                            </div>
                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-5 bg-black/20 rounded-xl max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent border ${
                                errors.assignedTo ? 'border-red-400' : 'border-white/10'
                            }`}>
                                <Controller
                                    name="assignedTo"
                                    control={control}
                                    rules={{ 
                                        required: 'Please assign the task to at least one intern',
                                        validate: value => value.length > 0 || 'At least one intern must be selected'
                                    }}
                                    render={({ field }) => (
                                        <>
                                            {interns.map(intern => (
                                                <label key={intern.uid} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
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
                                                        className="w-4 h-4 text-indigo-500 bg-black/30 border-white/30 rounded focus:ring-indigo-400 focus:ring-offset-0 focus:ring-2 transition-all"
                                                    />
                                                    <div className="text-white">
                                                        <div className="font-medium text-sm">{intern.displayName}</div>
                                                        <div className="text-xs text-white/60">({intern.studentClass})</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </>
                                    )}
                                />
                            </div>
                            {errors.assignedTo && (
                                <p className="text-red-400 text-sm">{errors.assignedTo.message}</p>
                            )}
                            {watch('assignedTo')?.length > 0 && (
                                <p className="text-green-400 text-sm">
                                    ✓ {watch('assignedTo').length} intern(s) selected
                                </p>
                            )}
                        </div>                        <button 
                            type="submit" 
                            disabled={loading || Object.keys(errors).length > 0} 
                            className="w-full mt-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 disabled:shadow-none"
                        >
                            {loading ? "Creating Task..." : Object.keys(errors).length > 0 ? "Please fix errors above" : "Create & Assign Task"}
                        </button>
                        
                        {/* Form validation summary */}
                        {Object.keys(errors).length > 0 && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-400/30 rounded-xl">
                                <h4 className="text-red-400 font-semibold mb-2">Please fix the following errors:</h4>
                                <ul className="text-red-300 text-sm space-y-1">
                                    {errors.taskName && <li>• {errors.taskName.message}</li>}
                                    {errors.description && <li>• {errors.description.message}</li>}
                                    {errors.domain && <li>• {errors.domain.message}</li>}
                                    {errors.maxPoints && <li>• {errors.maxPoints.message}</li>}
                                    {errors.assignedTo && <li>• {errors.assignedTo.message}</li>}
                                </ul>
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}