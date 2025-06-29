'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HostelIcon } from "@/components/icons"
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (email === 'admin@hostel.com' && password === 'adminpass') {
      toast({ title: "Admin Login Successful", description: "Redirecting to admin dashboard..." });
      router.push('/admin/dashboard');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        
        if (userData.role === 'student' || userData.role === 'manager') {
            router.push('/student/dashboard');
        } else {
            router.push('/');
        }
      } else {
         toast({
            variant: "destructive",
            title: "Login Error",
            description: "User profile not found.",
        });
      }
    } catch (error: any) {
      toast({
          variant: "destructive",
          title: "Invalid Credentials",
          description: "Please check your email and password.",
      });
    } finally {
        setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'student') {
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        router.push('/student/dashboard');
      } else {
        await auth.signOut();
        toast({
            variant: "destructive",
            title: "No Student Profile Found",
            description: "This Google account is not associated with a student profile. Please sign up first.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Login Failed",
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }


  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <div className="flex justify-center mb-4">
           <HostelIcon className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline text-center">Login to your Account</CardTitle>
        <CardDescription className="text-center">
          Enter your email below to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@hostel.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                href="#"
                className="ml-auto inline-block text-sm underline"
              >
                Forgot your password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password"
              placeholder="studentpass"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? 'Please wait...' : 'Login with Google'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="underline">
            Sign up as a Student
          </Link>
           {" or "}
          <Link href="/auth/manager-signup" className="underline">
            as a Manager
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
