'use client';

import { useAuth } from '@/context/AuthContext';
import Header from '@/components/dashboard/Header';
import SubmissionForm from '@/components/dashboard/SubmissionForm'; // For interns
import AdminView from '@/components/dashboard/AdminView';       // For admins
import { Toaster } from 'sonner';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Show a loading state while we verify the user's role
  if (loading) {
    return (
        <div className="bg-gray-50 min-h-screen">
            <Header title="Dashboard" />
            <div className="p-6 text-center">Verifying user...</div>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster richColors position="top-center" />
      {/* The Header component is now included and will provide navigation */}
      
      {/* Logic to display the correct component based on user role */}
      {user?.role === 'intern' && (
        <>
            <Header title="Submit Task" />
            <main className="p-4 sm:p-6">
                <SubmissionForm />
            </main>
        </>
      )}

      {(user?.role === 'admin' || user?.role === 'super-admin') && (
        <>
            <Header title="Review Submissions" />
            <main className="p-4 sm:p-6">
                <AdminView />
            </main>
        </>
      )}

       {/* Fallback for users with no role or unexpected roles */}
      {!user?.role && !loading && (
          <div className="p-6 text-center text-red-500">
              Could not determine your role. Please contact support.
          </div>
      )}
    </div>
  );
}