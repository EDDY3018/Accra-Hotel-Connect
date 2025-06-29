import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Room {
    id: string;
    name: string;
    price: number;
    image: string;
    hint: string;
    status: 'Available' | 'Occupied' | '1 Spot Left';
    type: 'Standard' | 'Deluxe' | 'Suite';
    amenities: string[];
}

async function getRooms(): Promise<Room[]> {
    try {
        const roomsCol = collection(db, 'rooms');
        const roomSnapshot = await getDocs(roomsCol);
        if (roomSnapshot.empty) {
            console.log("No rooms found in Firestore. Returning empty array.");
            return [];
        }
        const roomList = roomSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || "Unnamed Room",
                price: data.price || 0,
                image: data.image || "https://placehold.co/600x400.png",
                hint: data.hint || "room",
                status: data.status || "Available",
                type: data.type || "Standard",
                amenities: data.amenities || [],
            } as Room;
        });
        return roomList;
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return []; // Return empty array on error
    }
}


export default async function RoomsPage() {
  const rooms = await getRooms();

  return (
    <>
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline">Available Rooms</h1>
                <p className="text-muted-foreground">Browse and find the perfect room for your stay.</p>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
                 <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search rooms..." className="pl-8" />
                </div>
                 <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
         {rooms.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No rooms available at the moment. Please check back later.</p>
            </div>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rooms.map(room => (
                    <Card key={room.id} className="overflow-hidden flex flex-col">
                        <CardHeader className="p-0 relative">
                             <Badge className="absolute top-2 right-2" variant={room.status === 'Available' ? 'default' : room.status.includes('Spot') ? 'default': 'secondary'}>
                                {room.status}
                            </Badge>
                            <Image
                                src={room.image}
                                alt={room.name}
                                width={600}
                                height={400}
                                className="aspect-video object-cover"
                                data-ai-hint={room.hint}
                            />
                        </CardHeader>
                        <CardContent className="pt-6 flex-1">
                            <CardTitle className="font-headline text-xl mb-2">{room.name}</CardTitle>
                            <CardDescription>{room.amenities.slice(0, 4).join(', ')}...</CardDescription>
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
        )}
    </>
  )
}
