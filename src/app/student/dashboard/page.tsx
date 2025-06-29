'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, FileWarning, BedDouble } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const announcements: any[] = [];

export default function StudentDashboardPage() {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const fullName = userDoc.data().fullName || '';
            setUserName(fullName.split(' ')[0]);
          }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsLoading(false);
        }
      } else {
        // Handle case where user is not logged in or auth state is not yet available
        // For now, we'll just stop loading. A listener would be more robust.
        setIsLoading(false);
      }
    };

    // Use onAuthStateChanged for robustness
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <CardTitle className="font-headline">Welcome back, {userName || 'Student'}!</CardTitle>
            )}
            <CardDescription>Here's a summary of your stay.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <BedDouble className="w-6 h-6 text-primary" />
                <h3 className="font-semibold">Your Room</h3>
              </div>
              <p className="text-2xl font-bold">B203</p>
              <p className="text-sm text-muted-foreground">Deluxe Single Room</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileWarning className="w-6 h-6 text-destructive" />
                <h3 className="font-semibold">Outstanding Balance</h3>
              </div>
              <p className="text-2xl font-bold">GHS 500.00</p>
              <p className="text-sm text-muted-foreground">Due: 2024-06-01</p>
              <Button size="sm" className="mt-2">Pay Now</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-headline text-lg">Announcements</CardTitle>
            <Bell className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new announcements.</p>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.title}</p>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
