'use server';
import {promises as fs} from 'fs';
import path from 'path';

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

const couchImageGenerationFlow = ai.defineFlow(
  {
    name: 'couchImageGenerationFlow',
    inputSchema: CouchImageGenerationInputSchema,
    outputSchema: CouchImageGenerationOutputSchema,
  },
  async (input) => {
    // Correctly determine the user uploaded image's content type
    const userImageContentType = input.photoDataUri.match(/data:([^;]+);base64,/)?.[1];
    if (!userImageContentType) {
      throw new Error('Invalid data URI: could not determine content type for user image.');
    }

    // Read the base image from the file system
    const imagePath = path.join(process.cwd(), 'src', 'ai', '5989857315257436567.jpg');
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const baseImageDataUri = `data:image/jpeg;base64,${base64Image}`;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: baseImageDataUri, contentType: 'image/jpeg'}},
        {media: {url: input.photoDataUri, contentType: userImageContentType}},
        {text: 'You are a photoshop expert. The first image is the background, which contains a white couch with four shirtless men standing behind it. The second image contains a subject. Your task is to perfectly composite the subject from the second image so it is sitting on the white couch in the first image. It is critical that you DO NOT change the background image (the first image) at all. The people in the background must not be removed or altered.'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
        ]
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to produce an image.');
    }
    
    return {generatedCouchImage: media.url};
  }
);
