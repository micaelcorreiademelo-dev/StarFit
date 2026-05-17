import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  onProgress?: (progress: number) => void;
  folder?: string;
  fileName?: string;
}

export const uploadImage = async (
  file: File,
  options: UploadOptions = {}
): Promise<{ url: string; path: string }> => {
  const {
    onProgress,
    folder = 'uploads',
  } = options;

  try {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split('.').pop() || 'tmp';
    const safeFileName = options.fileName || `${timestamp}-${uniqueId}`;
    const filePath = `${folder}/${safeFileName}.${extension}`;

    const storageRef = ref(storage, filePath);
    console.log("Uploading directly to Firebase Storage:", filePath);
    
    // Config metadata to ensure it's saved correctly
    const metadata = {
      contentType: file.type,
    };

    if (onProgress) {
        onProgress(30); // Started
    }

    const snapshot = await uploadBytes(storageRef, file, metadata);
    
    if (onProgress) {
        onProgress(80); // Uploaded, getting URL
    }

    const url = await getDownloadURL(snapshot.ref);

    if (onProgress) {
        onProgress(100); // Complete
    }

    return { url, path: filePath };

  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (path: string): Promise<void> => {
  if (!path) return;
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Ignore internal errors if file doesn't exist
  }
};
