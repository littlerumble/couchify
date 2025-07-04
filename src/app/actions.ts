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
  const API_URL = "https://not-lain-background-removal.hf.space/gradio_api/call/image";
  
  try {
    // Step 1: POST to initiate the process and get an event ID.
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [imageDataUri],
      }),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`Gradio API returned an error on initial call: ${postResponse.status} - ${errorText}`);
    }

    const postData = await postResponse.json();
    const eventId = postData.event_id;

    if (!eventId) {
      throw new Error('Could not get an event ID from the Gradio API.');
    }

    // Step 2: Connect to the SSE endpoint to get the result.
    const streamUrl = `${API_URL}/${eventId}`;
    const getResponse = await fetch(streamUrl);

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Gradio API stream returned an error: ${getResponse.status} - ${errorText}`);
    }

    if (!getResponse.body) {
      throw new Error('Response body is not available for streaming.');
    }

    const reader = getResponse.body.getReader();
    const decoder = new TextDecoder();

    // The promise will resolve when the correct event is found, or reject on timeout.
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reader.cancel();
        reject(new Error('Request to Gradio API timed out after 45 seconds.'));
      }, 45000); // 45-second timeout, as image processing can be slow.

      let buffer = '';
      
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Stream finished without a "process_completed" message.
            reject(new Error('Stream ended unexpectedly before completion.'));
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep the last, potentially incomplete line for the next chunk.

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const jsonStr = line.substring(5).trim();
              try {
                const eventData = JSON.parse(jsonStr);

                if (eventData.msg === 'process_completed') {
                  clearTimeout(timeout);
                  reader.cancel();
                  if (eventData.success && eventData.output?.data?.[0]) {
                    resolve({ success: true, image: eventData.output.data[0] });
                  } else {
                    const errorDetail = JSON.stringify(eventData.output?.error || 'No error details provided.');
                    reject(new Error(`Gradio process completed but failed: ${errorDetail}`));
                  }
                  return; // Exit the loop and function.
                } else if (eventData.msg === 'queue_full' || eventData.msg === 'estimation' || eventData.msg === 'process_generating') {
                  // These are normal intermediate messages, just continue listening.
                }

              } catch (e) {
                // Ignore JSON parse errors for non-final or malformed messages.
              }
            }
          }
        }
      };

      processStream().catch(err => {
        clearTimeout(timeout);
        reader.cancel();
        reject(err);
      });
    });

  } catch (error: any) {
    console.error('Failed to remove background with Gradio API:', error);
    return { success: false, error: error.message || 'An unknown error occurred during background removal.' };
  }
}
