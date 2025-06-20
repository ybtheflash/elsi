'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(loginSchema)
  });

  // Load saved email from cookies on component mount
  useEffect(() => {
    const savedEmail = getCookie('rememberedEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  // Cookie helper functions
  const setCookie = (name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  };
  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const loadingToast = toast.loading('Signing in...');
    
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Handle remember me functionality
      if (rememberMe) {
        setCookie('rememberedEmail', data.email, 30); // Save for 30 days
      } else {
        deleteCookie('rememberedEmail'); // Remove saved email if unchecked
      }
      
      toast.dismiss(loadingToast);
      toast.success('Signed in successfully! Redirecting...');
      router.push('/dashboard');} catch (error: any) {
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
          Back
        </Link>
      </div>      {/* Main content container */}
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
        
        {/* Heading outside the form */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            ELSI 2025 Portal
          </h1>
          <p className="text-lg text-white/80">
            Access restricted to ELSI members only
          </p>
        </div>
        
        <Card className="relative overflow-hidden max-w-[450px] w-full bg-black/30 border-0">
          <ShineBorder shineColor={["#a970ff", "#be94ff", "#d4b8ff"]} />
          
          <CardContent className="p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">              <div className="space-y-6">                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="h-14 px-6 text-base rounded-xl bg-white/95 backdrop-blur border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 placeholder:text-gray-400 text-gray-100"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message as string}</p>
                  )}
                </div>
                  <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="h-14 px-6 text-base rounded-xl bg-white/95 backdrop-blur border-gray-200 focus:border-purple-400 focus:ring-purple-400/20 placeholder:text-gray-400 text-gray-100"
                    {...register('password')}                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password.message as string}</p>
                  )}                </div>
                
                {/* Remember me checkbox */}
                <div className="flex items-center space-x-3">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-white/90 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium text-white/90 cursor-pointer">
                    Remember me
                  </Label>
                </div>
                
                {/* Forgot password link */}
                <div className="text-right">
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