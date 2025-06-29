import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { CheckCircle2, Wifi, Wind, Bath, Tv, Users } from "lucide-react"

const roomDetails = {
    id: "2",
    name: "Deluxe Single Room",
    price: 7500,
    images: [
        { src: "https://placehold.co/600x400.png", hint: "modern room" },
        { src: "https://placehold.co/600x400.png", hint: "desk view" },
        { src: "https://placehold.co/600x400.png", hint: "bathroom" },
    ],
    status: "Available",
    type: "Deluxe",
    description: "Our Deluxe Single Room offers a perfect blend of comfort and style, designed for the modern student. Enjoy a spacious layout, premium furnishings, and a private, serene environment to focus on your studies and relax. This room comes fully equipped with all the essential amenities to make your stay hassle-free.",
    amenities: [
        { icon: Wifi, text: "High-speed Wi-Fi" },
        { icon: Wind, text: "Air Conditioning" },
        { icon: Bath, text: "Private Bathroom" },
        { icon: Tv, text: "Flat-screen TV" },
        { icon: Users, text: "Single Occupancy" },
    ]
};


export default function RoomDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <Carousel className="w-full">
            <CarouselContent>
                {roomDetails.images.map((image, index) => (
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
                {roomDetails.amenities.map(amenity => (
                    <div key={amenity.text} className="flex items-center gap-3">
                        <amenity.icon className="w-5 h-5 text-primary"/>
                        <span>{amenity.text}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      <div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-3xl">{roomDetails.name}</CardTitle>
                        <CardDescription>Room ID: {params.id}</CardDescription>
                    </div>
                    <Badge variant="default">{roomDetails.status}</Badge>
                </div>
                <p className="font-semibold text-3xl pt-4">GHS {roomDetails.price}<span className="text-lg font-normal text-muted-foreground">/year</span></p>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" defaultValue="Ama Ata Aidoo" disabled/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue="ama.a@university.edu" disabled/>
                    </div>
                    <Button size="lg" className="w-full text-lg">
                        <CheckCircle2 className="mr-2 h-5 w-5"/>
                        Book Now
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">By booking, you agree to the terms and conditions.</p>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
