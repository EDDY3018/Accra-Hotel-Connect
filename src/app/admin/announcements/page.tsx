
'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Edit, PlusCircle, Trash, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, doc, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(10, "Content must be at least 10 characters long."),
});

interface Announcement {
    id: string;
    title: string;
    content: string;
    author: string;
    date: string;
    status: 'Published' | 'Draft';
}

export default function AdminAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const { isSubmitting } = form.formState;

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
        setIsLoading(false);
        return;
    }
    try {
      const q = query(
        collection(db, 'announcements'),
        where('managerUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedAnnouncements = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              title: data.title,
              content: data.content,
              author: data.author,
              date: data.createdAt?.toDate().toLocaleDateString() ?? new Date().toLocaleDateString(),
              status: data.status,
          }
      });
      setAnnouncements(fetchedAnnouncements);
    } catch (error: any) {
        console.error("Error fetching announcements: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch announcements. See console for details.' });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        if(user) {
            fetchAnnouncements();
        } else {
            setIsLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (isFormOpen && editingAnnouncement) {
      form.reset({ title: editingAnnouncement.title, content: editingAnnouncement.content });
    } else {
      form.reset({ title: '', content: '' });
    }
  }, [isFormOpen, editingAnnouncement, form]);
  
  const handleOpenDialog = (announcement: Announcement | null = null) => {
    setEditingAnnouncement(announcement);
    setIsFormOpen(true);
  }

  const handleFormSubmit = async (values: z.infer<typeof formSchema>, status: 'Published' | 'Draft') => {
    const user = auth.currentUser;
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }
    
    try {
        if (editingAnnouncement) {
            // Update existing announcement
            const docRef = doc(db, 'announcements', editingAnnouncement.id);
            await updateDoc(docRef, {
                title: values.title,
                content: values.content,
                status: status,
            });
            toast({ title: `Announcement Updated!`, description: `Your announcement has been updated.`});
        } else {
            // Create new announcement
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const authorName = userDoc.exists() ? userDoc.data().fullName : "Admin";

            await addDoc(collection(db, 'announcements'), {
                title: values.title,
                content: values.content,
                status: status,
                author: authorName,
                managerUid: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: `Announcement ${status}!`, description: `Your announcement has been saved as ${status.toLowerCase()}.` });
        }

        form.reset();
        setIsFormOpen(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();

    } catch (error: any) {
        console.error("Error submitting announcement: ", error);
        toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not save the announcement. See console for details.' });
    }
  };
  
  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
        await deleteDoc(doc(db, "announcements", announcementId));
        toast({ title: "Announcement Deleted", description: "The announcement has been permanently removed." });
        fetchAnnouncements();
    } catch (error) {
        console.error("Error deleting announcement: ", error);
        toast({ variant: 'destructive', title: 'Delete Error', description: 'Could not delete the announcement. See console for details.' });
    }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Announcements</CardTitle>
                <CardDescription>Create and manage announcements for students.</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
                        <DialogDescription>
                            {editingAnnouncement ? 'Update the details of your announcement.' : 'Compose a new announcement to be displayed to all students.'}
                        </DialogDescription>
                    </DialogHeader>
                     <Form {...form}>
                        <form id="announcement-form" onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-center gap-4">
                                        <FormLabel className="text-right">Title</FormLabel>
                                        <FormControl className="col-span-3">
                                            <Input placeholder="Announcement Title" {...field} />
                                        </FormControl>
                                        <FormMessage className="col-span-4 pl-[25%]" />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-4 items-start gap-4">
                                        <FormLabel className="text-right pt-2">Content</FormLabel>
                                        <FormControl className="col-span-3">
                                             <Textarea rows={6} placeholder="Type your announcement here." {...field}/>
                                        </FormControl>
                                        <FormMessage className="col-span-4 pl-[25%]" />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                    <DialogFooter>
                        <Button variant="outline" onClick={form.handleSubmit((values) => handleFormSubmit(values, 'Draft'))} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save as Draft
                        </Button>
                        <Button type="submit" onClick={form.handleSubmit((values) => handleFormSubmit(values, 'Published'))} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                </TableRow>
            ) : announcements.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No announcements found.</TableCell>
                </TableRow>
            ) : (
                announcements.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell className="font-medium">{ann.title}</TableCell>
                    <TableCell>{ann.author}</TableCell>
                    <TableCell>{ann.date}</TableCell>
                    <TableCell>
                      <Badge variant={ann.status === "Published" ? "default" : "secondary"}>
                        {ann.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(ann)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="destructive" size="icon">
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the announcement.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteAnnouncement(ann.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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
