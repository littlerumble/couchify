'use server';
/**
 * @fileOverview An AI flow for transforming an image based on a user prompt.
 *
 * - imageMagic - A function that takes a composite image and a prompt to generate a new image.
 * - ImageMagicInput - The input type for the imageMagic function.
 * - ImageMagicOutput - The return type for the imageMagic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageMagicInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A composite photo with a subject placed on a background, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .describe('The user-provided prompt to guide the image transformation.'),
});
export type ImageMagicInput = z.infer<typeof ImageMagicInputSchema>;

const ImageMagicOutputSchema = z.object({
  generatedImage: z.string().describe('The generated image, as a data URI.'),
});
export type ImageMagicOutput = z.infer<typeof ImageMagicOutputSchema>;

export async function imageMagic(
  input: ImageMagicInput
): Promise<ImageMagicOutput> {
  return imageMagicFlow(input);
}

const imageMagicFlow = ai.defineFlow(
  {
    name: 'imageMagicFlow',
    inputSchema: ImageMagicInputSchema,
    outputSchema: ImageMagicOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [{media: {url: input.photoDataUri}}, {text: input.prompt}],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {generatedImage: media.url};
  }
);
