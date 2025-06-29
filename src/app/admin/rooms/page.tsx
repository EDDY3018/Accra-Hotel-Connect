import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, PlusCircle, Trash, Upload, Wifi, Wind, Tv, Zap, Bath } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"


const rooms: any[] = [];

export default function AdminRoomsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Rooms</CardTitle>
                <CardDescription>Manage hostel rooms and their availability.</CardDescription>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Room
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new room to the system.
                    </DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="room-images">Room Images</Label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="room-images-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG up to 1MB</p>
                                    </div>
                                    <Input id="room-images-input" type="file" className="hidden" multiple accept="image/png, image/jpeg" />
                                </label>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="room-id">Room No.</Label>
                                <Input id="room-id" placeholder="e.g., E501" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="room-price">Price (GHS)</Label>
                                <Input id="room-price" type="number" placeholder="5000" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="room-type">Room Occupancy</Label>
                             <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select occupancy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 in a room</SelectItem>
                                    <SelectItem value="2">2 in a room</SelectItem>
                                    <SelectItem value="3">3 in a room</SelectItem>
                                    <SelectItem value="4">4 in a room</SelectItem>
                                    <SelectItem value="5">5 in a room</SelectItem>
                                    <SelectItem value="6">6 in a room</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="room-description">Description</Label>
                            <Textarea id="room-description" placeholder="Describe the room and its amenities."/>
                        </div>
                        <div className="space-y-4">
                            <Label>Amenities</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="amenity-wifi" />
                                    <Label htmlFor="amenity-wifi" className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Wifi className="w-5 h-5 text-muted-foreground" />
                                        <span>Wi-Fi</span>
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="amenity-ac" />
                                    <Label htmlFor="amenity-ac" className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Wind className="w-5 h-5 text-muted-foreground" />
                                        <span>Air-Con</span>
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="amenity-tv" />
                                    <Label htmlFor="amenity-tv" className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Tv className="w-5 h-5 text-muted-foreground" />
                                        <span>TV</span>
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="amenity-electricity" />
                                    <Label htmlFor="amenity-electricity" className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Zap className="w-5 h-5 text-muted-foreground" />
                                        <span>Electricity</span>
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="amenity-bathroom" />
                                    <Label htmlFor="amenity-bathroom" className="font-normal flex items-center gap-2 cursor-pointer">
                                        <Bath className="w-5 h-5 text-muted-foreground" />
                                        <span>Private Bath</span>
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                      <Button type="submit">Save Room</Button>
                    </DialogFooter>
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
            {rooms.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No rooms found.</TableCell>
                </TableRow>
            ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.id}</TableCell>
                    <TableCell>{room.type}</TableCell>
                    <TableCell>{room.price}</TableCell>
                    <TableCell>
                      <Badge variant={room.status === "Occupied" ? "secondary" : room.status === "Available" ? "default" : "destructive"}>
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
  )
}
