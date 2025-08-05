
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
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  studentName: string;
  roomNumber: string;
  bookingDate: string;
  status: 'Paid' | 'Unpaid' | 'Completed';
}

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
              roomNumber: data.roomNumber,
              bookingDate: new Date(data.bookingDate).toLocaleDateString(),
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

   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchBookings();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Bookings</CardTitle>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                         <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : bookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No bookings found for your hostel.</TableCell>
                </TableRow>
            ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium truncate max-w-[150px]">{booking.id}</TableCell>
                    <TableCell>{booking.studentName}</TableCell>
                    <TableCell>{booking.roomNumber}</TableCell>
                    <TableCell>{booking.bookingDate}</TableCell>
                    <TableCell>
                      <Badge variant={booking.status === "Paid" ? "default" : booking.status === "Completed" ? "secondary" : "destructive"}>
                        {booking.status}
                      </Badge>
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
