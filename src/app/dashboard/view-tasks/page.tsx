'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import { db, auth } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, where, collectionGroup } from 'firebase/firestore';
import { toast } from 'sonner';
import { Edit, Trash2, Loader2, Users, X, Filter, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { PaginationControls, usePagination } from '@/components/ui/pagination';

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
    dueDate?: Date | any; // Firestore timestamp
};

type User = {
    uid: string;
    displayName: string;
    email?: string;
    studentClass?: string;
    domain?: string[];
};

type FormData = Omit<Task, 'id' | 'submissionCount' | 'assignedTo'> & { links: string };

export default function ViewTasksPage() {
    const { user } = useAuth();    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [viewingAssignees, setViewingAssignees] = useState<Task | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();    // Pagination and filtering state
    const [searchTerm, setSearchTerm] = useState('');
    const [domainFilter, setDomainFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'urgent' | 'normal'>('all');

    // Utility function to get due date status
    const getDueDateStatus = (dueDate: any) => {
        if (!dueDate) return { status: 'none', text: '', className: '' };
        
        const due = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
        const today = new Date();
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return {
                status: 'overdue',
                text: `Overdue by ${Math.abs(diffDays)} day(s)`,
                className: 'bg-red-100 text-red-700'
            };
        } else if (diffDays <= 2) {
            return {
                status: 'urgent',
                text: diffDays === 0 ? 'Due today' : `Due in ${diffDays} day(s)`,
                className: 'bg-orange-100 text-orange-700'
            };
        } else {
            return {
                status: 'normal',
                text: `Due in ${diffDays} day(s)`,
                className: 'bg-blue-100 text-blue-700'
            };
        }
    };

    // Get unique domains for filter
    const domains = Array.from(new Set(tasks.map(t => t.domain).filter(Boolean)));

    // Filter tasks based on search term, domain, and due date status
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.domain.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDomain = domainFilter === 'all' || task.domain === domainFilter;
        
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const dueDateStatus = getDueDateStatus(task.dueDate);
            matchesStatus = dueDateStatus.status === statusFilter;
        }
        
        return matchesSearch && matchesDomain && matchesStatus;
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
        totalItems,        archivedCount
    } = usePagination(
        filteredTasks,
        '', // We handle search filtering manually above
        [], // No additional search fields since we handle it manually
        10, // Items per page
        30  // Auto-archive after 30 days (tasks don't really get "archived" but keeping consistent)
    );

    // Generate appropriate empty state message based on filters
    const getEmptyStateMessage = () => {
        const hasFilters = searchTerm || domainFilter !== 'all' || statusFilter !== 'all';
        
        if (!hasFilters && tasks.length === 0) {
            return {
                title: "No Tasks Created Yet",
                description: "Create your first task to get started with managing assignments.",
                icon: Edit
            };
        }
        
        if (hasFilters) {
            let filterDescriptions = [];
            
            if (searchTerm) {
                filterDescriptions.push(`matching "${searchTerm}"`);
            }
            
            if (domainFilter !== 'all') {
                filterDescriptions.push(`in ${domainFilter} domain`);
            }
            
            if (statusFilter !== 'all') {
                const statusLabels = {
                    overdue: 'overdue',
                    urgent: 'due soon',
                    normal: 'with normal due dates'
                };
                filterDescriptions.push(statusLabels[statusFilter]);
            }
            
            const filterText = filterDescriptions.join(' and ');            return {
                title: statusFilter === 'overdue' ? "No Overdue Tasks" : 
                       statusFilter === 'urgent' ? "No Tasks Due Soon" :
                       statusFilter === 'normal' ? "No Tasks with Normal Due Dates" :
                       `No Tasks Found`,
                description: statusFilter === 'overdue' ? "Great! All tasks are on track with no overdue items." :
                           statusFilter === 'urgent' ? "Excellent! No tasks are due soon, giving you breathing room." :
                           `No tasks found ${filterText}. Try adjusting your filters or search terms.`,
                icon: statusFilter === 'overdue' ? CheckCircle : 
                      statusFilter === 'urgent' ? CheckCircle : 
                      statusFilter === 'normal' ? Clock : Filter
            };
        }
        
        return {
            title: "No Tasks Found",
            description: "All tasks have been filtered out. Try adjusting your search or filter criteria.",
            icon: Filter
        };
    };

    const fetchTasksAndSubmissions = useCallback(async () => {
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

            // Fetch all users for assignee display
            const usersQuery = query(collection(db, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const usersList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setAllUsers(usersList);

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
    }, [fetchTasksAndSubmissions]);    const openEditModal = (task: Task) => {
        setEditingTask(task);
        
        // Convert Firestore date to string format for the input
        const dueDateString = task.dueDate 
            ? (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)).toISOString().split('T')[0]
            : '';
            
        reset({
            taskName: task.taskName,
            domain: task.domain,
            description: task.description,
            instructions: task.instructions,
            links: task.links.join(', '),
            maxPoints: task.maxPoints,
            dueDate: dueDateString,
        });
    };const handleEditSubmit = async (data: FormData) => {
        if (!editingTask) return;
        
        // Additional validation
        if (!data.taskName?.trim()) {
            toast.error("Task name is required");
            return;
        }
        
        if (!data.description?.trim()) {
            toast.error("Description is required");
            return;
        }
        
        if (!data.domain) {
            toast.error("Please select a domain");
            return;
        }
        
        if (!data.maxPoints || data.maxPoints <= 0) {
            toast.error("Please select valid points");
            return;
        }

        const toastId = toast.loading("Updating task...");
        try {
            const taskDocRef = doc(db, 'tasks', editingTask.id);            await updateDoc(taskDocRef, {
                taskName: data.taskName.trim(),
                description: data.description.trim(),
                instructions: data.instructions?.trim() || '',
                domain: data.domain,
                maxPoints: data.maxPoints,
                dueDate: new Date(data.dueDate),
                links: data.links ? data.links.split(',').map(l => l.trim()).filter(Boolean) : [],
            });
            toast.success("Task updated successfully!", { id: toastId });
            setEditingTask(null);
            fetchTasksAndSubmissions(); // Refresh data
        } catch (error: any) {
            let errorMessage = "Failed to update task.";
            
            if (error.code === 'permission-denied') {
                errorMessage = "You don't have permission to update this task.";
            } else if (error.code === 'network-request-failed') {
                errorMessage = "Network error. Please check your connection.";
            }
            
            toast.error(errorMessage, { id: toastId });
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
    };

    const getAssigneeNames = (assignedTo: string[]) => {
        return assignedTo
            .map(uid => allUsers.find(user => user.uid === uid)?.displayName || 'Unknown User')
            .filter(Boolean);
    };

    const handleViewAssignees = (task: Task) => {
        setViewingAssignees(task);
    };    if (loading) {
        return (
            <>
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
            </>
        );
    }    return (
        <>
            <Header title="Manage Allotted Tasks" />
            <div className="text-center py-8 px-4">
                <h2 className="text-4xl font-bold text-white mb-3">Manage Allotted Tasks</h2>
                <p className="text-white/80 text-lg">View, edit, or delete existing tasks.</p>
            </div>            <main className="flex-grow p-4 sm:p-8">
                    <div className="w-full max-w-6xl mx-auto">                    {/* Filters */}
                    <div className="glass-container p-6 rounded-3xl mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 flex-1">
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

                                {/* Due Date Status Filter */}
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="p-3 bg-black/20 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm [color-scheme:dark]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="urgent">Due Soon</option>
                                    <option value="normal">Normal</option>                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="glass-container p-4 rounded-2xl mb-8">
                        <p className="text-white/80 text-center">
                            Showing {paginatedItems.length} of {totalItems} tasks
                            {searchTerm && ` matching "${searchTerm}"`}
                        </p>
                    </div>                    {paginatedItems.length === 0 ? (
                        <div className="max-w-lg mx-auto text-center">
                            <div className="glass-card p-16">
                                {(() => {                                    const emptyState = getEmptyStateMessage();
                                    const IconComponent = emptyState.icon;
                                    const isPositiveMessage = statusFilter === 'overdue' || statusFilter === 'urgent';
                                    return (
                                        <>
                                            <div className={`w-20 h-20 ${isPositiveMessage ? 'bg-green-100' : 'bg-indigo-100'} rounded-3xl flex items-center justify-center mx-auto mb-8`}>
                                                <IconComponent className={`w-10 h-10 ${isPositiveMessage ? 'text-green-600' : 'text-indigo-600'}`} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-4">{emptyState.title}</h3>
                                            <p className="text-gray-600 text-lg mb-8">{emptyState.description}</p>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>) : (
                        <div className={isCompactView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-8"}>
                            {paginatedItems.map(task => isCompactView ? (
                                // Compact View
                                <div key={task.id} className="glass-card glass-card-hover transition-all duration-300 p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1 mr-2">
                                            {task.taskName}
                                        </h3>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button 
                                                onClick={() => openEditModal(task)} 
                                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all duration-200"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task.id)} 
                                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all duration-200"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                                {task.domain}
                                            </span>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                                                {task.maxPoints}pt
                                            </span>
                                        </div>
                                        
                                        {task.dueDate && (() => {
                                            const dueDateStatus = getDueDateStatus(task.dueDate);
                                            return (
                                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${dueDateStatus.className}`}>
                                                    {dueDateStatus.text}
                                                </span>
                                            );
                                        })()}
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-indigo-600">
                                                    {task.submissionCount || 0}
                                                </div>
                                                <div className="text-xs text-gray-500">of {task.assignedTo.length}</div>
                                            </div>
                                            <button
                                                onClick={() => handleViewAssignees(task)}
                                                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                                            >
                                                <Users className="w-3 h-3" />
                                                {task.assignedTo.length}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Full View (existing layout)
                                <div key={task.id} className="glass-card glass-card-hover transition-all duration-300 p-8">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-800 mb-3">{task.taskName}</h3>                                            <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-3">
                                                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium">
                                                    {task.domain}
                                                </span>                                                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold">
                                                    {task.maxPoints} Points
                                                </span>
                                                {task.dueDate && (() => {
                                                    const dueDateStatus = getDueDateStatus(task.dueDate);
                                                    return (
                                                        <span className={`px-4 py-2 rounded-xl font-medium ${dueDateStatus.className}`}>
                                                            {dueDateStatus.text}
                                                        </span>
                                                    );
                                                })()}
                                                <button
                                                    onClick={() => handleViewAssignees(task)}
                                                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    {task.assignedTo.length} Assigned
                                                </button>
                                            </div>
                                            {task.description && (
                                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="text-lg font-semibold text-gray-600">
                                                {task.submissionCount || 0} / {task.assignedTo.length} Submitted
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">                                            <div className="text-center">
                                                <div className="text-4xl font-bold text-indigo-600 mb-1">
                                                    {task.submissionCount || 0}
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
                                            </div>                                        </div>
                                    </div>
                                </div>                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {paginatedItems.length > 0 && (
                        <div className="mt-12 flex justify-center">
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
                                showArchiveToggle={false}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal - Rendered at root level for proper overlay */}
            {editingTask && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
                    onClick={() => setEditingTask(null)}
                >                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200"
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <form onSubmit={handleSubmit(handleEditSubmit)}>
                            {/* Header */}
                            <div className="p-8 border-b border-white/10">
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Edit Task</h2>
                                <p className="text-gray-600">Update task details and requirements</p>
                            </div>

                            {/* Form Content */}
                            <div className="p-8 space-y-6">
                                {/* Task Name */}
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                        Task Name <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        {...register('taskName', { 
                                            required: 'Task name is required',
                                            minLength: { value: 3, message: 'Task name must be at least 3 characters' }
                                        })} 
                                        className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                            errors.taskName ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                        }`}
                                        placeholder="Enter task name"
                                    />
                                    {errors.taskName && (
                                        <p className="text-red-500 text-sm mt-1">{errors.taskName.message}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        {...register('description', { 
                                            required: 'Description is required',
                                            minLength: { value: 10, message: 'Description must be at least 10 characters' }
                                        })} 
                                        rows={4} 
                                        className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                                            errors.description ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                        }`}
                                        placeholder="Provide a detailed description of the task"
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                                    )}
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                        Special Instructions <span className="text-gray-500 text-sm font-normal">(Optional)</span>
                                    </label>
                                    <textarea 
                                        {...register('instructions')} 
                                        rows={3} 
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Any special instructions or notes for this task"
                                    />
                                </div>

                                {/* Domain and Points Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Domain Dropdown */}
                                    <div>
                                        <label className="block text-base font-semibold text-gray-700 mb-2">
                                            Domain <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            {...register('domain', { required: 'Please select a domain' })} 
                                            className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all [color-scheme:light] ${
                                                errors.domain ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                            }`}
                                        >
                                            <option value="">Select Domain</option>
                                            <option value="General">General</option>
                                            <option value="Content Writing">Content Writing</option>
                                            <option value="Video Editing">Video Editing</option>
                                            <option value="Social Media Management">Social Media Management</option>
                                        </select>
                                        {errors.domain && (
                                            <p className="text-red-500 text-sm mt-1">{errors.domain.message}</p>
                                        )}
                                    </div>

                                    {/* Max Points Dropdown */}
                                    <div>
                                        <label className="block text-base font-semibold text-gray-700 mb-2">
                                            Max Points <span className="text-red-500">*</span>
                                        </label>
                                        <select 
                                            {...register('maxPoints', { 
                                                required: 'Please select points',
                                                valueAsNumber: true,
                                                validate: value => value > 0 || 'Points must be greater than 0'
                                            })} 
                                            className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all [color-scheme:light] ${
                                                errors.maxPoints ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                            }`}
                                        >
                                            <option value="">Select Points</option>
                                            {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(points => (
                                                <option key={points} value={points}>{points} Points</option>
                                            ))}
                                        </select>                                        {errors.maxPoints && (
                                            <p className="text-red-500 text-sm mt-1">{errors.maxPoints.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="date"
                                        {...register('dueDate', { 
                                            required: 'Please select a due date',
                                            validate: value => {
                                                if (!value) return 'Due date is required';
                                                const selectedDate = new Date(value);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return selectedDate >= today || 'Due date cannot be in the past';
                                            }
                                        })} 
                                        className={`w-full p-4 bg-gray-50 border rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent transition-all [color-scheme:light] ${
                                            errors.dueDate ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                                        }`}
                                        min={new Date().toISOString().split('T')[0]}
                                    />                                    {errors.dueDate && (
                                        <p className="text-red-500 text-sm mt-1">{errors.dueDate.message as string}</p>
                                    )}
                                </div>

                                {/* Links */}
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-2">
                                        Relevant Links <span className="text-gray-500 text-sm font-normal">(Comma-separated)</span>
                                    </label>
                                    <input 
                                        {...register('links')} 
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="https://example.com, https://docs.example.com"
                                    />
                                    <p className="text-gray-500 text-sm mt-1">Separate multiple links with commas</p>
                                </div>

                                {/* Form Validation Summary */}
                                {Object.keys(errors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <h4 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h4>
                                        <ul className="text-red-700 text-sm space-y-1">
                                            {errors.taskName && <li>• {errors.taskName.message}</li>}
                                            {errors.description && <li>• {errors.description.message}</li>}
                                            {errors.domain && <li>• {errors.domain.message}</li>}
                                            {errors.maxPoints && <li>• {errors.maxPoints.message}</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 px-8 py-6 flex flex-col sm:flex-row justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingTask(null)} 
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={Object.keys(errors).length > 0}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                                >
                                    {Object.keys(errors).length > 0 ? 'Fix Errors' : 'Save Changes'}
                                </button>
                            </div>
                        </form>                    </div>
                </div>
            )}

            {/* Assignees Modal */}
            {viewingAssignees && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingAssignees(null)}
                >
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200"
                        onClick={e => e.stopPropagation()}
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">Assigned Users</h3>
                                <p className="text-gray-600 mt-1">for "{viewingAssignees.taskName}"</p>
                            </div>
                            <button 
                                onClick={() => setViewingAssignees(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {viewingAssignees.assignedTo.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-600">No users assigned to this task yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {viewingAssignees.assignedTo.map(uid => {
                                        const user = allUsers.find(u => u.uid === uid);
                                        return (
                                            <div key={uid} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">
                                                        {user?.displayName || 'Unknown User'}
                                                    </p>
                                                    {user?.email && (
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                    )}
                                                    {user?.studentClass && (
                                                        <p className="text-sm text-gray-500">Class: {user.studentClass}</p>
                                                    )}
                                                    {user?.domain && user.domain.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {user.domain.map((d, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                                                                    {d}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-3xl">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Total: {viewingAssignees.assignedTo.length} user(s) assigned
                                </p>
                                <button 
                                    onClick={() => setViewingAssignees(null)} 
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-all duration-200"
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