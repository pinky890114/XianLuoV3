
import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { storage } from '../firebaseConfig';

export type ImageType = 'reference' | 'progress';

const KILOBYTE = 1024;

// Configuration for different image types
const compressionOptions = {
  reference: {
    maxSizeMB: 2,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.9,
    fileType: 'image/webp',
    skipThresholdKB: 500,
  },
  progress: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    initialQuality: 0.75,
    fileType: 'image/webp',
    skipThresholdKB: 200,
  },
};

/**
 * Compresses and uploads an image to Firebase Storage with a differential strategy.
 *
 * @param file The original image file.
 * @param storagePath The path in Firebase Storage to upload the file to (e.g., 'doll-references').
 * @param imageType The type of image ('reference' or 'progress') to determine compression settings.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export const uploadAndCompressImage = async (
  file: File,
  storagePath: string,
  imageType: ImageType
): Promise<string> => {
  const options = compressionOptions[imageType];
  const fileIsTooSmallToCompress = file.size / KILOBYTE < options.skipThresholdKB;

  let fileToUpload = file;

  console.log(`Original file size: ${(file.size / KILOBYTE).toFixed(2)} KB`);

  if (!fileIsTooSmallToCompress) {
    try {
      console.log(`Compressing image with '${imageType}' settings...`);
      const compressedFile = await imageCompression(file, options);
      fileToUpload = new File([compressedFile], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' });
      console.log(`Compressed file size: ${(fileToUpload.size / KILOBYTE).toFixed(2)} KB`);
    } catch (error) {
      console.error('Image compression failed, uploading original file instead.', error);
      // Fallback to original file if compression fails
      fileToUpload = file;
    }
  } else {
    console.log(`File is smaller than ${options.skipThresholdKB}KB, skipping compression.`);
  }

  // Define a unique file path in storage
  const finalStoragePath = `${storagePath}/${Date.now()}-${fileToUpload.name}`;
  const storageRef = ref(storage, finalStoragePath);

  // Set long-lived cache headers for the uploaded image
  const metadata: UploadMetadata = {
    cacheControl: 'public, max-age=31536000',
    contentType: fileToUpload.type,
  };

  try {
    console.log(`Uploading to: ${finalStoragePath}`);
    const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Upload successful! URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
};
