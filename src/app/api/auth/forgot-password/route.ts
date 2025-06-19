import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // This is the core Firebase function to send the email.
        // Firebase handles the email template, the unique link, and the page where the user resets their password.
        await sendPasswordResetEmail(auth, email);

        // For security reasons, we send a success response even if the email doesn't exist.
        // This prevents attackers from guessing which emails are registered.
        return NextResponse.json({ message: 'Password reset email sent successfully.' }, { status: 200 });
    } catch (error: any) {
        // Log error for debugging but don't expose details to client
        console.warn("Forgot Password Error:", error.code || 'Unknown error');
        // Return a generic error to the client
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}