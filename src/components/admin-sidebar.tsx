"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

const adminNavItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/bookings", icon: BookCheck, label: "Bookings" },
  { href: "/admin/rooms", icon: BedDouble, label: "Rooms" },
  { href: "/admin/support", icon: LifeBuoy, label: "Support Tickets" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    // Note: No real auth for admin, just a redirect
    toast({ title: "Logged Out", description: "You have been logged out successfully." });
    router.push("/auth/login");
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
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-sm">Admin User</span>
                        <span className="text-xs text-muted-foreground">admin@hostel.com</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href="/admin/settings">
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
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
