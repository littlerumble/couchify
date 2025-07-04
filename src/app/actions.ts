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
    const matches = imageDataUri.match(/^data:(image\/(png|jpeg|gif));base64,(.+)$/);
    if (!matches || matches.length !== 4) {
      throw new Error('Invalid image data URI format for background removal.');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[3];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    const imageBlob = new Blob([imageBuffer], { type: mimeType });
    const fileName = 'user-image.png';

    const formData = new FormData();
    
    const metadata = { path: fileName, meta: { _type: 'gradio.FileData' } };
    formData.append(
      'data',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', imageBlob as any, fileName);
    
    const API_URL_BASE = 'https://not-lain-background-removal.hf.space/gradio_api';
    
    const eventRes = await fetch(`${API_URL_BASE}/call/png`, {
      method: 'POST',
      body: formData,
    });

    if (!eventRes.ok) {
      const errorText = await eventRes.text();
      throw new Error(`API (event) returned an error: ${eventRes.status} - ${errorText}`);
    }

    const eventJson = await eventRes.json();
    const event_id = eventJson.event_id;

    if (!event_id) {
      throw new Error('API did not return an event_id.');
    }
    
    const resultRes = await fetch(`${API_URL_BASE}/call/png/${event_id}`);

    if (!resultRes.ok) {
      const errorText = await resultRes.text();
      throw new Error(`API (result) returned an error: ${resultRes.status} - ${errorText}`);
    }

    const resultJson = await resultRes.json();
    if (resultJson.error) {
      throw new Error(`API processing error: ${resultJson.error}`);
    }

    const filePath = resultJson.data?.[0]?.path;
    if (!filePath) {
      throw new Error('API response did not contain a valid image path.');
    }

    const finalImageUrl = `https://not-lain-background-removal.hf.space/file=${filePath}`;
    
    const imageResponse = await fetch(finalImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download processed image from: ${finalImageUrl}`);
    }
    const finalImageBuffer = await imageResponse.arrayBuffer();
    const finalBase64Image = Buffer.from(finalImageBuffer).toString('base64');
    const finalMimeType = imageResponse.headers.get('content-type') || 'image/png';
    
    return { success: true, image: `data:${finalMimeType};base64,${finalBase64Image}` };

  } catch (error: any) {
    console.error('Failed to remove background:', error);
    return { success: false, error: error.message || 'An unknown error occurred during background removal.' };
  }
}
