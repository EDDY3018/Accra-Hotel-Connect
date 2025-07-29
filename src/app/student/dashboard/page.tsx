
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, FileWarning, BedDouble } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const announcements: any[] = [];

interface RoomInfo {
  id: string;
  roomNumber: string;
  name: string;
}

interface PaymentInfo {
  balance: number;
  dueDate: string;
  bookingId: string | null;
}

export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const fetchUserData = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = userData.fullName || '';
            setUserName(fullName.split(' ')[0]);

            if (userData.roomId) {
              const roomDocRef = doc(db, 'rooms', userData.roomId);
              const roomDoc = await getDoc(roomDocRef);
              if (roomDoc.exists()) {
                const roomData = roomDoc.data();
                setRoomInfo({
                  id: roomDoc.id,
                  roomNumber: roomData.roomNumber || 'N/A',
                  name: roomData.name || 'Room details not found'
                });
              }
            } else {
              setRoomInfo(null);
            }
            
            let bookingId = null;
            if(userData.outstandingBalance > 0 && userData.roomId) {
              const bookingsQuery = query(collection(db, "bookings"), where("studentUid", "==", user.uid), where("status", "==", "Unpaid"));
              const querySnapshot = await getDocs(bookingsQuery);
              if (!querySnapshot.empty) {
                  bookingId = querySnapshot.docs[0].id;
              }
            }

            if (userData.outstandingBalance && userData.outstandingBalance > 0) {
              setPaymentInfo({
                balance: userData.outstandingBalance,
                dueDate: userData.dueDate ? new Date(userData.dueDate).toLocaleDateString() : 'Not specified',
                bookingId: bookingId,
              });
            } else {
              setPaymentInfo(null);
            }
          }
        } catch (error: any) {
            console.error("Error fetching user data:", error);
            toast({ variant: 'destructive', title: 'Error loading dashboard', description: 'Could not fetch your data. See console for details.' });
        } finally {
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, []);
  
  const handlePayNow = async () => {
    if (!paymentInfo || !paymentInfo.bookingId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active booking found to pay for.' });
      return;
    }
    setIsPaying(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const batch = writeBatch(db);

      const userRef = doc(db, 'users', user.uid);
      batch.update(userRef, { outstandingBalance: 0 });

      const bookingRef = doc(db, 'bookings', paymentInfo.bookingId);
      batch.update(bookingRef, { status: 'Paid' });

      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
          studentUid: user.uid,
          bookingId: paymentInfo.bookingId,
          amount: paymentInfo.balance,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'Simulated Gateway',
          status: 'Paid'
      });
      
      await batch.commit();

      toast({ title: 'Payment Successful!', description: 'Your payment has been recorded.' });
      fetchUserData(); // Refresh data
    } catch (error: any) {
      console.error("Payment simulation failed:", error);
      toast({ variant: 'destructive', title: 'Payment Failed', description: 'Could not process payment. See console for details.' });
    } finally {
      setIsPaying(false);
    }
  };

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
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BedDouble className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Your Room</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : roomInfo ? (
                  <>
                    <p className="text-2xl font-bold">{roomInfo.roomNumber}</p>
                    <p className="text-sm text-muted-foreground">{roomInfo.name}</p>
                  </>
                ) : (
                    <p className="text-sm text-muted-foreground py-2">No room has been assigned to you yet.</p>
                )}
              </div>
              {!isLoading && !roomInfo && (
                  <Button size="sm" asChild className="mt-auto w-fit">
                    <Link href="/student/rooms">Browse Rooms</Link>
                  </Button>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileWarning className="w-6 h-6 text-destructive" />
                  <h3 className="font-semibold">Outstanding Balance</h3>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : paymentInfo && paymentInfo.balance > 0 ? (
                  <>
                    <p className="text-2xl font-bold">GHS {paymentInfo.balance.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Due: {paymentInfo.dueDate}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">You have no outstanding balance. Great job!</p>
                )}
              </div>
               {!isLoading && paymentInfo && paymentInfo.balance > 0 && (
                  <Button size="sm" className="mt-auto w-fit" onClick={handlePayNow} disabled={isPaying}>
                    {isPaying ? 'Processing...' : 'Pay Now'}
                  </Button>
               )}
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

    