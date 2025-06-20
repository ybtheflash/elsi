'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
  };  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      
      {/* Heading outside the form */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          ELSI 2025 Portal
        </h1>
        <p className="text-lg text-white/80">
          Reset your password to continue
        </p>
      </div>
      
      <div className="max-w-sm glass-card p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-3">
            <div className="flex items-center justify-center mb-2">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 shadow-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Forgot Your Password?</h2>
            <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset it.
            </p>        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">Email address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter your email address"
              {...register('email')} 
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-gray-50 text-gray-800 placeholder-gray-400 transition-all"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2.5 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg disabled:bg-gray-400 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors">
                Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
}