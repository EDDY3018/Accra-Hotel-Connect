
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link"
import Image from "next/image"
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bed, Filter } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface Room {
    id: string;
    name: string;
    price: number;
    images: { src: string; hint: string }[];
    status: 'Available' | 'Occupied';
    amenities: string[];
    occupancy: string;
    gender: 'Male' | 'Female' | 'Unisex';
}

interface GroupedRooms {
    [occupancy: string]: Room[];
}

export default function HostelRoomsPage() {
  const params = useParams();
  const managerUid = params.id as string;

  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [hostelName, setHostelName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [selectedOccupancy, setSelectedOccupancy] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');


  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!managerUid) return;

    async function getRooms() {
        setIsLoading(true);
        try {
            const roomsQuery = query(
                collection(db, 'rooms'), 
                where('managerUid', '==', managerUid),
                where('status', '==', 'Available')
            );
            const roomSnapshot = await getDocs(roomsQuery);

            if (roomSnapshot.empty) {
                // Potentially fetch manager info to display hostel name even if no rooms are available
                console.log('No available rooms for this hostel.');
            }

            const fetchedRooms = roomSnapshot.docs.map(doc => {
                 const data = doc.data();
                 if (!hostelName && data.hostelName) {
                    setHostelName(data.hostelName);
                 }
                 return {
                    id: doc.id,
                    name: data.name || "Unnamed Room",
                    price: data.price || 0,
                    images: data.images && data.images.length > 0 ? data.images : [{ src: "https://placehold.co/600x400.png", hint: "hostel room" }],
                    status: data.status || "Available",
                    amenities: data.amenities || [],
                    occupancy: data.occupancy || 'Other',
                    gender: data.gender || 'Unisex',
                } as Room;
            });
            setAllRooms(fetchedRooms);

        } catch (error) {
            console.error("Error fetching rooms:", error);
            setAllRooms([]); 
        } finally {
            setIsLoading(false);
        }
    }
    
    getRooms();
  }, [managerUid, hostelName]);

  const groupedRooms = useMemo(() => {
    let filteredRooms = allRooms;

    if (selectedOccupancy !== 'all') {
        filteredRooms = filteredRooms.filter(room => room.occupancy === selectedOccupancy);
    }
    
    if (selectedGender !== 'all') {
        filteredRooms = filteredRooms.filter(room => room.gender === selectedGender);
    }

    const roomsByOccupancy: GroupedRooms = {};
    filteredRooms.forEach(room => {
        if (!roomsByOccupancy[room.occupancy]) {
            roomsByOccupancy[room.occupancy] = [];
        }
        roomsByOccupancy[room.occupancy].push(room);
    });
    
    const sortedKeys = Object.keys(roomsByOccupancy).sort();
    const sortedGroupedRooms: GroupedRooms = {};
    for (const key of sortedKeys) {
        sortedGroupedRooms[key] = roomsByOccupancy[key];
    }
    return sortedGroupedRooms;
  }, [allRooms, selectedOccupancy, selectedGender]);
  
  const occupancyOptions = useMemo(() => {
      const uniqueOccupancies = new Set(allRooms.map(room => room.occupancy));
      return Array.from(uniqueOccupancies).sort();
  }, [allRooms]);


  return (
    <>
        <div className="mb-4 border-b pb-4">
            <p className="text-sm text-primary font-semibold font-headline tracking-wider">ROOMS AVAILABLE AT</p>
            {isLoading ? <Skeleton className="h-9 w-64 mt-1" /> : <h1 className="text-3xl font-bold font-headline">{hostelName}</h1>}
        </div>

        <Card className="mb-8">
            <CardHeader className='flex-row items-center gap-3 space-y-0'>
                <Filter className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="font-headline text-lg">Filter Rooms</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <Select value={selectedOccupancy} onValueChange={setSelectedOccupancy} disabled={isLoading || occupancyOptions.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by room type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Room Types</SelectItem>
                        {occupancyOptions.map(option => (
                           <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={selectedGender} onValueChange={setSelectedGender} disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by gender..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="Male">Boys</SelectItem>
                        <SelectItem value="Female">Girls</SelectItem>
                        <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

         {isLoading ? (
            <div className="space-y-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-8 w-48 mb-4" />
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                           {[...Array(3)].map((_, j) => (
                                <Card key={j} className="overflow-hidden flex flex-col">
                                    <Skeleton className="h-48 w-full" />
                                    <CardContent className="pt-6 flex-1 space-y-2">
                                       <Skeleton className="h-6 w-3/4" />
                                       <Skeleton className="h-4 w-full" />
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center">
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-10 w-28" />
                                    </CardFooter>
                                </Card>
                           ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : Object.keys(groupedRooms).length === 0 ? (
            <div className="text-center py-16">
                <Bed className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mt-4">No Available Rooms</h2>
                <p className="text-muted-foreground mt-2">There are currently no available rooms for this hostel that match your filter.</p>
                 <Button asChild className="mt-6">
                    <Link href="/student/rooms">Back to Hostels</Link>
                </Button>
            </div>
        ) : (
            <div className="space-y-12">
                {Object.entries(groupedRooms).map(([category, rooms]) => {
                const isExpanded = expandedCategories[category];
                const visibleRooms = isExpanded ? rooms : rooms.slice(0, 3);
                
                return (
                    <div key={category}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold font-headline">{category}</h3>
                            {rooms.length > 3 && (
                            <Button variant="link" className="text-primary" onClick={() => toggleCategory(category)}>
                                {isExpanded ? 'View Less' : 'View More'}
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                            )}
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {visibleRooms.map(room => (
                                <Card key={room.id} className="overflow-hidden flex flex-col group">
                                    <CardHeader className="p-0 relative">
                                            <Badge className="absolute top-2 right-2 z-10" variant={room.status === 'Available' ? 'default' : 'secondary'}>
                                            {room.status}
                                        </Badge>
                                        <div className="overflow-hidden rounded-t-lg">
                                            <Image
                                                src={room.images[0].src}
                                                alt={room.name}
                                                width={600}
                                                height={400}
                                                className="aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={room.images[0].hint}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 flex-1">
                                        <CardTitle className="font-headline text-xl mb-2">{room.name}</CardTitle>
                                        <CardDescription>{room.amenities.join(', ')}</CardDescription>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center">
                                        <p className="font-semibold text-lg">GHS {room.price}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                                        <Button asChild disabled={room.status === 'Occupied'}>
                                            <Link href={`/student/rooms/${room.id}`}>View Details</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                    )
                })}
            </div>
        )}
    </>
  )
}

    