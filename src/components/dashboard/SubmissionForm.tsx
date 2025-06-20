'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { storage, ID } from '@/lib/appwrite';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';

export default function SubmissionForm() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
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
  const onSubmit = async (data: any) => {
    if (!user || user.role !== 'intern') return;
    setLoading(true);
    toast.loading('Submitting your task...');

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
      });

      toast.success('Task submitted successfully!');
      reset();
      setFiles([]);
    } catch (error: any) {
      let errorMessage = 'An error occurred during submission.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to submit tasks.';
      } else if (error.code === 'network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message && error.message.includes('storage')) {
        errorMessage = 'File upload failed. Please try again.';
      }
      
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
        </div>
        <Button type="submit" disabled={loading} className="w-full text-base font-semibold py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
          {loading ? 'Submitting...' : 'Submit Task'}
        </Button>
      </form>
    </div>
  );
}