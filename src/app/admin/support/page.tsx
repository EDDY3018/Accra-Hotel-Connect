
'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  studentName: string;
  roomNumber: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  response: string;
  createdAt: {
    toDate: () => Date;
  };
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responseTexts, setResponseTexts] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState<{[key: string]: boolean}>({});

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedTickets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        studentName: doc.data().studentName,
        ...doc.data()
      } as Ticket));
      setTickets(fetchedTickets);
    } catch (error: any) {
      console.error("Error fetching tickets: ", error);
      toast({ variant: 'destructive', title: 'Error fetching tickets', description: 'Could not fetch support tickets. See console for details.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [toast]);
  
  const handleResponseChange = (ticketId: string, text: string) => {
    setResponseTexts(prev => ({...prev, [ticketId]: text}));
  }
  
  const handleStatusChange = async (ticketId: string, status: Ticket['status']) => {
     try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { status });
      toast({ title: 'Status Updated', description: `Ticket status changed to ${status}` });
      fetchTickets();
    } catch (error: any) {
      console.error("Error updating status: ", error);
      toast({ variant: 'destructive', title: 'Error updating status', description: 'Could not update ticket status. See console for details.' });
    }
  };

  const handleSendResponse = async (ticketId: string) => {
    const response = responseTexts[ticketId];
    if (!response || !response.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Response cannot be empty.' });
        return;
    }

    setIsSubmitting(prev => ({...prev, [ticketId]: true}));
    try {
        const ticketRef = doc(db, 'tickets', ticketId);
        await updateDoc(ticketRef, { 
            response,
            status: 'In Progress', // Automatically move to 'In Progress' when a response is sent
            respondedAt: serverTimestamp()
        });
        toast({ title: 'Response Sent', description: 'Your response has been sent to the student.' });
        fetchTickets(); // Refresh data
        setResponseTexts(prev => ({...prev, [ticketId]: ''}));
    } catch (error: any) {
        console.error("Error sending response: ", error);
        toast({ variant: 'destructive', title: 'Error sending response', description: 'Could not send the response. See console for details.' });
    } finally {
        setIsSubmitting(prev => ({...prev, [ticketId]: false}));
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Support Tickets</CardTitle>
        <CardDescription>View and respond to student support tickets and complaints.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                <p>No support tickets found.</p>
            </div>
        ) : (
            <Accordion type="single" collapsible className="w-full">
            {tickets.map((ticket) => (
                <AccordionItem value={ticket.id} key={ticket.id}>
                <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4 items-center">
                        <div className="flex items-center gap-4 text-left">
                            <Avatar className="hidden h-9 w-9 sm:flex">
                                <AvatarFallback>{ticket.studentName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <p className="font-semibold">{ticket.subject}</p>
                                <p className="text-sm text-muted-foreground">{ticket.studentName} - Room {ticket.roomNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden md:inline">{ticket.createdAt.toDate().toLocaleDateString()}</span>
                            <Badge variant={ticket.status === "Open" ? "destructive" : ticket.status === "In Progress" ? "default" : "secondary"}>
                                {ticket.status}
                            </Badge>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        <div>
                          <p className="font-semibold text-sm mb-1">Student's Complaint:</p>
                          <p className="text-sm text-foreground/80">{ticket.description}</p>
                        </div>
                        
                        {ticket.response && (
                           <div className="border-t pt-4">
                              <p className="font-semibold text-sm mb-1">Your Last Response:</p>
                              <p className="text-sm text-foreground/80">{ticket.response}</p>
                           </div>
                        )}

                        <div className="grid w-full gap-2 pt-2 border-t">
                            <Textarea 
                              placeholder="Type your response here..." 
                              value={responseTexts[ticket.id] || ''}
                              onChange={(e) => handleResponseChange(ticket.id, e.target.value)}
                            />
                            <div className="flex justify-between items-center gap-2">
                                <Select onValueChange={(value: Ticket['status']) => handleStatusChange(ticket.id, value)} defaultValue={ticket.status}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Set status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => handleSendResponse(ticket.id)} disabled={isSubmitting[ticket.id]}>
                                  {isSubmitting[ticket.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Send Response
                                </Button>
                            </div>
                        </div>
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

    