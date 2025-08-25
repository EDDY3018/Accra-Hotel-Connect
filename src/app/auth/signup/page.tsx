
'use client';

import Link from "next/link"
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HostelIcon } from "@/components/icons"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

const studentIdRegex = new RegExp(/^01(21|22|23|24|25)\d{4}[bhdBHD]$/);

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, { message: "Please enter a valid phone number." }),
  studentId: z.string().regex(studentIdRegex, { message: "Invalid Student ID format." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});


export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", phone: "", studentId: "", email: "", password: "", confirmPassword: "" },
  });
  
  const { isSubmitting } = form.formState;

  const createUserProfile = async (user: User, additionalData: any) => {
    const db = getFirebaseDb();
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || additionalData.fullName,
            role: 'student',
            ...additionalData
        });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const auth = getFirebaseAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await createUserProfile(userCredential.user, { fullName: values.fullName, phone: values.phone, studentId: values.studentId });
      toast({ title: "Account Created", description: "You have been successfully signed up." });
      router.push("/student/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    }
  }

  return (
    <>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <HostelIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+233 12 345 6789" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="studentId" render={({ field }) => (
                <FormItem><FormLabel>Student ID</FormLabel><FormControl><Input placeholder="e.g., 01241234B" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating Account..." : "Create an account"}</Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline">Login</Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
