
'use client';

import React, { useState, useEffect } from 'react';
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
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
    totalFee: number; // For calculating payment status
}


export default function AdminStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        setIsLoading(false);
        return;
    }
    try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('managerUid', '==', user.uid));
        const querySnapshot = await getDocs(studentsQuery);
        const fetchedStudents = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                fullName: data.fullName || 'N/A',
                studentId: data.studentId || 'N/A',
                email: data.email || 'N/A',
                roomNumber: data.roomNumber || 'Unassigned',
                outstandingBalance: data.outstandingBalance || 0,
                // Assuming total fee could be derived or stored. Placeholder for now.
                // For accurate status, we need to know the original fee.
                // This is a simplification.
                totalFee: (data.outstandingBalance || 0) > 0 ? (data.outstandingBalance + 1) : 0, 
            };
        });
        setStudents(fetchedStudents);
    } catch (error) {
        console.error("Error fetching students:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch students. Check Firestore rules.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchStudents();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
    // This is a simplification. A real total fee would be needed for "Unpaid"
    if (balance > 0) return "Partial"; 
    return "Unpaid";
  }

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
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                            Manually add a student to the system. An account will be created for them.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="full-name" className="text-right">Full Name</Label>
                            <Input id="full-name" placeholder="e.g., John Doe" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="student-id" className="text-right">Student ID</Label>
                            <Input id="student-id" placeholder="e.g., 01241234B" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" placeholder="student@school.com" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" type="tel" placeholder="+233 12 345 6789" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-no" className="text-right">Room No.</Label>
                            <Input id="room-no" placeholder="e.g., E501" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="total-fee">Total Fee (GHS)</Label>
                                <Input id="total-fee" type="number" placeholder="5000" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount-paid">Amount Paid (GHS)</Label>
                                <Input id="amount-paid" type="number" placeholder="2500" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Save Student</Button>
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
