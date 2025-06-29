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
import { Edit, PlusCircle, Trash } from "lucide-react"
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

const rooms = [
  { id: "A101", type: "Standard", price: "GHS 5000", status: "Occupied" },
  { id: "A102", type: "Standard", price: "GHS 5000", status: "Occupied" },
  { id: "B203", type: "Deluxe", price: "GHS 7500", status: "Occupied" },
  { id: "C305", type: "Standard", price: "GHS 5000", status: "Available" },
  { id: "D401", type: "Suite", price: "GHS 10000", status: "Maintenance" },
];

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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                    <DialogDescription>
                        Fill in the details to add a new room to the system.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-id" className="text-right">Room No.</Label>
                            <Input id="room-id" defaultValue="E501" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-type" className="text-right">Type</Label>
                             <Select>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="deluxe">Deluxe</SelectItem>
                                    <SelectItem value="suite">Suite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-price" className="text-right">Price (GHS)</Label>
                            <Input id="room-price" type="number" defaultValue="5000" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room-description" className="text-right">Description</Label>
                            <Textarea id="room-description" className="col-span-3" placeholder="Describe the room and its amenities."/>
                        </div>
                    </div>
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
            {rooms.map((room) => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
