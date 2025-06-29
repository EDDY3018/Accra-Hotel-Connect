"use client";

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation";
import { CircleUser, Menu, BedDouble, Wallet, LifeBuoy, LogOut, Home, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HostelIcon } from "./icons";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const navItems = [
    { href: "/student/dashboard", icon: Home, label: "Dashboard" },
    { href: "/student/rooms", icon: BedDouble, label: "Rooms" },
    { href: "/student/payments", icon: Wallet, label: "Payments" },
    { href: "/student/support", icon: LifeBuoy, label: "Support" },
];

export function StudentHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been logged out successfully." });
        router.push('/auth/login');
    } catch (error) {
        toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while logging out." });
    }
  }

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/student/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <HostelIcon className="h-6 w-6 text-primary" />
          <span className="sr-only">AccraHostelConnect</span>
        </Link>
        {navItems.map((item) => (
            <Link
                key={item.href}
                href={item.href}
                className={cn("transition-colors hover:text-foreground", pathname.startsWith(item.href) ? "text-foreground font-semibold" : "text-muted-foreground")}
            >
                {item.label}
            </Link>
        ))}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <HostelIcon className="h-6 w-6 text-primary" />
              <span className="sr-only">AccraHostelConnect</span>
            </Link>
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn("hover:text-foreground", pathname.startsWith(item.href) ? "text-foreground" : "text-muted-foreground")}
                >
                    {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Optional: Add search if needed later */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/student/settings">
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
      </div>
    </header>
  )
}
