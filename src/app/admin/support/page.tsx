import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const tickets = [
  { id: "T001", student: "Kwame Nkrumah", room: "A101", subject: "Leaky Faucet", status: "Open", date: "2024-05-20", description: "The faucet in my bathroom has been dripping constantly for the past two days. It's wasting water and the noise is disruptive." },
  { id: "T002", student: "Ama Ata Aidoo", room: "B203", subject: "Wi-Fi not working", status: "In Progress", date: "2024-05-19", description: "I haven't been able to connect to the hostel Wi-Fi since this morning. My assignments are due and I need internet access." },
  { id: "T003", student: "Yaa Asantewaa", room: "A102", subject: "Noise Complaint", status: "Closed", date: "2024-05-18", description: "My neighbors were playing loud music late into the night, violating the quiet hours policy." },
];

export default function AdminSupportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Support Tickets</CardTitle>
        <CardDescription>View and respond to student support tickets and complaints.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {tickets.map((ticket) => (
            <AccordionItem value={ticket.id} key={ticket.id}>
              <AccordionTrigger>
                <div className="flex justify-between w-full pr-4 items-center">
                    <div className="flex items-center gap-4 text-left">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarFallback>{ticket.student.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="font-semibold">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground">{ticket.student} - Room {ticket.room}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground hidden md:inline">{ticket.date}</span>
                        <Badge variant={ticket.status === "Open" ? "destructive" : ticket.status === "In Progress" ? "default" : "secondary"} className="bg-accent text-accent-foreground">
                            {ticket.status}
                        </Badge>
                    </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="mb-4 text-sm text-foreground/80">{ticket.description}</p>
                    <div className="grid w-full gap-2">
                        <Textarea placeholder="Type your response here..." />
                        <div className="flex justify-end gap-2">
                             <Button variant="outline">Mark as Resolved</Button>
                             <Button>Send Response</Button>
                        </div>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
