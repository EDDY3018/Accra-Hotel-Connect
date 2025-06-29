import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, FileWarning, BedDouble } from "lucide-react";

const announcements = [
  { id: 1, title: "Quarterly Pest Control", date: "2024-05-15", content: "Pest control services will be conducted on all floors this Friday. Please ensure your food items are sealed." },
  { id: 2, title: "End of Semester Checkout", date: "2024-05-10", content: "The deadline for moving out is May 30th. Please schedule your checkout inspection at the front desk." },
];

export default function StudentDashboardPage() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Welcome back, Ama!</CardTitle>
            <CardDescription>Here's a summary of your stay.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <BedDouble className="w-6 h-6 text-primary" />
                <h3 className="font-semibold">Your Room</h3>
              </div>
              <p className="text-2xl font-bold">B203</p>
              <p className="text-sm text-muted-foreground">Deluxe Single Room</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FileWarning className="w-6 h-6 text-destructive" />
                <h3 className="font-semibold">Outstanding Balance</h3>
              </div>
              <p className="text-2xl font-bold">GHS 500.00</p>
              <p className="text-sm text-muted-foreground">Due: 2024-06-01</p>
              <Button size="sm" className="mt-2">Pay Now</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-headline text-lg">Announcements</CardTitle>
            <Bell className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {announcements.map((item) => (
                <div key={item.id} className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
