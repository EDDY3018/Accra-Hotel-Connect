
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { studentChat } from '@/ai/flows/chat-flow';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
}

export function StudentChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [isGreetingLoading, setIsGreetingLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    useEffect(() => {
        const fetchUserData = async () => {
          const user = auth.currentUser;
          if (user) {
            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const fullName = userDoc.data().fullName || 'Student';
                setUserName(fullName);
                 setMessages([{ sender: 'bot', text: `Hello ${fullName}! How can I help you today?` }]);
              }
            } catch (error) {
                console.error("Error fetching user data:", error);
                 setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
            }
          }
          setIsGreetingLoading(false);
        };

        if (isOpen && !userName) {
            fetchUserData();
        }
    }, [isOpen, userName, auth, db]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponse = await studentChat(input);
            const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    size="icon"
                    className="rounded-full w-14 h-14 shadow-lg"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Chatbot"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                </Button>
            </div>
            
            {isOpen && (
                <Card className="fixed bottom-24 right-6 z-50 w-80 h-[28rem] flex flex-col shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                    <CardHeader className="flex flex-row items-center gap-3">
                         <Avatar>
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg font-headline">Hostel Assistant</CardTitle>
                        </div>
                    </CardHeader>
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {isGreetingLoading ? (
                                <div className="flex items-start gap-2.5">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className="w-48 h-12 rounded-lg" />
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'bot' && <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                        <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                 <div className="flex items-end gap-2 justify-start">
                                     <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                     <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm bg-muted">
                                        <p className="animate-pulse">Thinking...</p>
                                     </div>
                                 </div>
                            )}
                        </div>
                    </ScrollArea>
                    <CardFooter className="p-4 border-t">
                        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <Button type="submit" size="icon" disabled={isLoading}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
