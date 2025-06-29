'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateLegalDoc, type LegalDocInput } from '@/ai/flows/legal-flow';
import { Skeleton } from './ui/skeleton';

interface LegalModalProps {
  topic: 'Terms of Service' | 'Privacy Policy';
  appName: string;
}

export function LegalModal({ topic, appName }: LegalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !content) {
      const fetchContent = async () => {
        setIsLoading(true);
        setError('');
        try {
          const input: LegalDocInput = { topic, appName };
          const result = await generateLegalDoc(input);
          setContent(result.content);
        } catch (err) {
          console.error(err);
          setError('Failed to generate document. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchContent();
    }
  }, [isOpen, content, topic, appName]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="text-xs h-auto p-0 underline-offset-4 font-normal text-muted-foreground"
        >
          {topic}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{topic}</DialogTitle>
          <DialogDescription>
            This document governs your use of {appName}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border p-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {content && (
            <pre className="whitespace-pre-wrap text-sm font-body">
              {content}
            </pre>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
