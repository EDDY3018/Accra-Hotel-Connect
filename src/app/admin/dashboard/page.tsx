"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Users, BedDouble, BookCheck, LifeBuoy } from "lucide-react"

const occupancyData: any[] = [];
const ticketsData: any[] = [];

export default function AdminDashboard() {
  return (
    <>
        <h1 className="text-3xl font-bold font-headline mb-6">Hostel Manager Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No student data available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Occupancy Rate
              </CardTitle>
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                No room data available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Bookings</CardTitle>
              <BookCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No new bookings this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                No open tickets
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-2 mt-8">
            <Card className="xl:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline">Room Type Occupancy</CardTitle>
                    <CardDescription>Current occupancy status by room category.</CardDescription>
                </CardHeader>
                <CardContent>
                  {occupancyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={occupancyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="occupied" fill="hsl(var(--primary))" name="Occupied" />
                            <Bar dataKey="total" fill="hsl(var(--muted))" name="Total" />
                        </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      <p>No occupancy data to display.</p>
                    </div>
                  )}
                </CardContent>
            </Card>
            <Card className="xl:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline">Support Tickets Overview</CardTitle>
                    <CardDescription>Open vs. closed tickets over the past months.</CardDescription>
                </CardHeader>
                <CardContent>
                    {ticketsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={ticketsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                             <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="open" stackId="a" fill="hsl(var(--destructive))" name="Open"/>
                            <Bar dataKey="closed" stackId="a" fill="hsl(var(--primary))" name="Closed"/>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <p>No ticket data to display.</p>
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  )
}
