
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
});

interface Ticket {
    id: string;
    subject: string;
    description: string;
    status: string;
    response?: string;
    createdAt: {
        toDate: () => Date;
    };
}

export default function SupportPage() {
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("my-tickets");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { subject: '', description: '' },
    });
    
    const { isSubmitting } = form.formState;

    const fetchTickets = async () => {
        setIsLoading(true);
        const user = auth.currentUser;
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const q = query(
                collection(db, 'tickets'), 
                where('studentUid', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const userTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(userTickets);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your support tickets.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
      if (activeTab === "my-tickets") {
        fetchTickets();
      }
    }, [activeTab]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        const user = auth.currentUser;
        if (!user) {
            toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in." });
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                 toast({ variant: "destructive", title: "User Not Found", description: "Your user profile could not be found." });
                 return;
            }
            const userData = userDoc.data();

            await addDoc(collection(db, 'tickets'), {
                studentUid: user.uid,
                studentName: userData.fullName || 'N/A',
                studentId: userData.studentId || 'N/A',
                roomNumber: userData.roomNumber || 'N/A',
                subject: values.subject,
                description: values.description,
                status: 'Open',
                createdAt: serverTimestamp(),
                response: ''
            });

            toast({ title: "Ticket Submitted!", description: "We have received your ticket and will get back to you shortly." });
            form.reset();
            setActiveTab("my-tickets"); // Switch to tickets list
        } catch (error: any) {
            console.error("Error submitting ticket: ", error);
            toast({ variant: "destructive", title: "Submission Error", description: "Could not submit your ticket. Check your Firestore rules for 'tickets' collection." });
        }
    }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center">
        <TabsList>
            <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="my-tickets">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Support Tickets</CardTitle>
                <CardDescription>View the status of your support requests and complaints.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>You have not submitted any tickets.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                    {tickets.map((ticket) => (
                        <AccordionItem value={ticket.id} key={ticket.id}>
                        <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4 text-left">
                                <span className="font-medium">{ticket.subject}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground hidden md:inline">
                                        {ticket.createdAt?.toDate().toLocaleDateString()}
                                    </span>
                                    <Badge variant={ticket.status === "Open" ? "destructive" : ticket.status === "In Progress" ? "default" : "secondary"}>
                                        {ticket.status}
                                    </Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                                <div>
                                  <p className="font-semibold mb-1">My complaint:</p>
                                  <p className="text-sm text-foreground/80">{ticket.description}</p>
                                </div>
                                <div className="border-t pt-4">
                                  <p className="font-semibold mb-1">Admin response:</p>
                                  <p className="text-sm text-foreground/80">{ticket.response || "Awaiting response from admin."}</p>
                                </div>
                            </div>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="new-ticket">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit a New Ticket</CardTitle>
                <CardDescription>Have an issue? Let us know, and we&apos;ll get back to you.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="subject" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Leaky Faucet in Bathroom" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} placeholder="Please describe the issue in detail." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Ticket'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
