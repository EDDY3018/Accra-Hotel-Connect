
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDown, PlusCircle, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import Papa from 'papaparse';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDFWithAutoTable;
}

interface Student {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  roomNumber: string;
  outstandingBalance: number;
  totalFee: number;
}

const addStudentSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  studentId: z.string().min(3, "Student ID is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, "Please enter a valid phone number."),
  roomNumber: z.string().min(1, "Room number is required."),
  totalFee: z.preprocess((val) => Number(val), z.number().positive("Total fee must be a positive number.")),
  amountPaid: z.preprocess((val) => Number(val), z.number().min(0, "Amount paid cannot be negative.")),
}).refine((data) => data.amountPaid <= data.totalFee, {
  message: "Amount paid cannot exceed total fee.",
  path: ["amountPaid"],
});

export default function AdminStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const form = useForm<z.infer<typeof addStudentSchema>>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      fullName: '',
      studentId: '',
      email: '',
      phone: '',
      roomNumber: '',
      totalFee: 0,
      amountPaid: 0,
    },
  });

  const fetchStudents = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('managerUid', '==', user.uid),
        where('role', '==', 'student')
      );
      const querySnapshot = await getDocs(studentsQuery);

      const fetchedStudents = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          fullName: data.fullName || 'N/A',
          studentId: data.studentId || 'N/A',
          email: data.email || 'N/A',
          roomNumber: data.roomNumber || 'Unassigned',
          outstandingBalance: data.outstandingBalance || 0,
          totalFee: data.totalFee || 0,
        };
      });
      

      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        variant: 'destructive',
        title: 'Error Fetching students',
        description: 'Could not fetch students. Check console for logs'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchStudents();
      else setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);


  const handleExportCSV = () => {
    const csvData = students.map(({ studentId, fullName, email, roomNumber, outstandingBalance }) => ({
        'Student ID': studentId,
        'Name': fullName,
        'Email': email,
        'Room No.': roomNumber,
        'Outstanding Balance (GHS)': outstandingBalance.toFixed(2),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'students.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    doc.autoTable({
      head: [['Student ID', 'Name', 'Email', 'Room No.', 'Payment Status', 'Outstanding (GHS)']],
      body: students.map((student) => {
        let paymentStatus = 'Paid';
        if (student.outstandingBalance > 0) {
            paymentStatus = 'Partial'; // Or Unpaid if balance equals total fee
        }
        return [
            student.studentId,
            student.fullName,
            student.email,
            student.roomNumber,
            paymentStatus,
            student.outstandingBalance.toFixed(2)
        ]
      }),
    });
    doc.save('students.pdf');
  };
  
  const getPaymentStatus = (balance: number, total: number) => {
    if (balance <= 0) return "Paid";
    if (balance > 0 && balance < total) return "Partial"; 
    return "Unpaid";
  }

  async function onAddStudentSubmit(values: z.infer<typeof addStudentSchema>) {
    const manager = auth.currentUser;
    if (!manager) {
        toast({ variant: "destructive", title: "Not authenticated" });
        return;
    }

    try {
        const studentData = {
            role: 'student',
            managerUid: manager.uid,
            fullName: values.fullName,
            studentId: values.studentId,
            email: values.email,
            phone: values.phone,
            roomNumber: values.roomNumber,
            totalFee: values.totalFee,
            outstandingBalance: values.totalFee - values.amountPaid,
            createdAt: serverTimestamp(),
        };

        const newStudentRef = doc(collection(db, 'users'));
        await setDoc(newStudentRef, studentData);

        toast({ 
            title: "Student Profile Created!",
            description: `${values.fullName} has been added. They can sign up with their email later.`
        });
        
        form.reset();
        setAddStudentOpen(false);
        fetchStudents(); // Refresh the list
    } catch (error: any) {
        console.error("Error adding student:", error);
        toast({ variant: "destructive", title: "Failed to Add Student", description: "Could not save the student profile. See console for details." });
    }
  }
  
  const { isSubmitting } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Students</CardTitle>
        <CardDescription>Manage student information and payment status for your hostel.</CardDescription>
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-8" />
          </div>
          <div className="flex items-center gap-2">
            {students.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <FileDown className="mr-2 h-4 w-4" /> Export
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF}>Export as PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Manually add a student to the system.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onAddStudentSubmit)} id="add-student-form" className="grid gap-4 py-4">
                            <FormField control={form.control} name="fullName" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="studentId" render={({ field }) => (
                                <FormItem><FormLabel>Student ID</FormLabel><FormControl><Input placeholder="e.g., 01241234B" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="student@school.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" placeholder="+233 12 345 6789" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="roomNumber" render={({ field }) => (
                                <FormItem><FormLabel>Room No.</FormLabel><FormControl><Input placeholder="e.g., E501" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="totalFee" render={({ field }) => (
                                    <FormItem><FormLabel>Total Fee (GHS)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                               <FormField control={form.control} name="amountPaid" render={({ field }) => (
                                    <FormItem><FormLabel>Amount Paid (GHS)</FormLabel><FormControl><Input type="number" placeholder="2500" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </form>
                    </Form>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
                        <Button type="submit" form="add-student-form" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : "Save Student"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Room No.</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
             ) : students.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No students found for your hostel.</TableCell>
                </TableRow>
            ) : (
                students.map((student) => {
                    const paymentStatus = getPaymentStatus(student.outstandingBalance, student.totalFee);
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.roomNumber}</TableCell>
                        <TableCell>
                          <Badge variant={
                            paymentStatus === "Paid" ? "default" :
                            paymentStatus === "Partial" ? "secondary" : "destructive"
                          }>
                            {paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <span>GHS {student.outstandingBalance.toFixed(2)}</span>
                        </TableCell>
                      </TableRow>
                    )
                })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
