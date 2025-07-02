'use server';
/**
 * @fileOverview An AI flow for blending a subject into a background image.
 *
 * - blendImage - A function that takes a composite image and blends the subject into the background.
 * - BlendImageInput - The input type for the blendImage function.
 * - BlendImageOutput - The return type for the blendImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BlendImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A composite photo with a subject placed on a background, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BlendImageInput = z.infer<typeof BlendImageInputSchema>;

const BlendImageOutputSchema = z.object({
  blendedImage: z
    .string()
    .describe('The blended image, as a data URI.'),
});
export type BlendImageOutput = z.infer<typeof BlendImageOutputSchema>;

export async function blendImage(
  input: BlendImageInput
): Promise<BlendImageOutput> {
  return blendImageFlow(input);
}

const blendImageFlow = ai.defineFlow(
  {
    name: 'blendImageFlow',
    inputSchema: BlendImageInputSchema,
    outputSchema: BlendImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.photoDataUri}},
        {text: 'Blend the image added inside the couch. Without changing the scene or the couch, just blend the image / person / item near / on the couch to match the background.'},
      ],
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
      throw new Error('Image generation failed to blend the image.');
    }

    return {blendedImage: media.url};
  }
);
