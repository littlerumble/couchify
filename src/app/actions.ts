'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { imageMagic } from '@/ai/flows/remove-background-flow';

export async function saveCreationToServer(imageDataUri: string) {
  try {
    const outputDir = '/home/user/studio/gen_images';
    await fs.mkdir(outputDir, { recursive: true });

    const matches = imageDataUri.match(/^data:(image\/(png|jpeg));base64,(.+)$/);
    if (!matches || matches.length !== 4) {
      throw new Error('Invalid image data URI');
    }

    const fileExtension = matches[2];
    const base64Data = matches[3];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const filename = `${uuidv4()}.${fileExtension}`;
    const outputPath = path.join(outputDir, filename);

    await fs.writeFile(outputPath, imageBuffer);

    revalidatePath('/');
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to save creation to server:', error);
    return { success: false, error: 'Failed to save image.' };
  }
}

export async function removeBackground(imageDataUri: string): Promise<{ success: boolean; image?: string; error?: string }> {
  try {
    const result = await imageMagic({
      photoDataUri: imageDataUri,
      prompt: "Remove the background from this image, keeping only the main subject. Make the background transparent."
    });

    if (!result.generatedImage) {
      throw new Error('AI did not return an image.');
    }

    return { success: true, image: result.generatedImage };

  } catch (error: any) {
    console.error('Failed to remove background with AI:', error);
    return { success: false, error: error.message || 'An unknown error occurred during AI background removal.' };
  }
}
