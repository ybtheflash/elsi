'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { storage, ID } from '@/lib/appwrite';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function SubmissionForm() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: any) => {
    if (!user || user.role !== 'intern') return;
    setLoading(true);
    toast.loading('Submitting your task...');    try {
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
        links: data.links.split(',').map((link: string) => link.trim()),
        fileDetails: uploadedFileDetails, // Use this instead of fileIds
        fileIds: uploadedFileDetails.map(file => file.id), // Keep for backward compatibility
        status: 'pending', // pending, approved, revision_needed
        points: 0,
        submittedAt: serverTimestamp(),
      });

      toast.success('Task submitted successfully!');
      reset();
      setFiles([]);    } catch (error: any) {
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
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Submit Weekly Task</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label>Submission Title</label>
          <input {...register('title', { required: true })} className="w-full mt-1 border p-2 rounded" />
        </div>
        <div>
          <label>Select Your Domain</label>
          <select {...register('domain', { required: true })} className="w-full mt-1 border p-2 rounded">
            {user?.domain?.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
         <div>
          <label>Week Ending On (Select Friday)</label>
          <input type="date" {...register('week', { required: true })} className="w-full mt-1 border p-2 rounded" />
        </div>
        <div>
          <label>Description</label>
          <textarea {...register('description')} rows={4} className="w-full mt-1 border p-2 rounded"></textarea>
        </div>
        <div>
          <label>Relevant Links (comma-separated)</label>
          <input {...register('links')} className="w-full mt-1 border p-2 rounded" />
        </div>
        <div>
          <label>Attach Files</label>
          <input type="file" multiple onChange={handleFileChange} className="w-full mt-1" />
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white font-bold rounded disabled:bg-green-300">
          {loading ? 'Submitting...' : 'Submit Task'}
        </button>
      </form>
    </div>
  );
}