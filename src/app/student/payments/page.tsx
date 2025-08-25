
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
import { Download, Loader2, Building, MapPin, Phone, Handshake } from "lucide-react"
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
import { User } from 'firebase/auth';

interface Transaction {
  id: string;
  displayId: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending';
  type: 'Payment' | 'Booking';
  hostelName?: string;
  roomNumber?: string;
  managerInfo?: {
    hostelName: string;
    location: string;
    phone: string;
  }
}

export default function PaymentsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ fullName: string, studentId: string } | null>(null);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  useEffect(() => {
    const fetchPaymentData = async (user: User) => {
      setIsLoading(true);
      try {
        // Get user info
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserInfo(userDocSnap.data() as { fullName: string, studentId: string });
        }

        // Fetch confirmed payments
        const paymentsQuery = query(
          collection(db, 'payments'), 
          where('studentUid', '==', user.uid),
          orderBy('paymentDate', 'desc')
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const confirmedPaymentsPromises = paymentsSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let roomNumber = 'N/A', hostelName = 'N/A';
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
            displayId: docSnap.id,
            date: new Date(data.paymentDate.toDate()).toLocaleDateString(),
            amount: data.amount,
            status: 'Paid',
            type: 'Payment',
            roomNumber,
            hostelName,
          } as Transaction;
        });
        const confirmedPayments = await Promise.all(confirmedPaymentsPromises);

        // Fetch pending bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('studentUid', '==', user.uid),
          where('status', '==', 'Unpaid')
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const pendingBookingsPromises = bookingsSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let managerInfo = null;
          if(data.managerUid) {
              const managerDocRef = doc(db, 'users', data.managerUid);
              const managerDoc = await getDoc(managerDocRef);
              if (managerDoc.exists()) {
                  const managerData = managerDoc.data();
                  managerInfo = {
                      hostelName: managerData.hostelName,
                      location: managerData.location,
                      phone: managerData.phone
                  };
              }
          }
          return {
            id: docSnap.id,
            displayId: docSnap.id,
            date: new Date(data.bookingDate).toLocaleDateString(),
            amount: data.price,
            status: 'Pending',
            type: 'Booking',
            roomNumber: data.roomNumber,
            hostelName: data.hostelName,
            managerInfo,
          } as Transaction;
        });
        const pendingBookings = await Promise.all(pendingBookingsPromises);
        
        setTransactions([...pendingBookings, ...confirmedPayments]);

      } catch (error: any) {
        console.error("Error fetching payment history: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your payment history. See console for details.' });
      } finally {
        setIsLoading(false);
      }
    };
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchPaymentData(user);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, db, toast]);

  const handleGenerateReceipt = (payment: Transaction) => {
    if (!userInfo || payment.status !== 'Paid') {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate receipt for this transaction.' });
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Receipt", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Hostel: ${payment.hostelName || 'N/A'}`, 105, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 20, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(userInfo.fullName, 20, 58);
    doc.text(`Student ID: ${userInfo.studentId}`, 20, 64);
    doc.text(`Receipt #: ${payment.id}`, 180, 58, { align: 'right' });
    doc.text(`Payment Date: ${payment.date}`, 180, 64, { align: 'right' });
    (doc as any).autoTable({
      startY: 80,
      head: [['Description', 'Amount']],
      body: [[`Hostel Fee for Room ${payment.roomNumber}`, `GHS ${payment.amount.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
    });
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 140, finalY + 15);
    doc.text(`GHS ${payment.amount.toFixed(2)}`, 180, finalY + 15, { align: 'right' });
    doc.setFontSize(10);
    doc.text("Thank you for your payment!", 105, finalY + 40, { align: 'center' });
    doc.text("AccraHostelConnect", 105, finalY + 45, { align: 'center' });
    doc.save(`receipt-${payment.id}.pdf`);
  };
  
  const onPaymentModalClose = () => {
    toast({
        title: "Payment Pending",
        description: "Your booking is awaiting payment confirmation from the hostel manager.",
    });
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
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
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
            ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No payment history found.</TableCell>
                </TableRow>
            ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium truncate max-w-[100px]">{transaction.displayId}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>Hostel room fee</TableCell>
                    <TableCell>{transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.status === "Paid" ? "default" : "secondary"}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {transaction.status === "Paid" ? (
                            <Button variant="outline" size="sm" onClick={() => handleGenerateReceipt(transaction)}>
                                <Download className="mr-2 h-4 w-4" /> Receipt
                            </Button>
                        ) : (
                             <Dialog onOpenChange={(isOpen) => !isOpen && onPaymentModalClose() }>
                                <DialogTrigger asChild>
                                  <Button size="sm">View Instructions</Button>
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
                                            <div className="flex items-center gap-3"><Building className="w-4 h-4 text-muted-foreground"/><span>{transaction.managerInfo?.hostelName || 'N/A'}</span></div>
                                            <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-muted-foreground"/><span>{transaction.managerInfo?.location || 'N/A'}</span></div>
                                            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground"/><span>{transaction.managerInfo?.phone || 'N/A'}</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="font-semibold">Choose Payment Method:</Label>
                                        <RadioGroup defaultValue="momo" className="mt-2 grid grid-cols-2 gap-4">
                                            <div>
                                                <RadioGroupItem value="momo" id="momo" className="peer sr-only" />
                                                <Label htmlFor="momo" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Momo</Label>
                                            </div>
                                             <div>
                                                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                                                <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Cash</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                     <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md">
                                       <Handshake className="w-8 h-8 mt-1 text-yellow-600"/>
                                       <p className="text-xs">After paying via your selected method, please ensure you receive a confirmation from the hostel manager. Your dashboard will update to "Paid" once the manager confirms the transaction.</p>
                                     </div>
                                  </div>
                                  <DialogFooter>
                                    <DialogTrigger asChild><Button>Understood, Close</Button></DialogTrigger>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
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
