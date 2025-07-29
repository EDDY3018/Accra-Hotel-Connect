
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Wifi,
  Wind,
  Bath,
  Tv,
  Zap,
  Users,
  Building,
  MapPin,
  Phone,
} from 'lucide-react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

const amenitiesMap: { [key: string]: { icon: React.ElementType; text: string } } = {
  wifi: { icon: Wifi, text: 'High-speed Wi-Fi' },
  ac: { icon: Wind, text: 'Air Conditioning' },
  bathroom: { icon: Bath, text: 'Private Bathroom' },
  tv: { icon: Tv, text: 'Flat-screen TV' },
  electricity: { icon: Zap, text: 'Prepaid Electricity' },
};

const bookingFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  email: z.string().email('Please enter a valid email.'),
});

type RoomDetails = {
  id: string;
  name: string;
  description: string;
  amenities: string[];
  occupancy: string;
  images: { src: string; hint: string }[];
  hostelName: string;
  location: string;
  managerPhone: string;
  roomNumber: string;
  price: number;
  status: 'Available' | 'Occupied';
  managerUid: string;
};

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  useEffect(() => {
    async function getRoomDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const roomRef = doc(db, 'rooms', id);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          setRoomDetails({ id: roomSnap.id, ...roomSnap.data() } as RoomDetails);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Room not found.' });
        }
      } catch (error: any) {
        console.error('Error fetching room details:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching room',
          description: 'Could not fetch room details. See console.',
        });
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          form.reset({
            fullName: userData.fullName || '',
            email: user.email || '',
          });
        }
      }
      getRoomDetails().finally(() => setIsLoading(false));
    });

    return () => unsubscribe();
  }, [id, form, toast]);

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof bookingFormSchema>) {
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to book a room.' });
      return;
    }
    if (!roomDetails) {
        toast({ variant: 'destructive', title: 'Error', description: 'Room details not available.' });
        return;
    }
    if (roomDetails.status !== 'Available') {
        toast({ variant: 'destructive', title: 'Room Not Available', description: 'This room has already been booked.' });
        return;
    }

    try {
        const batch = writeBatch(db);

        const bookingRef = doc(db, 'bookings', `${user.uid}_${roomDetails.id}`);
        batch.set(bookingRef, {
            studentUid: user.uid,
            studentName: values.fullName,
            roomId: roomDetails.id,
            roomNumber: roomDetails.roomNumber,
            hostelName: roomDetails.hostelName,
            price: roomDetails.price,
            managerUid: roomDetails.managerUid,
            bookingDate: new Date().toISOString(),
            status: 'Unpaid'
        });

        const roomRef = doc(db, 'rooms', roomDetails.id);
        batch.update(roomRef, { status: 'Occupied' });

        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
            roomId: roomDetails.id,
            roomNumber: roomDetails.roomNumber,
            outstandingBalance: roomDetails.price,
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            managerUid: roomDetails.managerUid
        });

        await batch.commit();

        toast({ title: 'Booking Successful!', description: "Your room has been secured. Redirecting to dashboard..." });
        router.push('/student/dashboard');

    } catch (error: any) {
        console.error("Error booking room:", error);
        let description = 'Could not complete the booking. Please check the console for more details.';
        if (error.code && error.code.includes('permission-denied')) {
            description = 'Permission denied. Please check your Firestore security rules.';
        }
        toast({ variant: 'destructive', title: 'Booking Failed', description });
    }
  }

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div className="space-y-4">
             <Skeleton className="h-8 w-1/4" />
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
             </div>
          </div>
        </div>
        <div>
          <Card>
            <CardHeader><Skeleton className="h-12 w-full" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!roomDetails) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground">The room you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const roomAmenities = roomDetails.amenities?.map((key: string) => amenitiesMap[key]).filter(Boolean) || [];

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <Carousel className="w-full">
            <CarouselContent>
                {roomDetails.images?.map((image: { src: string; hint: string }, index: number) => (
                    <CarouselItem key={index}>
                        <Image
                            src={image.src}
                            alt={`${roomDetails.name} view ${index + 1}`}
                            width={600}
                            height={400}
                            className="aspect-video object-cover rounded-lg"
                            data-ai-hint={image.hint}
                            priority={index === 0}
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>

        <div>
            <h2 className="font-headline text-2xl font-bold mb-2">Description</h2>
            <p className="text-muted-foreground">{roomDetails.description}</p>
        </div>
         <div>
            <h2 className="font-headline text-2xl font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 gap-4">
                {roomAmenities.map((amenity: { icon: React.ElementType, text: string }) => (
                    <div key={amenity.text} className="flex items-center gap-3">
                        <amenity.icon className="w-5 h-5 text-primary"/>
                        <span>{amenity.text}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary"/>
                    <span>{roomDetails.occupancy}</span>
                </div>
            </div>
        </div>
        <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Hostel Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-3"><Building className="w-5 h-5 text-primary"/><span>{roomDetails.hostelName}</span></div>
                <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-primary"/><span>{roomDetails.location}</span></div>
                <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary"/><span>{roomDetails.managerPhone}</span></div>
            </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-3xl">{roomDetails.name}</CardTitle>
                        <CardDescription>Room ID: {roomDetails.roomNumber}</CardDescription>
                    </div>
                    <Badge variant={roomDetails.status === 'Available' ? 'default' : 'destructive'}>
                        {roomDetails.status}
                    </Badge>
                </div>
                <p className="font-semibold text-3xl pt-4">GHS {roomDetails.price.toFixed(2)}<span className="text-lg font-normal text-muted-foreground">/year</span></p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="lg" className="w-full text-lg" disabled={isSubmitting || roomDetails.status !== 'Available'}>
                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                            {isSubmitting ? 'Booking...' : roomDetails.status === 'Available' ? 'Book Now' : 'Occupied'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">By booking, you agree to the terms and conditions.</p>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

    