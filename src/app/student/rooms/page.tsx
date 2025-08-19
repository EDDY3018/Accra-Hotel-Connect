
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, ArrowRight, TrendingUp } from "lucide-react"
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
    hostelName: string;
}

interface GroupedRooms {
    [hostelName: string]: {
        [occupancy: string]: Room[];
    };
}

export default function RoomsPage() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [occupancyFilter, setOccupancyFilter] = useState('all');

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function getRooms() {
        setIsLoading(true);
        try {
            const roomsQuery = query(collection(db, 'rooms'), where('status', '==', 'Available'));
            const roomSnapshot = await getDocs(roomsQuery);

            const fetchedRooms = roomSnapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    name: data.name || "Unnamed Room",
                    price: data.price || 0,
                    images: data.images && data.images.length > 0 ? data.images : [{ src: "https://placehold.co/600x400.png", hint: "hostel room" }],
                    status: data.status || "Available",
                    amenities: data.amenities || [],
                    occupancy: data.occupancy || 'Other',
                    hostelName: data.hostelName || 'Unknown Hostel',
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
  }, []);

  const groupedRooms = useMemo(() => {
    let filtered = [...allRooms];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.hostelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.amenities.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Occupancy filter
    if (occupancyFilter !== 'all') {
      filtered = filtered.filter(room => room.occupancy === `${occupancyFilter} in a room`);
    }

    // Sort
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    // Grouping
    const roomsByHostel: GroupedRooms = {};
    filtered.forEach(room => {
        if (!roomsByHostel[room.hostelName]) {
            roomsByHostel[room.hostelName] = {};
        }
        if (!roomsByHostel[room.hostelName][room.occupancy]) {
            roomsByHostel[room.hostelName][room.occupancy] = [];
        }
        roomsByHostel[room.hostelName][room.occupancy].push(room);
    });
    return roomsByHostel;
  }, [allRooms, searchTerm, sortBy, occupancyFilter]);

  return (
    <>
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">Find Your Next Room</h1>
                <p className="text-muted-foreground">Browse available rooms from our partner hostels.</p>
            </div>
             <div className="relative flex-1 md:flex-initial w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search hostel or room type..." className="pl-8" onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm}/>
            </div>
        </div>

        <Card className="mb-8">
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span>Sort & Filter:</span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Sort by price" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={occupancyFilter} onValueChange={setOccupancyFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Room occupancy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Occupancies</SelectItem>
                            {[1,2,3,4,5,6].map(n => (
                                <SelectItem key={n} value={String(n)}>{n} in a room</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

         {isLoading ? (
             <div className="space-y-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-9 w-64 mb-6" />
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
                <h2 className="text-2xl font-semibold">No Rooms Found</h2>
                <p className="text-muted-foreground mt-2">Your search or filter returned no results. Try something else!</p>
            </div>
        ) : (
            <div className="space-y-16">
                {Object.entries(groupedRooms).map(([hostelName, categories]) => (
                    <div key={hostelName}>
                       <div className="mb-8 border-b pb-4">
                            <p className="text-sm text-primary font-semibold font-headline tracking-wider">HOSTEL NAME</p>
                            <h2 className="text-3xl font-bold font-headline">{hostelName}</h2>
                       </div>
                       <div className="space-y-12">
                         {Object.entries(categories).map(([category, rooms]) => {
                            const categoryKey = `${hostelName}-${category}`;
                            const isExpanded = expandedCategories[categoryKey];
                            const visibleRooms = isExpanded ? rooms : rooms.slice(0, 3);
                            
                            return (
                                <div key={category}>
                                   <div className="flex items-center justify-between mb-4">
                                     <h3 className="text-2xl font-bold font-headline">{category}</h3>
                                     {rooms.length > 3 && (
                                        <Button variant="link" className="text-primary" onClick={() => toggleCategory(categoryKey)}>
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
                    </div>
                ))}
            </div>
        )}
    </>
  )
}
