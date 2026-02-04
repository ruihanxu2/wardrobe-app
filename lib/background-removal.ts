import { File, Paths } from 'expo-file-system';

const PHOTOROOM_API_URL = 'https://sdk.photoroom.com/v1/segment';

export interface BackgroundRemovalResult {
  success: boolean;
  extractedUri?: string;
  error?: string;
}

/**
 * Upload image using XMLHttpRequest (more reliable for file uploads in React Native)
 */
function uploadWithXHR(
  url: string,
  apiKey: string,
  imageUri: string
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('x-api-key', apiKey);
    xhr.setRequestHeader('Accept', 'image/png');
    xhr.responseType = 'arraybuffer';
    xhr.timeout = 60000; // 60 second timeout

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network request failed. Please check your internet connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Request timed out. Please try again.'));
    };

    // Create form data
    const formData = new FormData();
    formData.append('image_file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    xhr.send(formData);
  });
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Remove background from an image using Photoroom API
 * Returns a PNG with transparent background
 */
export async function removeBackground(imageUri: string): Promise<BackgroundRemovalResult> {
  const apiKey = process.env.EXPO_PUBLIC_PHOTOROOM_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'Photoroom API key not configured. Please add EXPO_PUBLIC_PHOTOROOM_API_KEY to your .env.local file.',
    };
  }

  try {
    // Normalize the URI - ensure it has file:// prefix for local files
    let normalizedUri = imageUri;
    if (!imageUri.startsWith('file://') && !imageUri.startsWith('http') && !imageUri.startsWith('ph://')) {
      normalizedUri = `file://${imageUri}`;
    }

    console.log('Calling Photoroom API with URI:', normalizedUri);

    // Use XMLHttpRequest for more reliable file upload
    const responseBuffer = await uploadWithXHR(PHOTOROOM_API_URL, apiKey, normalizedUri);

    // Convert response to base64
    const base64Result = arrayBufferToBase64(responseBuffer);

    // Save the PNG to a temporary file
    const outputFile = new File(Paths.cache, `extracted_${Date.now()}.png`);
    outputFile.create();
    outputFile.write(base64Result, { encoding: 'base64' });

    return {
      success: true,
      extractedUri: outputFile.uri,
    };
  } catch (error: any) {
    console.error('Background removal error:', error);

    let errorMessage = error?.message || 'Failed to remove background';

    // Parse specific HTTP errors
    if (errorMessage.includes('HTTP 401') || errorMessage.includes('HTTP 403')) {
      errorMessage = 'Invalid API key';
    } else if (errorMessage.includes('HTTP 402') || errorMessage.includes('HTTP 429')) {
      errorMessage = 'API quota exceeded. Please try manual selection.';
    } else if (errorMessage.includes('HTTP 400')) {
      errorMessage = 'Invalid image format';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
