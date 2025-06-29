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
import { Textarea } from "@/components/ui/textarea"

const announcements: any[] = [];

export default function AdminAnnouncementsPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Announcements</CardTitle>
                <CardDescription>Create and manage announcements for students.</CardDescription>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Announcement
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                    <DialogTitle>Create Announcement</DialogTitle>
                    <DialogDescription>
                        Compose a new announcement to be displayed to all students.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ann-title" className="text-right">Title</Label>
                            <Input id="ann-title" placeholder="Announcement Title" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="ann-content" className="text-right pt-2">Content</Label>
                             <Textarea id="ann-content" className="col-span-3" rows={6} placeholder="Type your announcement here."/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline">Save as Draft</Button>
                        <Button type="submit">Publish</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">No announcements found.</TableCell>
                </TableRow>
            ) : (
                announcements.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell className="font-medium">{ann.title}</TableCell>
                    <TableCell>{ann.author}</TableCell>
                    <TableCell>{ann.date}</TableCell>
                    <TableCell>
                      <Badge variant={ann.status === "Published" ? "default" : "secondary"}>
                        {ann.status}
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
