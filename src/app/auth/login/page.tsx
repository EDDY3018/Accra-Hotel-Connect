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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();

    // For prototype purposes, we'll use hardcoded credentials.
    // Admin: admin@hostel.com / adminpass
    // Student: student@hostel.com / studentpass
    
    if (email === 'admin@hostel.com' && password === 'adminpass') {
      toast({ title: "Login Successful", description: "Redirecting to admin dashboard..." });
      router.push('/admin/dashboard');
    } else if (email === 'student@hostel.com' && password === 'studentpass') {
       toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
       router.push('/student/dashboard');
    } else {
      toast({
          variant: "destructive",
          title: "Invalid Credentials",
          description: "Please check your email and password.",
      });
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
              placeholder="admin@hostel.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="adminpass"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
          <Button variant="outline" className="w-full" type="button">
            Login with Google
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
