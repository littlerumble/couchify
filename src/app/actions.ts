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
  const API_URL = "https://not-lain-background-removal.hf.space/run/predict";
  
  try {
    // Convert data URI to a Blob, which is necessary for file uploads in FormData
    const fetchResponse = await fetch(imageDataUri);
    const imageBlob = await fetchResponse.blob();

    // Create FormData and append the image blob and function index
    const formData = new FormData();
    // The filename 'image.png' is arbitrary but helps the server identify the file type
    formData.append('data', imageBlob, 'image.png');
    formData.append('fn_index', '0');

    // Make the POST request to the Gradio API
    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Background removal API returned an error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const processedImage = json.data?.[0];

    // Check if the response is a valid image data URI
    if (processedImage && processedImage.startsWith('data:image')) {
        return { success: true, image: processedImage };
    } else {
        console.error('Unexpected format from background removal API:', processedImage);
        throw new Error('Received an unexpected image format from the API.');
    }

  } catch (error: any) {
    console.error('Failed to remove background:', error);
    return { success: false, error: error.message || 'An unknown error occurred during background removal.' };
  }
}
