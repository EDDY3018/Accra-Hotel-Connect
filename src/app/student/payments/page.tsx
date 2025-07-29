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
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentHistory {
  id: string;
  bookingDate: string;
  roomNumber: string;
  price: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentHistory = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'bookings'), 
        where('studentUid', '==', user.uid),
        orderBy('bookingDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookingDate: new Date(data.bookingDate).toLocaleDateString(),
          roomNumber: data.roomNumber,
          price: data.price,
          status: data.status,
        };
      });
      setPayments(history);
    } catch (error) {
      console.error("Error fetching payment history: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your payment history.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchPaymentHistory();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePayNow = (bookingId: string) => {
    // In a real app, this would redirect to a payment page or open a payment modal
    // For now, it will just show a toast message
    toast({ title: 'Redirecting to Payment', description: 'Please complete your payment on the provider page.' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Booking & Payment History</CardTitle>
        <CardDescription>A record of all your hostel bookings and payment statuses.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Room No.</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Amount (GHS)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex justify-center items-center py-8">
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No payment history found.</TableCell>
                </TableRow>
            ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium truncate max-w-[100px]">{payment.id}</TableCell>
                    <TableCell>{payment.roomNumber}</TableCell>
                    <TableCell>{payment.bookingDate}</TableCell>
                    <TableCell>{payment.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {payment.status === "Paid" ? (
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" /> Receipt
                            </Button>
                        ) : (
                             <Button size="sm" onClick={() => handlePayNow(payment.id)}>Pay Now</Button>
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
