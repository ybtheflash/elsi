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
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/wallpaper.jpg')" }}>
      <Toaster richColors position="top-center" toastOptions={{ style: { zIndex: 9999 } }} />
      <div className="w-full max-w-md p-10 bg-black/10 rounded-2xl shadow-2xl border border-lilac-200 backdrop-blur-md flex flex-col gap-8" style={{ padding: '24px' }}>
        <div className="text-center flex flex-col gap-3">
            <div className="flex items-center justify-center mb-2">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lilac-100 shadow-lg">
                <Mail className="h-10 w-10 text-lilac-500" />
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-lilac-200">Forgot Your Password?</h2>
            <p className="text-base text-lilac-200">
                No problem. Enter your email address below and we'll send you a link to reset it.
            </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="block text-sm font-medium text-lilac-200">Email address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter your email address"
              {...register('email')} 
              className="w-full px-4 py-3 border-2 border-lilac-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lilac-400 focus:border-lilac-400 bg-lilac-50 text-lilac-900 placeholder-lilac-400 transition-all"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 font-bold text-white bg-gradient-to-r from-lilac-500 to-lilac-600 rounded-lg disabled:bg-lilac-300 hover:from-lilac-600 hover:to-lilac-200 transition-all shadow-lilac-200/40"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center pt-2" style={{ paddingBottom: '20px' }}>
            <Link href="/login" className="text-sm font-semibold text-lilac-600 hover:underline transition-colors">
                Back to Login
            </Link>
        </div>
      </div>
    </div>
  );
}