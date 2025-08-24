
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { auth, db, storage } from '@/lib/firebase';
import {
  ref as sRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, PlusCircle, Trash, Upload, Wifi, Wind, Tv, Zap, Bath, X } from 'lucide-react';

import imageCompression from 'browser-image-compression';

// ---------- Config & Helpers ----------
const amenitiesList = [
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'ac', label: 'Air-Con', icon: Wind },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'electricity', label: 'Electricity', icon: Zap },
  { id: 'bathroom', label: 'Private Bath', icon: Bath },
] as const;

const imageHints = ['room angle one', 'room angle two', 'room angle three', 'bathroom'] as const;

const clean = (s: string) =>
  s.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '_').trim();

// Safer schema (no uncontrolled warnings)
const formSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required.'),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: 'Price is required.' }).positive('Price must be positive.')
  ),
  occupancy: z.string({ required_error: 'Please select an occupancy level.' }),
  gender: z.string({ required_error: 'Please select a gender.' }),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  amenities: z.array(z.string()).optional(),
  images: z
    .array(z.instanceof(File))
    .length(4, 'You must upload exactly 4 images.')
    .refine(
      (files) => files.every((f) => f.size <= 5 * 1024 * 1024),
      'Each image must be less than 5MB.'
    ),
});

type FormValues = z.infer<typeof formSchema>;
type UploadedImage = { src: string; hint: string };


