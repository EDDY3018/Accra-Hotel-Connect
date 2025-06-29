
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { CheckCircle2, Wifi, Wind, Bath, Tv, Zap, Users, Building, MapPin, Phone } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const amenitiesMap: { [key: string]: { icon: React.ElementType; text: string } } = {
  wifi: { icon: Wifi, text: "High-speed Wi-Fi" },
  ac: { icon: Wind, text: "Air Conditioning" },
  bathroom: { icon: Bath, text: "Private Bathroom" },
  tv: { icon: Tv, text: "Flat-screen TV" },
  electricity: { icon: Zap, text: "Prepaid Electricity" },
};

async function getRoomDetails(id: string) {
    try {
        const roomRef = doc(db, 'rooms', id);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
            return { id: roomSnap.id, ...roomSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching room details:", error);
        return null;
    }
}

export default async function RoomDetailPage({ params }: { params: { id: string } }) {
  const roomDetails = await getRoomDetails(params.id);

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
                    <Badge variant={roomDetails.status === 'Available' ? 'default' : 'secondary'}>
                        {roomDetails.status}
                    </Badge>
                </div>
                <p className="font-semibold text-3xl pt-4">GHS {roomDetails.price}<span className="text-lg font-normal text-muted-foreground">/year</span></p>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" placeholder="Your full name" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="your.email@university.edu" />
                    </div>
                    <Button size="lg" className="w-full text-lg" disabled={roomDetails.status !== 'Available'}>
                        <CheckCircle2 className="mr-2 h-5 w-5"/>
                        {roomDetails.status === 'Available' ? 'Book Now' : 'Occupied'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">By booking, you agree to the terms and conditions.</p>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
