
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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

interface Booking {
  id: string;
  studentName: string;
  studentUid: string;
  roomNumber: string;
  bookingDate: string;
  price: number;
  status: 'Paid' | 'Unpaid' | 'Completed' | 'Cancelled';
}

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const fetchBookings = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'bookings'),
        where('managerUid', '==', user.uid),
        orderBy('bookingDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              studentName: data.studentName,
              studentUid: data.studentUid,
              roomNumber: data.roomNumber,
              bookingDate: new Date(data.bookingDate).toLocaleDateString(),
              price: data.price,
              status: data.status,
          }
      });
      setBookings(fetchedBookings);
    } catch (error: any) {
      console.error("Error fetching bookings: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error Fetching Bookings', 
        description: 'Could not fetch bookings. See console for details.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (booking: Booking) => {
    setIsUpdating(booking.id);
    try {
      const batch = writeBatch(db);

      // Update booking status
      const bookingRef = doc(db, 'bookings', booking.id);
      batch.update(bookingRef, { status: 'Paid' });

      // Update user's outstanding balance
      const userRef = doc(db, 'users', booking.studentUid);
      batch.update(userRef, { outstandingBalance: 0 });
      
      // Create payment record
      const paymentRef = doc(collection(db, 'payments'));
      batch.set(paymentRef, {
        studentUid: booking.studentUid,
        bookingId: booking.id,
        amount: booking.price,
        paymentDate: serverTimestamp(),
        status: 'Paid',
        paymentMethod: 'Confirmed by Admin'
      });
      
      const roomRef = doc(db, 'rooms', booking.id.split('_')[1]);
      batch.update(roomRef, { status: 'Occupied' });

      await batch.commit();
      toast({
        title: 'Payment Confirmed!',
        description: `${booking.studentName}'s booking has been marked as paid.`
      });
      fetchBookings(); // Refresh the data
    } catch (error) {
      console.error("Error marking as paid: ", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the booking status.'
      });
    } finally {
      setIsUpdating(null);
    }
  }

   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchBookings();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Booking History</CardTitle>
        <CardDescription>View and manage all room bookings.</CardDescription>
        <div className="flex items-center gap-2 pt-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." className="pl-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Room No.</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                         <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : bookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No bookings found for your hostel.</TableCell>
                </TableRow>
            ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium truncate max-w-[150px]">{booking.id}</TableCell>
                    <TableCell>{booking.studentName}</TableCell>
                    <TableCell>{booking.roomNumber}</TableCell>
                    <TableCell>{booking.bookingDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        booking.status === "Paid" ? "default" 
                        : booking.status === "Completed" ? "secondary" 
                        : booking.status === "Unpaid" ? "destructive"
                        : "outline"
                      }>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.status === 'Unpaid' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button size="sm" disabled={isUpdating === booking.id}>
                              {isUpdating === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Mark as Paid
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this booking as paid? This will clear the student's outstanding balance and mark the room as occupied. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleMarkAsPaid(booking)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
