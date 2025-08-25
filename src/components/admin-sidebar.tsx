
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Bell,
  Home,
  Users,
  BedDouble,
  BookCheck,
  LifeBuoy,
  Megaphone,
  Settings,
  LayoutDashboard,
  LogOut,
  XSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HostelIcon } from "./icons";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { Skeleton } from "./ui/skeleton";


const adminNavItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/bookings", icon: BookCheck, label: "Bookings" },
  { href: "/admin/rooms", icon: BedDouble, label: "Rooms" },
  { href: "/admin/cancellations", icon: XSquare, label: "Cancellations" },
  { href: "/admin/support", icon: LifeBuoy, label: "Support Tickets" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userName, setUserName] = useState("Manager");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // A real user (manager) is logged in
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(userData.fullName || "Hostel Manager");
          setUserEmail(userData.email || "");
        } else {
          // User exists in auth but not in firestore? Fallback.
          setUserName("Hostel Manager");
          setUserEmail(user.email || "");
        }
        setIsLoading(false);
      } else {
        // No user logged in, assume it's the hardcoded admin
        setUserName("Admin User");
        setUserEmail("admin@hostel.com");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  const handleLogout = async () => {
    if (auth.currentUser) {
        try {
            await signOut(auth);
            toast({ title: "Logged Out", description: "You have been logged out successfully." });
            router.push("/");
        } catch (error) {
            toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
        }
    } else {
        // It's the fake admin, just redirect
        toast({ title: "Logged Out", description: "You have been logged out successfully." });
        router.push("/");
    }
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <HostelIcon className="w-8 h-8 text-primary" />
          <span className="text-lg font-semibold font-headline">AccraHostelConnect</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <nav className="flex flex-col gap-2 p-2">
          {adminNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center justify-start gap-3 p-2 h-auto w-full">
                    <Avatar>
                        <AvatarImage src="https://placehold.co/40x40" />
                        <AvatarFallback>{userName?.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                     {isLoading ? (
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm">{userName}</span>
                            <span className="text-xs text-muted-foreground">{userEmail}</span>
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
                <DropdownMenuLabel>Manager Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href="/admin/settings">
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile & Settings</span>
                    </DropdownMenuItem>
                 </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
