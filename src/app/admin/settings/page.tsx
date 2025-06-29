'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  hostelName: z.string().min(3, "Hostel name is required."),
  location: z.string().min(3, "Location is required."),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Please enter a valid phone number."),
  email: z.string().email(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: '',
            hostelName: '',
            location: '',
            phone: '',
            email: '',
        },
    });

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    profileForm.reset({
                        fullName: userData.fullName || '',
                        hostelName: userData.hostelName || '',
                        location: userData.location || '',
                        phone: userData.phone || '',
                        email: user.email || '',
                    });
                }
                 setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [profileForm]);

    async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
        const user = auth.currentUser;
        if (!user) {
            toast({ variant: "destructive", title: "Not authenticated" });
            return;
        }
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                fullName: values.fullName,
                hostelName: values.hostelName,
                location: values.location,
                phone: values.phone,
            });
            toast({ title: "Profile Updated", description: "Your information has been saved successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
        const user = auth.currentUser;
        if (!user || !user.email) {
            toast({ variant: "destructive", title: "Authentication Error", description: "User not found." });
            return;
        }
        
        const credential = EmailAuthProvider.credential(user.email, values.currentPassword);

        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, values.newPassword);
            toast({ title: "Password Updated", description: "Your password has been changed successfully." });
            passwordForm.reset();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Password Update Failed", description: "Please check your current password and try again." });
        }
    }

    if (isLoading) {
        return (
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-28 mt-4" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-36 mt-4" />
                    </CardContent>
                </Card>
            </div>
        );
    }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Hostel Manager Profile</CardTitle>
                <CardDescription>Manage your hostel manager account settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-lg">
                        <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={profileForm.control} name="hostelName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hostel Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={profileForm.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                         )} />
                        <FormField control={profileForm.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input type="tel" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={profileForm.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} disabled />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Change Password</CardTitle>
                <CardDescription>Update your password. Make sure it's a strong one.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-lg">
                        <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
