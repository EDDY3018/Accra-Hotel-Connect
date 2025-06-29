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

const students = [
  { id: "S001", name: "Kwame Nkrumah", email: "kwame.n@university.edu", room: "A101", status: "Checked In" },
  { id: "S002", name: "Ama Ata Aidoo", email: "ama.a@university.edu", room: "B203", status: "Checked In" },
  { id: "S003", name: "Kofi Annan", email: "kofi.a@university.edu", room: "C305", status: "Checked Out" },
  { id: "S004", name: "Yaa Asantewaa", email: "yaa.a@university.edu", room: "A102", status: "Checked In" },
  { id: "S005", name: "Efua Sutherland", email: "efua.s@university.edu", room: "D401", status: "Pending" },
  { id: "S006", name: "Osei Tutu", email: "osei.t@university.edu", room: "B204", status: "Checked In" },
];

export default function AdminStudentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Students</CardTitle>
        <CardDescription>Manage student information and status.</CardDescription>
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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.room}</TableCell>
                <TableCell>
                  <Badge variant={student.status === "Checked In" ? "default" : student.status === "Checked Out" ? "secondary" : "destructive"}>
                    {student.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
