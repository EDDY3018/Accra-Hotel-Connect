import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const tickets = [
  { id: "T002", subject: "Wi-Fi not working", status: "In Progress", date: "2024-05-19", description: "I haven't been able to connect to the hostel Wi-Fi since this morning.", response: "Our technical team is aware of the issue and is working to resolve it. We expect service to be restored within 2 hours." },
  { id: "T003", subject: "Noise Complaint", status: "Closed", date: "2024-05-18", description: "My neighbors were playing loud music late into the night.", response: "We have spoken to the students in the concerned room and issued a warning. Please let us know if the issue persists." },
];

export default function SupportPage() {
  return (
    <Tabs defaultValue="my-tickets" className="w-full">
      <div className="flex items-center">
        <TabsList>
            <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="new-ticket">New Ticket</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="my-tickets">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">My Support Tickets</CardTitle>
                <CardDescription>View the status of your support requests and complaints.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                {tickets.map((ticket) => (
                    <AccordionItem value={ticket.id} key={ticket.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span>{ticket.subject}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground hidden md:inline">{ticket.date}</span>
                                <Badge variant={ticket.status === "Open" ? "destructive" : ticket.status === "In Progress" ? "default" : "secondary"} className="bg-accent text-accent-foreground">
                                    {ticket.status}
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <p><span className="font-semibold">My complaint:</span> {ticket.description}</p>
                            <p className="border-t pt-4 mt-4"><span className="font-semibold">Admin response:</span> {ticket.response || "Awaiting response from admin."}</p>
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="new-ticket">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Submit a New Ticket</CardTitle>
                <CardDescription>Have an issue? Let us know, and we&apos;ll get back to you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="e.g., Leaky Faucet in Bathroom" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" rows={5} placeholder="Please describe the issue in detail." />
                </div>
                <Button>Submit Ticket</Button>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
