'use server';
/**
 * @fileOverview A flow for generating legal documents.
 *
 * - generateLegalDoc - A function that generates legal documents like Terms of Service or Privacy Policy.
 * - LegalDocInput - The input type for the generateLegalDoc function.
 * - LegalDocOutput - The return type for the generateLegalDoc function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LegalDocInputSchema = z.object({
  topic: z.string().describe('The legal document topic, e.g., "Terms of Service" or "Privacy Policy".'),
  appName: z.string().describe('The name of the application.'),
});
export type LegalDocInput = z.infer<typeof LegalDocInputSchema>;

const LegalDocOutputSchema = z.object({
  content: z.string().describe('The generated legal text as a simple string, with sections separated by newlines.'),
});
export type LegalDocOutput = z.infer<typeof LegalDocOutputSchema>;

export async function generateLegalDoc(input: LegalDocInput): Promise<LegalDocOutput> {
  return generateLegalDocFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLegalDocPrompt',
  input: {schema: LegalDocInputSchema},
  output: {schema: LegalDocOutputSchema},
  prompt: `You are a legal expert specializing in online services.
Generate a standard {{topic}} for a web application called "{{appName}}".
The application is a hostel booking platform for students in Accra, Ghana.
It allows students to browse rooms, book them, make payments, and submit support tickets.
The generated text should be a simple string, with clear sections separated by newlines.
Do not use Markdown formatting like hashes for headers. Use simple text titles followed by two newlines.
The tone should be clear and easy to understand for a student audience.
Include standard clauses for such a service, like user accounts, responsibilities, payment terms, and limitations of liability for Terms of Service.
For Privacy Policy, cover data collection (personal info, payment details), data usage, data sharing, and user rights.
`,
});

const generateLegalDocFlow = ai.defineFlow(
  {
    name: 'generateLegalDocFlow',
    inputSchema: LegalDocInputSchema,
    outputSchema: LegalDocOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
