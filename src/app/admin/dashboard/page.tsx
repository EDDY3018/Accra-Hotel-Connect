
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Users, BedDouble, BookCheck, LifeBuoy } from "lucide-react"
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface OccupancyData {
  name: string;
  total: number;
  occupied: number;
}

interface TicketsData {
    month: string;
    open: number;
    closed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupancyRate: 0,
    newBookings: 0,
    openTickets: 0,
  });
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [ticketsData, setTicketsData] = useState<TicketsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }
      const managerUid = user.uid;

      try {
        // --- Fetch all data in parallel ---
        const [roomsSnapshot, ticketsSnapshot, bookingsSnapshot] = await Promise.all([
          getDocs(query(collection(db, "rooms"), where("managerUid", "==", managerUid))),
          getDocs(query(collection(db, "tickets"), where("managerUid", "==", managerUid))),
          getDocs(query(collection(db, "bookings"), where("managerUid", "==", managerUid))),
        ]);

        // --- Process Rooms & Occupancy ---
        const totalRooms = roomsSnapshot.size;
        const occupiedRooms = roomsSnapshot.docs.filter(doc => doc.data().status === 'Occupied').length;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        const roomTypeCounts = roomsSnapshot.docs.reduce((acc, doc) => {
            const room = doc.data();
            const type = room.name || 'Unknown';
            if (!acc[type]) {
                acc[type] = { name: type, total: 0, occupied: 0 };
            }
            acc[type].total += 1;
            if (room.status === 'Occupied') {
                acc[type].occupied += 1;
            }
            return acc;
        }, {} as { [key: string]: OccupancyData });
        setOccupancyData(Object.values(roomTypeCounts));

        // --- Process Bookings & Students ---
        const oneWeekAgo = Timestamp.now().toMillis() - 7 * 24 * 60 * 60 * 1000;
        const newBookings = bookingsSnapshot.docs.filter(doc => {
            const bookingDate = new Date(doc.data().bookingDate).getTime();
            return bookingDate >= oneWeekAgo;
        }).length;
        
        // Derive unique students from bookings
        const studentUids = new Set(bookingsSnapshot.docs.map(doc => doc.data().studentUid));
        const totalStudents = studentUids.size;

        // --- Process Tickets ---
        const openTickets = ticketsSnapshot.docs.filter(doc => doc.data().status === 'Open').length;

        const monthlyTickets = ticketsSnapshot.docs.reduce((acc, doc) => {
            const ticket = doc.data();
            const createdAtDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date();
            const month = createdAtDate.toLocaleString('default', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { month, open: 0, closed: 0 };
            }
            if (ticket.status === 'Resolved') {
                acc[month].closed += 1;
            } else {
                acc[month].open += 1;
            }
            return acc;
        }, {} as { [key: string]: TicketsData });
        setTicketsData(Object.values(monthlyTickets));


        setStats({
          totalStudents,
          occupancyRate: Math.round(occupancyRate),
          newBookings,
          openTickets,
        });

      } catch (error: any) {
        console.error("Error fetching dashboard data: ", error);
        toast({
          variant: "destructive",
          title: "Failed to fetch dashboard data.",
          description: "Please check your Firestore security rules and network connection. See console for more details.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchDashboardData();
      } else {
        setIsLoading(false); // No user, so stop loading
      }
    });

    return () => unsubscribe();
  }, [toast]);

  if (isLoading) {
    return (
       <>
        <h1 className="text-3xl font-bold font-headline mb-6"><Skeleton className="h-9 w-96" /></h1>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-2 mt-8">
            <Card className="xl:col-span-1"><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
            <Card className="xl:col-span-1"><CardContent><Skeleton className="h-[350px] w-full" /></CardContent></Card>
        </div>
       </>
    )
  }

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
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Currently active students
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
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                Percentage of rooms currently occupied
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Bookings</CardTitle>
              <BookCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.newBookings}</div>
              <p className="text-xs text-muted-foreground">
                in the last 7 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <LifeBuoy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">
                Support tickets awaiting response
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
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="occupied" fill="hsl(var(--primary))" name="Occupied" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total" fill="hsl(var(--muted))" name="Total" radius={[4, 4, 0, 0]} />
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
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                             <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="open" stackId="a" fill="hsl(var(--destructive))" name="Open" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="closed" stackId="a" fill="hsl(var(--primary))" name="Closed" radius={[4, 4, 0, 0]}/>
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
