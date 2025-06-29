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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

const bookings: any[] = [];

export default function AdminBookingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Bookings</CardTitle>
        <CardDescription>View and manage all room bookings.</CardDescription>
        <div className="flex items-center gap-2 pt-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bookings..." className="pl-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No bookings found.</TableCell>
                </TableRow>
            ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>{booking.studentName}</TableCell>
                    <TableCell>{booking.roomType}</TableCell>
                    <TableCell>{booking.checkIn}</TableCell>
                    <TableCell>{booking.checkOut}</TableCell>
                    <TableCell>
                      <Badge variant={booking.status === "Paid" ? "default" : booking.status === "Completed" ? "secondary" : "destructive"}>
                        {booking.status}
                      </Badge>
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
