
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
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
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, PlusCircle, Trash, Upload, Wifi, Wind, Tv, Zap, Bath, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import imageCompression from 'browser-image-compression';


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
  images: z.array(z.instanceof(File))
    .min(4, 'You must upload exactly 4 images.')
    .max(4, 'You must upload exactly 4 images.')
    .refine((files) => files.every(file => file.size <= 5 * 1024 * 1024), `Each image must be less than 5MB.`),
});

export default function AdminRoomsPage() {
  const { toast } = useToast();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{ hostelName: string; location: string; phone: string } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomNumber: '',
      price: 0,
      description: '',
      amenities: [],
      images: [],
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const currentFiles = form.getValues('images') || [];
      const combinedFiles = [...currentFiles, ...Array.from(newFiles)];
      
      const limitedFiles = combinedFiles.slice(0, 4);

      form.setValue('images', limitedFiles, { shouldValidate: true });
      
      const newPreviews = limitedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    const currentFiles = form.getValues('images') || [];
    const newFiles = [...currentFiles];
    newFiles.splice(index, 1);
    form.setValue('images', newFiles, { shouldValidate: true });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submission triggered. Values:", values);
    const user = auth.currentUser;
    if (!user || !managerInfo) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a room.' });
      return;
    }

    try {
      const storage = getStorage();
      const imageHints = ["room angle one", "room angle two", "room angle three", "bathroom"];
      
      console.log("Compressing images...");
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedImagePromises = values.images.map(file => imageCompression(file, compressionOptions));
      const compressedImages = await Promise.all(compressedImagePromises);
      console.log("Image compression complete.");

      console.log("Starting image uploads...");
      const uploadPromises = compressedImages.map(async (file, i) => {
          console.log(`[Image ${i + 1}] Starting upload for ${file.name}`);
          const fileRef = storageRef(storage, `rooms/${user.uid}/${values.roomNumber}/${file.name}_${Date.now()}`);
          
          const snapshot = await uploadBytes(fileRef, file);
          console.log(`[Image ${i + 1}] Upload complete. Getting download URL...`);
          
          const url = await getDownloadURL(snapshot.ref);
          console.log(`[Image ${i + 1}] URL retrieved.`);
          
          return {
              src: url,
              hint: imageHints[i] || "room interior"
          };
      });

      const imageUrls = await Promise.all(uploadPromises);
      console.log("All image uploads completed. URLs:", imageUrls);


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

      console.log("About to save to Firestore:", roomData);
      await addDoc(collection(db, 'rooms'), roomData);
      console.log("Successfully saved to Firestore.");

      toast({ title: 'Room Added!', description: 'The new room has been saved successfully.' });
      form.reset();
      setImagePreviews([]);
      setIsFormVisible(false);
      fetchManagerAndRooms();
    } catch (error: any) {
      console.error("Error adding room: ", error);
      let description = 'Could not save the room. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            description = 'Permission denied. You are not authorized to upload images. Check your Storage security rules.';
            break;
          case 'storage/retry-limit-exceeded':
            description = 'Network timeout. Please check your internet connection and verify your Storage rules and bucket configuration in .env.';
            break;
          case 'firestore/permission-denied':
             description = 'Permission denied. Your Firestore security rules do not allow you to save this data. Ensure the managerUid in your data matches your authenticated user ID.';
            break;
          default:
            description = `An unexpected error occurred: ${error.message}`;
        }
      }
      toast({ variant: 'destructive', title: 'Submission Error', description });
    }
  }
  
  const { isSubmitting } = form.formState;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Rooms</CardTitle>
              <CardDescription>Manage hostel rooms and their availability.</CardDescription>
            </div>
            <Button onClick={() => setIsFormVisible(!isFormVisible)}>
              {isFormVisible ? <X className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isFormVisible ? 'Cancel' : 'Add Room'}
            </Button>
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
      
      <Collapsible open={isFormVisible} className="mt-6">
        <CollapsibleContent>
            <Card className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <CardHeader>
                    <CardTitle>Add New Room</CardTitle>
                    <CardDescription>Fill in the details to add a new room to the system.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form id="add-room-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
                    <FormField
                        control={form.control}
                        name="images"
                        render={() => (
                        <FormItem>
                            <FormLabel>Room Images (must be 4)</FormLabel>
                            <FormControl>
                            <div>
                                {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {imagePreviews.map((src, index) => (
                                    <div key={src} className="relative aspect-square">
                                        <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md" />
                                        <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                                        onClick={() => handleRemoveImage(index)}
                                        >
                                        <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    ))}
                                </div>
                                )}
                                <div className="flex items-center justify-center w-full">
                                <label htmlFor="room-images-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-muted-foreground">4 images required (3 room, 1 bath), PNG, JPG, or JPEG up to 5MB each</p>
                                    </div>
                                    <Input
                                    id="room-images-input"
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/png, image/jpeg"
                                    onChange={handleFileChange}
                                    />
                                </label>
                                </div>
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
                    </form>
                </Form>
                </CardContent>
                <CardFooter>
                    <div className="flex justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => setIsFormVisible(false)}>Cancel</Button>
                        <Button type="submit" form="add-room-form" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Room'}</Button>
                    </div>
                </CardFooter>
            </Card>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}
