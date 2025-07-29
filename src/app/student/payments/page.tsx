
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
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PaymentHistory {
  id: string;
  paymentDate: string;
  bookingId: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
  roomNumber?: string;
  hostelName?: string;
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ fullName: string, studentId: string } | null>(null);

  const fetchPaymentHistory = async (user: any) => {
    setIsLoading(true);
    try {
      // Fetch user info
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserInfo(userDocSnap.data() as { fullName: string, studentId: string });
      }

      // Fetch payments
      const q = query(
        collection(db, 'payments'), 
        where('studentUid', '==', user.uid),
        orderBy('paymentDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const historyPromises = querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let roomNumber = 'N/A';
        let hostelName = 'N/A';

        // Fetch associated booking to get room details
        if (data.bookingId) {
          const bookingRef = doc(db, 'bookings', data.bookingId);
          const bookingSnap = await getDoc(bookingRef);
          if (bookingSnap.exists()) {
            const bookingData = bookingSnap.data();
            roomNumber = bookingData.roomNumber;
            hostelName = bookingData.hostelName;
          }
        }

        return {
          id: docSnap.id,
          paymentDate: new Date(data.paymentDate).toLocaleDateString(),
          bookingId: data.bookingId,
          amount: data.amount,
          status: data.status,
          roomNumber,
          hostelName,
        };
      });

      const history = await Promise.all(historyPromises);
      setPayments(history);
    } catch (error) {
      console.error("Error fetching payment history: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your payment history. Check Firestore rules.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchPaymentHistory(user);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [toast]);

  const handleGenerateReceipt = (payment: PaymentHistory) => {
    if (!userInfo) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user information for receipt.' });
      return;
    }
    
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Receipt", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Hostel: ${payment.hostelName || 'N/A'}`, 105, 30, { align: 'center' });


    // Student Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 20, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(userInfo.fullName, 20, 58);
    doc.text(`Student ID: ${userInfo.studentId}`, 20, 64);

    // Payment Details
    doc.text(`Receipt #: ${payment.id}`, 180, 58, { align: 'right' });
    doc.text(`Payment Date: ${payment.paymentDate}`, 180, 64, { align: 'right' });


    // Table
    (doc as any).autoTable({
      startY: 80,
      head: [['Description', 'Amount']],
      body: [
        [`Hostel Fee for Room ${payment.roomNumber}`, `GHS ${payment.amount.toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;

    // Total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 140, finalY + 15);
    doc.text(`GHS ${payment.amount.toFixed(2)}`, 180, finalY + 15, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for your payment!", 105, finalY + 40, { align: 'center' });
    doc.text("AccraHostelConnect", 105, finalY + 45, { align: 'center' });


    doc.save(`receipt-${payment.id}.pdf`);
  };

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
              <TableHead>Payment ID</TableHead>
              <TableHead>Booking ID</TableHead>
              <TableHead>Payment Date</TableHead>
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
                    <TableCell className="truncate max-w-[100px]">{payment.bookingId}</TableCell>
                    <TableCell>{payment.paymentDate}</TableCell>
                    <TableCell>{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "Paid" ? "default" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {payment.status === "Paid" ? (
                            <Button variant="outline" size="sm" onClick={() => handleGenerateReceipt(payment)}>
                                <Download className="mr-2 h-4 w-4" /> Receipt
                            </Button>
                        ) : (
                             <Button size="sm">Pay Now</Button>
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