// ---------- Resumable Upload Pipeline ----------
async function uploadResumable(
  file: File,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ref = sRef(storage, path);
  const metadata = {
    contentType: file.type || 'image/jpeg',
    cacheControl: 'public,max-age=31536000,immutable',
  };

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref, file, metadata);

    task.on(
      'state_changed',
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      err => {
        // Surface exact Firebase Storage error codes (helps a lot)
        // examples: 'storage/unauthorized', 'storage/retry-limit-exceeded', 'storage/canceled'
        reject(err);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

async function uploadAllSerial(
  files: File[],
  uid: string,
  roomNumber: string,
  onEachProgress?: (i: number, p: number) => void
) {
  const urls: { src: string; hint: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ext = f.type.includes('png') ? 'png' : f.type.includes('webp') ? 'webp' : 'jpg';
    const filename = `${i + 1}_${Date.now()}.${ext}`;
    const path = `rooms/${uid}/${clean(roomNumber)}/${filename}`;
    
    const compressedFile = await imageCompression(f, {
        maxWidthOrHeight: 1280,
        maxSizeMB: 0.5,
        useWebWorker: true,
    });

    const src = await uploadResumable(compressedFile, path, p => onEachProgress?.(i, p));
    urls.push({ src, hint: imageHints[i] ?? 'room interior' });
  }
  return urls;
}


// ---------- Page ----------
export default function AdminRoomsPage() {
  const { toast } = useToast();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [managerInfo, setManagerInfo] = useState<{ hostelName: string; location: string; phone: string } | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomNumber: '',
      price: '' as unknown as number,
      occupancy: '' as unknown as string,
      gender: '' as unknown as string,
      description: '',
      amenities: [],
      images: [],
    },
    mode: 'onSubmit',
  });

  const { isSubmitting } = form.formState;

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
        const data = userDocSnap.data() as any;
        setManagerInfo({
          hostelName: data.hostelName || '',
          location: data.location || '',
          phone: data.phone || '',
        });
      } else {
        setManagerInfo({ hostelName: '', location: '', phone: '' });
      }

      const roomsQuery = query(collection(db, 'rooms'), where('managerUid', '==', user.uid));
      const qs = await getDocs(roomsQuery);
      setRooms(qs.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error: any) {
      console.error('Error fetching data: ', error);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not fetch your rooms. Check console for details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) fetchManagerAndRooms();
      else setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (!newFiles) return;

    const currentFiles = form.getValues('images') || [];
    const combined = [...currentFiles, ...Array.from(newFiles)];
    const limited = combined.slice(0, 4);

    form.setValue('images', limited, { shouldValidate: true, shouldDirty: true });
    setUploadProgresses(new Array(limited.length).fill(0));

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews(limited.map((f) => URL.createObjectURL(f)));

    if (event.target) event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    if (imagePreviews[index]) URL.revokeObjectURL(imagePreviews[index]);

    const previews = [...imagePreviews];
    previews.splice(index, 1);
    setImagePreviews(previews);

    const currentFiles = form.getValues('images') || [];
    const next = [...currentFiles];
    next.splice(index, 1);
    form.setValue('images', next, { shouldValidate: true, shouldDirty: true });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  async function onSubmit(values: FormValues) {
    const user = auth.currentUser;
    if (!user || !managerInfo) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to add a room.',
      });
      return;
    }

    try {
      const imageUrls = await uploadAllSerial(
        values.images,
        user.uid,
        values.roomNumber,
        (i, p) => {
          setUploadProgresses((prev) => {
            const arr = [...prev];
            arr[i] = p;
            return arr;
          });
        }
      );

      const roomData = {
        managerUid: user.uid,
        hostelName: managerInfo.hostelName,
        location: managerInfo.location,
        managerPhone: managerInfo.phone,
        name: values.occupancy,
        roomNumber: values.roomNumber,
        price: values.price,
        occupancy: values.occupancy,
        gender: values.gender,
        description: values.description,
        amenities: values.amenities || [],
        images: imageUrls,
        status: 'Available',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'rooms'), roomData);

      toast({ title: 'Room Added!', description: 'The new room has been saved successfully.' });
      form.reset();
      setImagePreviews([]);
      setUploadProgresses([]);
      setIsFormVisible(false);
      fetchManagerAndRooms();
    } catch (error: any) {
        console.error('UPLOAD FAIL ->', error, error?.code, error?.customData);
        let description = 'Could not save the room. Check the console for details.';
        if (error.code) {
          switch (error.code) {
            case 'storage/unauthorized':
              description = "Permission Denied. This is likely an App Check or Storage Rules issue. Please verify your NEXT_PUBLIC_RECAPTCHA_SITE_KEY and Firebase console settings.";
              break;
            case 'storage/retry-limit-exceeded':
              description = "Upload failed due to a network error. Please check your connection and try again.";
              break;
            case 'storage/quota-exceeded':
              description = "You've exceeded your Firebase Storage quota. Please upgrade your plan or free up space.";
              break;
            default:
              description = `An unexpected storage error occurred: ${error.code}`;
          }
        }
        toast({ variant: 'destructive', title: 'Upload Error', description, duration: 9000 });
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Rooms</CardTitle>
              <CardDescription>Manage hostel rooms and their availability.</CardDescription>
            </div>
            <Button onClick={() => setIsFormVisible((s) => !s)}>
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
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Skeleton className="w-full h-8" />
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No rooms found. Add a room to get started.
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>GHS {room.price}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          room.status === 'Occupied'
                            ? 'secondary'
                            : room.status === 'Available'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
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
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                {imagePreviews.map((src, index) => (
                                  <div key={src} className="relative aspect-video">
                                    <Image src={src} alt={`Preview ${index + 1}`} fill className="object-cover rounded-md" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 rounded-full z-10"
                                      onClick={() => handleRemoveImage(index)}
                                      disabled={isSubmitting}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    {isSubmitting && (
                                      <div className="absolute bottom-0 left-0 right-0 p-1">
                                        <Progress value={uploadProgresses[index] || 0} className="w-full h-2" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="room-images-input"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
                                  isSubmitting ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer hover:bg-muted'
                                }`}
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                  <p className="mb-1 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    4 images required, PNG, JPG, WEBP — up to 5MB each
                                  </p>
                                </div>
                                <Input
                                  id="room-images-input"
                                  ref={fileInputRef}
                                  type="file"
                                  className="hidden"
                                  multiple
                                  accept="image/png, image/jpeg, image/webp, image/jpg"
                                  onChange={handleFileChange}
                                  disabled={isSubmitting}
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
                    <FormField
                      control={form.control}
                      name="roomNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room No.</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., E501" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (GHS/Year)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="5000" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="occupancy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Occupancy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select occupancy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1 in a room">1 in a room</SelectItem>
                              <SelectItem value="2 in a room">2 in a room</SelectItem>
                              <SelectItem value="3 in a room">3 in a room</SelectItem>
                              <SelectItem value="4 in a room">4 in a room</SelectItem>
                              <SelectItem value="5 in a room">5 in a room</SelectItem>
                              <SelectItem value="6 in a room">6 in a room</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Unisex">Unisex</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the room and its amenities." {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amenities"
                    render={() => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                          {amenitiesList.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="amenities"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(field.value?.filter((v: string) => v !== item.id));
                                      }}
                                      disabled={isSubmitting}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                    <item.icon className="w-5 h-5 text-muted-foreground" />
                                    <span>{item.label}</span>
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setIsFormVisible(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form="add-room-form" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save Room'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
