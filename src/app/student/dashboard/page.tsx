
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, FileWarning, BedDouble, Building, MapPin, Phone, Handshake, XCircle } from "lucide-react";
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

interface RoomInfo {
  id: string;
  roomNumber: string;
  name: string;
}

interface ManagerInfo {
    hostelName: string;
    location: string;
    phone: string;
}

interface PaymentInfo {
  balance: number;
  dueDate: string;
  bookingId: string | null;
  managerInfo: ManagerInfo | null;
}

export default function StudentDashboardPage() {
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [managerInfo, setManagerInfo] = useState<{ name: string; hostel: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  
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
            let fetchedManagerInfo: ManagerInfo | null = null;
            if(userData.outstandingBalance > 0 || userData.roomId) {
              const bookingsQuery = query(
                collection(db, "bookings"), 
                where("studentUid", "==", user.uid), 
                where("status", "in", ["Unpaid", "Paid"]),
                limit(1)
              );
              const querySnapshot = await getDocs(bookingsQuery);
              if (!querySnapshot.empty) {
                  const bookingDoc = querySnapshot.docs[0];
                  const bookingData = bookingDoc.data();
                  bookingId = bookingDoc.id;
                  const managerDocRef = doc(db, 'users', bookingData.managerUid);
                  const managerDoc = await getDoc(managerDocRef);
                  if (managerDoc.exists()) {
                      const managerData = managerDoc.data();
                      fetchedManagerInfo = {
                          hostelName: managerData.hostelName,
                          location: managerData.location,
                          phone: managerData.phone
                      };
                      setManagerInfo({ name: managerData.fullName, hostel: managerData.hostelName });
                  }
              }
            }

            if (userData.outstandingBalance && userData.outstandingBalance > 0) {
              setPaymentInfo({
                balance: userData.outstandingBalance,
                dueDate: userData.dueDate ? new Date(userData.dueDate).toLocaleDateString() : 'Not specified',
                bookingId: bookingId,
                managerInfo: fetchedManagerInfo,
              });
            } else {
              setPaymentInfo(null);
            }

            if (userData.managerUid) {
                const announcementsQuery = query(
                    collection(db, 'announcements'),
                    where('managerUid', '==', userData.managerUid),
                    where('status', '==', 'Published'),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const announcementsSnapshot = await getDocs(announcementsQuery);
                const fetchedAnnouncements = announcementsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        content: data.content,
                        date: data.createdAt?.toDate().toLocaleDateString() ?? 'N/A',
                        author: data.author,
                    }
                });
                setAnnouncements(fetchedAnnouncements);
                
                 if (!managerInfo && fetchedAnnouncements.length > 0) {
                    const managerDocRef = doc(db, 'users', userData.managerUid);
                    const managerDoc = await getDoc(managerDocRef);
                    if (managerDoc.exists()) {
                        const managerData = managerDoc.data();
                        setManagerInfo({ name: managerData.fullName, hostel: managerData.hostelName });
                    }
                }
            } else {
              setAnnouncements([]);
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
    
  const onPaymentModalClose = () => {
    setIsPaymentModalOpen(false);
    toast({
        title: "Payment Pending",
        description: "Your booking is awaiting payment confirmation from the hostel manager.",
    });
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData();
        } else {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleCancelBooking = async () => {
      const user = auth.currentUser;
      if (!user || !roomInfo || !paymentInfo?.bookingId) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel booking. Information missing.' });
          return;
      }
      if (!cancellationReason.trim()) {
          toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for cancellation.' });
          return;
      }
      setIsCancelling(true);
      try {
          const batch = writeBatch(db);

          // 1. Update booking status
          const bookingRef = doc(db, 'bookings', paymentInfo.bookingId);
          batch.update(bookingRef, { status: 'Cancelled', cancellationReason });

          // 2. Update user profile
          const userRef = doc(db, 'users', user.uid);
          batch.update(userRef, {
              outstandingBalance: 0,
              roomId: null,
              roomNumber: null,
              dueDate: null,
          });

          // 3. Update room status to available
          const roomRef = doc(db, 'rooms', roomInfo.id);
          batch.update(roomRef, { status: 'Available' });

          await batch.commit();
          toast({ title: 'Booking Cancelled', description: 'Your booking has been successfully cancelled.' });
          fetchUserData(); // Refresh data
          setCancellationReason('');
      } catch (error) {
          console.error("Error cancelling booking:", error);
          toast({ variant: 'destructive', title: 'Cancellation Failed', description: 'Could not cancel your booking. See console.' });
      } finally {
          setIsCancelling(false);
      }
  };


  return (
    <>
      <div className="mb-6">
         {isLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-3xl font-bold font-headline">Welcome back, {userName || 'Student'}!</h1>
          )}
          <p className="text-muted-foreground">Here's a summary of your stay.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <BedDouble className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Your Room</h3>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
              <CardFooter>
                 {!isLoading && roomInfo && (
                    <Button asChild size="sm" className="w-fit">
                      <Link href={`/student/rooms/${roomInfo.id}`}>View Details</Link>
                    </Button>
                )}
                 {!isLoading && !roomInfo && (
                    <Button size="sm" asChild className="w-fit">
                      <Link href="/student/rooms">Browse Rooms</Link>
                    </Button>
                )}
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileWarning className="w-6 h-6 text-destructive" />
                  <h3 className="font-semibold">Outstanding Balance</h3>
                </div>
              </CardHeader>
               <CardContent>
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
              </CardContent>
               <CardFooter className="flex flex-col items-start gap-2">
                 {!isLoading && paymentInfo && paymentInfo.balance > 0 && (
                   <>
                    <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full">View Payment Instructions</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-headline">Payment Instructions</DialogTitle>
                          <DialogDescription>
                            Please use the details below to complete your payment. The admin will confirm it shortly after.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-4 rounded-lg border bg-card text-card-foreground">
                              <h4 className="font-semibold mb-2">Hostel Information</h4>
                              <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-3"><Building className="w-4 h-4 text-muted-foreground"/><span>{paymentInfo.managerInfo?.hostelName || 'N/A'}</span></div>
                                  <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-muted-foreground"/><span>{paymentInfo.managerInfo?.location || 'N/A'}</span></div>
                                  <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground"/><span>{paymentInfo.managerInfo?.phone || 'N/A'}</span></div>
                              </div>
                          </div>
                          <div>
                              <Label className="font-semibold">Choose Payment Method:</Label>
                              <RadioGroup defaultValue="momo" className="mt-2 grid grid-cols-2 gap-4">
                                  <div>
                                      <RadioGroupItem value="momo" id="momo" className="peer sr-only" />
                                      <Label htmlFor="momo" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                          Momo
                                      </Label>
                                  </div>
                                   <div>
                                      <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                                      <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                          Cash
                                      </Label>
                                  </div>
                              </RadioGroup>
                          </div>
                           <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
                             <Handshake className="w-8 h-8 mt-1 text-yellow-600"/>
                             <p className="text-xs">After paying via your selected method, please ensure you receive a confirmation from the hostel manager. Your dashboard will update to "Paid" once the manager confirms the transaction.</p>
                           </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={onPaymentModalClose}>Understood, Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full">Cancel Booking</Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Your Booking?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. You will lose your room reservation. Please state your reason for cancellation below.
                              </AlertDialogDescription>
                               <Textarea 
                                  placeholder="Type your reason here..."
                                  className="mt-4"
                                  value={cancellationReason}
                                  onChange={(e) => setCancellationReason(e.target.value)}
                               />
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCancelBooking} disabled={isCancelling}>
                                  {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                              </AlertDialogAction>
                          </AlertDialogFooter>
                       </AlertDialogContent>
                    </AlertDialog>
                   </>
               )}
              </CardFooter>
            </Card>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="font-headline text-lg">Announcements</CardTitle>
              <CardDescription className="text-xs">General information from the hostel Manager</CardDescription>
            </div>
            <Bell className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <>
                  <Skeleton className="h-6 w-32 mb-2"/>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </>
             ) : managerInfo ? (
                <div className="text-sm font-semibold mb-4 p-2 bg-muted/50 rounded-md">
                    <p>{managerInfo.hostel} <span className="font-normal text-muted-foreground">({managerInfo.name})</span></p>
                </div>
             ) : null }
             <div className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new announcements.</p>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="grid gap-1.5 border-b pb-2 last:border-none">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.title}</p>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
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
