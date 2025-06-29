
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from "@/components/ui/button";
import { Edit, PlusCircle, Trash, Upload, Wifi, Wind, Tv, Zap, Bath } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';

const amenitiesList = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'ac', label: 'Air-Con', icon: Wind },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'electricity', label: 'Electricity', icon: Zap },
    { id: 'bathroom', label: 'Private Bath', icon: Bath },
];

const formSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required.'),
  price: z.preprocess((val) => Number(val), z.number().positive('Price must be a positive number.')),
  occupancy: z.string({ required_error: 'Please select an occupancy level.' }),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  amenities: z.array(z.string()).optional(),
  images: z.custom<FileList>()
    .refine((files) => files && files.length === 4, `You must upload exactly 4 images.`)
    .refine((files) => files && Array.from(files).every(file => file.size <= 1024 * 1024), `Each image must be less than 1MB.`),
});

export default function AdminRoomsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{ hostelName: string; location: string; phone: string } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomNumber: '',
      price: 0,
      description: '',
      amenities: [],
    },
  });

  const fetchManagerAndRooms = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch manager info
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setManagerInfo({
          hostelName: userData.hostelName || '',
          location: userData.location || '',
          phone: userData.phone || '',
        });
      }

      // Fetch rooms created by this manager
      const roomsQuery = query(collection(db, 'rooms'), where('managerUid', '==', user.uid));
      const querySnapshot = await getDocs(roomsQuery);
      const fetchedRooms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(fetchedRooms);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your rooms.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchManagerAndRooms();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const user = auth.currentUser;
    if (!user || !managerInfo) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a room.' });
      return;
    }

    try {
      // 1. Upload images
      const storage = getStorage();
      const imageUrls: { src: string; hint: string }[] = [];
      const imageHints = ["room angle one", "room angle two", "room angle three", "bathroom"];
      
      for (let i = 0; i < values.images.length; i++) {
        const file = values.images[i];
        const fileRef = storageRef(storage, `rooms/${user.uid}/${values.roomNumber}/${file.name}_${Date.now()}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        imageUrls.push({ src: url, hint: imageHints[i] || "room interior" });
      }

      // 2. Prepare data for Firestore
      const roomData = {
        managerUid: user.uid,
        hostelName: managerInfo.hostelName,
        location: managerInfo.location,
        managerPhone: managerInfo.phone,
        name: `${values.occupancy} in a Room`,
        roomNumber: values.roomNumber,
        price: values.price,
        occupancy: values.occupancy,
        description: values.description,
        amenities: values.amenities || [],
        images: imageUrls,
        status: 'Available',
        createdAt: new Date().toISOString(),
      };

      // 3. Add doc to Firestore
      await addDoc(collection(db, 'rooms'), roomData);

      toast({ title: 'Room Added!', description: 'The new room has been saved successfully.' });
      form.reset();
      setIsDialogOpen(false);
      fetchManagerAndRooms(); // Refresh the list
    } catch (error) {
      console.error("Error adding room: ", error);
      toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not save the room. Please try again.' });
    }
  }
  
  const { isSubmitting } = form.formState;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-headline">Rooms</CardTitle>
            <CardDescription>Manage hostel rooms and their availability.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Room</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>Fill in the details to add a new room to the system.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-4">
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Images (must be 4)</FormLabel>
                        <FormControl>
                          <div className="flex items-center justify-center w-full">
                            <label htmlFor="room-images-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">4 images required (3 room, 1 bath), PNG/JPG up to 1MB each</p>
                              </div>
                              <Input id="room-images-input" type="file" className="hidden" multiple accept="image/png, image/jpeg" onChange={(e) => field.onChange(e.target.files)} />
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="roomNumber" render={({ field }) => (
                      <FormItem><FormLabel>Room No.</FormLabel><FormControl><Input placeholder="e.g., E501" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>Price (GHS/Year)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="occupancy" render={({ field }) => (
                    <FormItem><FormLabel>Room Occupancy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select occupancy" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1 in a room">1 in a room</SelectItem>
                          <SelectItem value="2 in a room">2 in a room</SelectItem>
                          <SelectItem value="3 in a room">3 in a room</SelectItem>
                          <SelectItem value="4 in a room">4 in a room</SelectItem>
                          <SelectItem value="5 in a room">5 in a room</SelectItem>
                          <SelectItem value="6 in a room">6 in a room</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the room and its amenities." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="amenities" render={() => (
                    <FormItem>
                      <FormLabel>Amenities</FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                        {amenitiesList.map((item) => (
                          <FormField key={item.id} control={form.control} name="amenities" render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                  return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                              }} /></FormControl>
                              <FormLabel className="font-normal flex items-center gap-2 cursor-pointer"><item.icon className="w-5 h-5 text-muted-foreground" /><span>{item.label}</span></FormLabel>
                            </FormItem>
                          )} />
                        ))}
                      </div><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Room'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price/Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Skeleton className="w-full h-8" /></TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No rooms found. Add a room to get started.</TableCell></TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.roomNumber}</TableCell>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>GHS {room.price}</TableCell>
                  <TableCell>
                    <Badge variant={room.status === "Occupied" ? "secondary" : room.status === "Available" ? "default" : "destructive"}>{room.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon"><Trash className="h-4 w-4" /></Button>
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
