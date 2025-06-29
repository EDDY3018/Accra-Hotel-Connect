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

const students: any[] = [];

export default function AdminStudentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Students</CardTitle>
        <CardDescription>Manage student information and payment status.</CardDescription>
        <div className="flex items-center gap-2 pt-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-8" />
          </div>
          <Button>Add Student</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Room No.</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {students.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center">No students found.</TableCell>
                </TableRow>
            ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.room}</TableCell>
                    <TableCell>
                      <Badge variant={
                        student.paymentStatus === "Paid" ? "default" :
                        student.paymentStatus === "Partial" ? "secondary" : "destructive"
                      }>
                        {student.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {student.paymentStatus === 'Partial' && (
                            <div>
                                <span className="line-through text-muted-foreground/80 mr-2">
                                    GHS {student.totalFee.toFixed(2)}
                                </span>
                                <span>GHS {student.balance.toFixed(2)}</span>
                            </div>
                        )}
                         {student.paymentStatus === 'Unpaid' && (
                             <span>GHS {student.balance.toFixed(2)}</span>
                        )}
                        {student.paymentStatus === 'Paid' && (
                             <span>GHS 0.00</span>
                        )}
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
