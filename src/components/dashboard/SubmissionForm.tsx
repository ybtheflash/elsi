'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { storage, ID } from '@/lib/appwrite';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';

export default function SubmissionForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const { register, handleSubmit, reset } = useForm();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const taskName = searchParams.get('taskName');
  const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  // Check if user has already submitted for this task
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!user?.uid) {
        setCheckingSubmission(false);
        return;
      }

      // If no taskId, this is a general submission - allow multiple submissions
      if (!taskId) {
        setHasExistingSubmission(false);
        setCheckingSubmission(false);
        return;
      }      try {
        const q = query(
          collection(db, 'submissions'),
          where('internId', '==', user.uid),
          where('taskId', '==', taskId),
          where('status', '==', 'approved') // Only block approved submissions from resubmitting
        );
        
        const querySnapshot = await getDocs(q);
        setHasExistingSubmission(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking existing submission:', error);
        // If there's an error, allow submission to proceed
        setHasExistingSubmission(false);
      } finally {
        setCheckingSubmission(false);
      }
    };

    checkExistingSubmission();
  }, [user?.uid, taskId]);const onSubmit = async (data: any) => {
    if (!user || user.role !== 'intern') return;
    setLoading(true);
    
    // Use a single loading toast that we can dismiss later
    const loadingToastId = toast.loading('Submitting your task...');

    try {
      // 1. Upload files to Appwrite
      const uploadedFileDetails: { id: string, name: string }[] = [];
      for (const file of files) {
        const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
        uploadedFileDetails.push({ id: uploadedFile.$id, name: file.name });
      }

      // 2. Save submission details to Firestore
      await addDoc(collection(db, 'submissions'), {
        internId: user.uid,
        internName: user.displayName,
        domain: data.domain,
        submissionDate: new Date(data.week),
        title: data.title,
        description: data.description,
        links: data.links ? data.links.split(',').map((link: string) => link.trim()).filter(Boolean) : [],
        fileDetails: uploadedFileDetails, // Use this instead of fileIds
        fileIds: uploadedFileDetails.map(file => file.id), // Keep for backward compatibility
        status: 'pending', // pending, approved, revision_needed
        points: 0,
        taskId: taskId || null, // Add the task ID
        taskName: taskName || 'General Submission', // Add the task name
        submittedAt: serverTimestamp(),
      });      // Dismiss loading toast and show success with redirect message
      toast.dismiss(loadingToastId);
      toast.success('Submitted...now redirecting');
      reset();
      setFiles([]);
      
      // Navigate to my-submissions after a short delay
      setTimeout(() => {
        router.push('/dashboard/my-submissions');
      }, 1500);
    } catch (error: any) {
      let errorMessage = 'An error occurred during submission.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to submit tasks.';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message && error.message.includes('storage')) {
        errorMessage = 'File upload failed. Please try again.';
      }
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToastId);
      toast.error(errorMessage);
      
      // Don't log detailed errors to console to keep it clean
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="flex flex-col items-center w-full min-h-[70vh] px-4 md:px-8">
      {taskName && (
        <div className="mb-8 p-6 glass-card border-l-4 border-blue-400 rounded-r-lg w-full max-w-4xl">
          <p className="text-blue-600 text-sm font-medium mb-1">Submitting for task:</p>
          <p className="font-bold text-gray-800 text-xl">{taskName}</p>
        </div>
      )}

      {checkingSubmission ? (
        <div className="w-full max-w-4xl glass-card p-12 md:p-16 lg:p-20 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-700 text-lg">Checking submission status...</p>
          </div>
        </div>
      ) : hasExistingSubmission ? (
        <div className="w-full max-w-4xl glass-card p-12 md:p-16 lg:p-20 text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-3xl mx-auto mb-8 flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-4">Already Submitted</h3>
          <p className="text-gray-600 text-lg mb-8">
            You have already submitted work for this task. To submit new work, please recall your previous submission first from the My Submissions page.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/dashboard/my-submissions')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-semibold"
            >
              Go to My Submissions
            </Button>
            <br />
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3"
            >
              Back to Tasks
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-4xl grid grid-cols-1 gap-10 glass-card p-12 md:p-16 lg:p-20"
        >
        <div>
          <Label htmlFor="title" className="text-gray-800 font-semibold">Submission Title <span className="text-red-600">*</span></Label>
          <Input
            id="title"
            {...register('title', { required: true })}
            placeholder="e.g., Weekly Progress Report - UI Design"
            className="mt-4 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:ring-blue-400"
          />        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Label htmlFor="domain" className="text-gray-800 font-semibold">Select Your Domain <span className="text-red-600">*</span></Label>
            <select
              id="domain"
              {...register('domain', { required: true })}
              className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="">Choose your domain</option>
              {user?.domain?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="week" className="text-gray-800 font-semibold">Week Ending On <span className="text-red-600">*</span></Label>
            <Input
              id="week"
              type="date"
              {...register('week', { required: true })}
              className="mt-2 border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="description" className="text-gray-800 font-semibold">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={5}
            placeholder="Describe your work, methodology, achievements, and any challenges you encountered..."
            className="mt-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
        <div>
          <Label htmlFor="links" className="text-gray-800 font-semibold">Relevant Links <span className="text-xs text-gray-500">(comma-separated)</span></Label>
          <Input
            id="links"
            {...register('links')}
            placeholder="https://github.com/yourproject, https://figma.com/design, https://demo.yoursite.com"
            className="mt-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
        <div>
          <Label className="text-gray-800 font-semibold">Attach Files</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-8 text-center relative hover:border-blue-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-600 text-sm">Drag & drop files here, or click to select</span>
              <span className="text-xs text-gray-500 mt-1">Support for multiple file types</span>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {files.length} file(s) selected: {files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>        <Button type="submit" disabled={loading} className="w-full text-base font-semibold py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
          {loading ? 'Submitting...' : 'Submit Task'}
        </Button>
        </form>
      )}
    </div>
  );
}