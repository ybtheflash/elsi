'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Toaster, toast } from 'sonner';
import Link from 'next/link';
import { Mail } from 'lucide-react';

// Schema for form validation
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true);

    // 1. Capture the ID of the loading toast
    const toastId = toast.loading('Sending reset link...');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong. Please try again.');
      }
      
      // 2. Use the ID to UPDATE the toast to a success state
      toast.success('If an account exists, a password reset link has been sent to your email.', {
        id: toastId, // This line is the key
      });    } catch (error: any) {
      // 3. Also use the ID to UPDATE the toast to an error state on failure
      let errorMessage = 'Failed to send reset link. Please try again.';
      
      if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        id: toastId, // This line is the key
      });
      
      // Suppress error logging to keep console clean
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-blue-500" />
            <h2 className="mt-4 text-2xl font-bold">Forgot Your Password?</h2>
            <p className="mt-2 text-sm text-gray-600">
                No problem. Enter your email address below and we'll send you a link to reset it.
            </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter your email address"
              {...register('email')} 
              className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2 font-bold text-white bg-blue-600 rounded-md disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
                Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
}