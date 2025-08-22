
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from '@/components/ui/skeleton';

interface Hostel {
    id: string; // managerUid
    name: string;
    location: string;
    imageUrl: string;
    imageHint: string;
}

export default function HostelsPage() {
  const [allHostels, setAllHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function getHostels() {
        setIsLoading(true);
        try {
            const roomsQuery = query(collection(db, 'rooms'), where('status', '==', 'Available'));
            const roomSnapshot = await getDocs(roomsQuery);

            const hostelsMap = new Map<string, Hostel>();

            roomSnapshot.docs.forEach(doc => {
                 const data = doc.data();
                 const managerUid = data.managerUid;

                 if (!hostelsMap.has(managerUid)) {
                    hostelsMap.set(managerUid, {
                        id: managerUid,
                        name: data.hostelName || 'Unknown Hostel',
                        location: data.location || 'No location provided',
                        imageUrl: data.images && data.images.length > 0 ? data.images[0].src : "https://placehold.co/600x400.png",
                        imageHint: data.images && data.images.length > 0 ? data.images[0].hint : "hostel exterior",
                    });
                 }
            });
            
            setAllHostels(Array.from(hostelsMap.values()));

        } catch (error) {
            console.error("Error fetching hostels:", error);
            setAllHostels([]); 
        } finally {
            setIsLoading(false);
        }
    }
    getHostels();
  }, []);

  const filteredHostels = useMemo(() => {
    if (!searchTerm) {
        return allHostels;
    }
    return allHostels.filter(hostel => 
        hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hostel.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allHostels, searchTerm]);

  return (
    <>
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">Browse Hostels</h1>
                <p className="text-muted-foreground">Find the perfect place to stay.</p>
            </div>
             <div className="relative flex-1 md:flex-initial w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by hostel name or location..." className="pl-8" onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm}/>
            </div>
        </div>

         {isLoading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="overflow-hidden flex flex-col">
                        <Skeleton className="h-48 w-full" />
                        <CardHeader>
                           <Skeleton className="h-7 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardFooter>
                           <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : filteredHostels.length === 0 ? (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold">No Hostels Found</h2>
                <p className="text-muted-foreground mt-2">There are currently no available hostels. Please check back later.</p>
            </div>
        ) : (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredHostels.map(hostel => (
                    <Card key={hostel.id} className="overflow-hidden flex flex-col group">
                        <div className="overflow-hidden rounded-t-lg">
                             <Image
                                src={hostel.imageUrl}
                                alt={`Exterior of ${hostel.name}`}
                                width={600}
                                height={400}
                                className="aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={hostel.imageHint}
                            />
                        </div>
                        <CardHeader className="flex-1">
                            <CardTitle className="font-headline text-xl">{hostel.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-1">
                                <MapPin className="w-4 h-4" />
                                {hostel.location}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/student/rooms/hostel/${hostel.id}`}>View Rooms</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
    </>
  )
}
