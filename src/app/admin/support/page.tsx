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

const tickets: any[] = [];

export default function AdminSupportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Support Tickets</CardTitle>
        <CardDescription>View and respond to student support tickets and complaints.</CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                <p>No support tickets found.</p>
            </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  )
}
