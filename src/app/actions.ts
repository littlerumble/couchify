'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

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
  // This server action calls a public Gradio API to remove the background from an image.
  // We are using a standard request-response endpoint for reliability in a serverless environment.
  const API_URL = 'https://not-lain-background-removal.hf.space/run/predict';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Standard Gradio API payload for file/image inputs
        // Adding fn_index to make the request more explicit for some API versions.
        fn_index: 0,
        data: [imageDataUri],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Background removal API failed with status: ${response.status}. Details: ${errorText}`);
    }

    const result = await response.json();

    // The result is typically nested in a 'data' array
    const outputImage = result?.data?.[0];

    if (!outputImage) {
      throw new Error('API did not return an image.');
    }

    return { success: true, image: outputImage };

  } catch (error: any) {
    console.error('Failed to remove background:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
