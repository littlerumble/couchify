'use server';

/**
 * @fileOverview AI flow to generate an image of the subject of an image sitting on a couch.
 *
 * - couchImageGeneration - A function that handles the image generation process.
 * - CouchImageGenerationInput - The input type for the couchImageGeneration function.
 * - CouchImageGenerationOutput - The return type for the couchImageGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CouchImageGenerationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of something, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CouchImageGenerationInput = z.infer<typeof CouchImageGenerationInputSchema>;

const CouchImageGenerationOutputSchema = z.object({
  generatedCouchImage: z
    .string()
    .describe('The generated image of the subject sitting on a couch, as a data URI.'),
});
export type CouchImageGenerationOutput = z.infer<typeof CouchImageGenerationOutputSchema>;

export async function couchImageGeneration(input: CouchImageGenerationInput): Promise<CouchImageGenerationOutput> {
  return couchImageGenerationFlow(input);
}

const couchImageGenerationPrompt = ai.definePrompt({
  name: 'couchImageGenerationPrompt',
  input: {schema: CouchImageGenerationInputSchema},
  output: {schema: CouchImageGenerationOutputSchema},
  prompt: [
    {media: {url: '{{{photoDataUri}}}'}},
    {text: 'Convincingly render the subject of this image sitting on a couch.'},
  ],
  model: 'googleai/gemini-2.0-flash-preview-image-generation',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const couchImageGenerationFlow = ai.defineFlow(
  {
    name: 'couchImageGenerationFlow',
    inputSchema: CouchImageGenerationInputSchema,
    outputSchema: CouchImageGenerationOutputSchema,
  },
  async input => {
    const {media} = await couchImageGenerationPrompt(input);
    return {generatedCouchImage: media!.url!};
  }
);
