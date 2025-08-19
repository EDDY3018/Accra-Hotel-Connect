
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Cancellation {
  id: string;
  studentName: string;
  roomNumber: string;
  reason: string;
  cancelledAt: {
    toDate: () => Date;
  };
}

export default function AdminCancellationsPage() {
  const { toast } = useToast();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCancellations = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'cancellations'),
        where('managerUid', '==', user.uid),
        orderBy('cancelledAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedCancellations = querySnapshot.docs.map(doc => {
          return {
              id: doc.id,
              ...doc.data()
          } as Cancellation;
      });
      setCancellations(fetchedCancellations);
    } catch (error: any) {
      console.error("Error fetching cancellations: ", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error Fetching Data', 
        description: 'Could not fetch cancellations. See console for details.' 
      });
    } finally {
      setIsLoading(false);
    }
  };


   useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchCancellations();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Booking Cancellations</CardTitle>
        <CardDescription>Review booking cancellations and the reasons provided by students.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : cancellations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                 <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>No cancellations found for your hostel yet.</p>
            </div>
        ) : (
            <Accordion type="single" collapsible className="w-full">
            {cancellations.map((item) => (
                <AccordionItem value={item.id} key={item.id}>
                <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 items-center text-left">
                        <div className="grid gap-1">
                            <p className="font-semibold">{item.studentName}</p>
                            <p className="text-sm text-muted-foreground">Room: {item.roomNumber}</p>
                        </div>
                        <div className="text-sm text-muted-foreground hidden md:inline">
                           {item.cancelledAt.toDate().toLocaleString()}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="font-semibold text-sm">Reason for cancellation:</p>
                        <p className="text-sm text-foreground/80">{item.reason}</p>
                    </div>
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

    