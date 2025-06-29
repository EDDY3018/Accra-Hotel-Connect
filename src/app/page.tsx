import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HostelIcon } from "@/components/icons"
import { BedDouble, FileText, Megaphone, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { LegalModal } from "@/components/legal-modal"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <HostelIcon className="h-8 w-8 text-primary" />
          <span className="sr-only">AccraHostelConnect</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/auth/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/auth/signup" prefetch={false}>Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-24 lg:pt-32">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline text-primary">
                  Find Your Perfect Hostel in Accra
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
                  AccraHostelConnect streamlines your student living experience. Easily browse, book, and manage your stay.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button asChild size="lg">
                    <Link href="/auth/signup" prefetch={false}>Get Started</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                     <Link href="/student/rooms" prefetch={false}>Browse Rooms</Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                 <Image
                    src="https://images.unsplash.com/photo-1543653473-3151b15489a8?q=80&w=600&h=400&auto=format&fit=crop"
                    alt="Hero Hostel"
                    width={600}
                    height={400}
                    className="mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                    data-ai-hint="modern hostel exterior"
                  />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl font-headline">
              Everything You Need in One Place
            </h2>
            <p className="mx-auto max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-center mt-4">
              Our platform offers a seamless experience for both students and administrators.
            </p>
            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3 mt-12">
              <div className="grid gap-1 text-center p-4 rounded-lg hover:bg-card transition-all">
                <BedDouble className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Easy Room Browsing</h3>
                <p className="text-sm text-muted-foreground">
                  Filter and find your ideal room with detailed descriptions and photos.
                </p>
              </div>
              <div className="grid gap-1 text-center p-4 rounded-lg hover:bg-card transition-all">
                <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Secure Bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Book your room and manage payments through our secure online portal.
                </p>
              </div>
              <div className="grid gap-1 text-center p-4 rounded-lg hover:bg-card transition-all">
                <FileText className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Support Tickets</h3>
                <p className="text-sm text-muted-foreground">
                  Easily submit and track complaints or support requests.
                </p>
              </div>
              <div className="grid gap-1 text-center p-4 rounded-lg hover:bg-card transition-all">
                <Megaphone className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Announcements</h3>
                <p className="text-sm text-muted-foreground">
                  Stay updated with important announcements from the hostel administration.
                </p>
              </div>
               <div className="grid gap-1 text-center p-4 rounded-lg hover:bg-card transition-all lg:col-start-2">
                <FileText className="h-10 w-10 mx-auto text-primary" />
                <h3 className="text-lg font-bold font-headline">Admin Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                    Powerful tools for admins to manage students, bookings, and rooms efficiently.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AccraHostelConnect. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <LegalModal topic="Terms of Service" appName="AccraHostelConnect" />
          <LegalModal topic="Privacy Policy" appName="AccraHostelConnect" />
        </nav>
      </footer>
    </div>
  )
}
