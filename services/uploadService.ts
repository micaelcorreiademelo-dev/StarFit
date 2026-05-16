import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

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
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    onProgress,
    folder = 'uploads',
  } = options;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    if (onProgress) {
        onProgress(30); // Simulate progress as fetch doesn't support upload progress naturally
    }

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    if (onProgress) {
        onProgress(80);
    }

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (onProgress) {
        onProgress(100);
    }
    
    return data;
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
