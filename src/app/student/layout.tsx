import { StudentHeader } from "@/components/student-header";
import { StudentChatbot } from "@/components/student-chatbot";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <StudentHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/20">
        {children}
      </main>
      <StudentChatbot />
    </div>
  );
}
