'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/magicui/shine-border";

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Changed from 6 for simplicity
});

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');
    
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.dismiss(loadingToast);
      toast.success('Signed in successfully! Redirecting...');
      router.push('/dashboard');    } catch (error: any) {
      toast.dismiss(loadingToast);
      
      // Handle specific Firebase auth errors with user-friendly messages
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/timeout') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toast.error(errorMessage);
      
      // Suppress Firebase error logging by not logging the error
      // This prevents confusing technical errors from appearing in the browser console
    } finally {
      setLoading(false);
    }
  };

  // TODO: Add forgot password link and logic
  // <button onClick={() => router.push('/forgot-password')}>Forgot Password?</button>
  return (
    <>
      {/* Back Button - Fixed at top left corner of the viewport */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="btn-main flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back        </Link>
      </div>

      {/* Main content container */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
        <Toaster richColors toastOptions={{ style: { zIndex: 9999 } }} />
        
        {/* Heading outside the form */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            ELSI 2025 Portal
          </h1>
          <p className="text-lg text-white/80">
            Access restricted to ELSI members only
          </p>
        </div>
        
        <Card className="relative overflow-hidden max-w-[450px] w-full bg-transparent border-0">
          <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
          
          <CardContent className="p-10" style={{ padding: '20px' }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3" style={{ paddingBottom: '20px' }}>
                  <Label htmlFor="email" className="text-sm font-medium text-white" style={{ paddingBottom: '5px' }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="h-14 px-6 text-base rounded-xl bg-white/90 backdrop-blur border-white/20 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500" style={{ paddingLeft: '10px' }}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>
                  )}
                </div>
                
                <div className="space-y-3" style={{ paddingBottom: '20px' }}>
                  <Label htmlFor="password" className="text-sm font-medium text-white" style={{ paddingBottom: '5px' }}>Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-14 px-6 text-base rounded-xl bg-white/90 backdrop-blur border-white/20 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500" style={{ paddingLeft: '10px' }}
                    {...register('password')}                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message as string}</p>
                  )}
                </div>
                
                {/* Forgot password link */}
                <div className="text-right" style={{ paddingBottom: '20px' }}>
                  <Link href="/forgot-password" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg transition-all duration-200"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}