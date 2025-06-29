'use client';

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HostelIcon } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        toast({ variant: "destructive", title: "Email required", description: "Please enter your email address." });
        return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for a link to reset your password." });
      setIsSent(true);
    } catch (error: any) {
      toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <div className="flex justify-center mb-4">
           <HostelIcon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline text-center">Forgot Your Password?</CardTitle>
        <CardDescription className="text-center">
          {isSent 
            ? "A reset link has been sent. Please check your email."
            : "No problem. Enter your email and we'll send you a reset link."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSent ? (
            <form onSubmit={handleResetPassword} className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="student@hostel.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
            </form>
        ) : (
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Didn't receive the email? Check your spam folder or try again.</p>
                <Button variant="outline" onClick={() => setIsSent(false)}>Try a different email</Button>
            </div>
        )}
        <div className="mt-4 text-center text-sm">
          <Link href="/auth/login" className="underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
