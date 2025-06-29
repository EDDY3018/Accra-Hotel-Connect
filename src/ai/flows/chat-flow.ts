'use server';
/**
 * @fileOverview A chatbot flow for assisting students.
 *
 * - studentChat - A function that handles chatbot conversations.
 * - StudentChatInput - The input type for the studentChat function.
 * - StudentChatOutput - The return type for the studentChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentChatInputSchema = z.string().describe('The user message to the chatbot.');
export type StudentChatInput = z.infer<typeof StudentChatInputSchema>;

const StudentChatOutputSchema = z.string().describe('The chatbot\'s response.');
export type StudentChatOutput = z.infer<typeof StudentChatOutputSchema>;


export async function studentChat(prompt: StudentChatInput): Promise<StudentChatOutput> {
  const llmResponse = await ai.generate({
    prompt: `You are a friendly and helpful assistant for AccraHostelConnect, a student hostel booking platform. Your primary role is to assist students with their questions about the hostel, bookings, payments, and other services. Keep your answers concise and helpful.

    User question: "${prompt}"`,
    model: 'googleai/gemini-2.0-flash',
  });

  return llmResponse.text;
}
