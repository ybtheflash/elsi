'use client';

import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import SubmissionForm from '@/components/dashboard/SubmissionForm'; 
import AdminView from '@/components/dashboard/AdminView';       
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  // Show a loading state while we verify the user's role
  if (loading) {
    return (
        <>
            <Header title="Dashboard" />
            <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-md text-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-indigo-600" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h3>
                  <p className="text-gray-600">Please wait while we confirm your credentials...</p>
                </div>
              </div>
            </main>
        </>
    );
  }
  return (
    <>
        {/* Logic to display the correct component based on user role */}
      {user?.role === 'intern' && (
        <>
            <Header title="Submit Your Work" />
            <div className="text-center py-8 px-4">
              <h2 className="text-4xl font-bold text-white mb-3">Task Submission Portal</h2>
              <p className="text-white/80 text-lg">Upload your completed work and track your progress</p>
            </div>
            <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-4xl">
                <SubmissionForm />
              </div>
            </main>
        </>
      )}      {(user?.role === 'admin' || user?.role === 'super-admin') && (
        <>
            <Header title="Admin Dashboard" />
            <div className="text-center py-8 px-4">
              <h2 className="text-4xl font-bold text-white mb-3">Submission Review Center</h2>
              <p className="text-white/80 text-lg">Review, grade, and provide feedback on submissions</p>
            </div>
            <main className="flex-grow p-4 sm:p-8">
              <div className="w-full max-w-7xl mx-auto">
                <AdminView />
              </div>
            </main>
        </>
      )}{/* Fallback for users with no role or unexpected roles */}
      {!user?.role && !loading && (
            <>
            <Header title="Dashboard" />
            <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-md text-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Access Denied</h3>
                  <p className="text-gray-600">Could not determine your role. Please contact support for assistance.</p>
                </div>
              </div>
            </main>
            </>
      )}
    </>
  );
}