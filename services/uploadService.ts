import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

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
    // 1. Compress Image
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: false,
      alwaysKeepResolution: true
    };
    
    console.log("Starting compression...");
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log("Compression done. Size:", compressedFile.size);

    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const extension = compressedFile.name.split('.').pop() || 'tmp';
    const safeFileName = options.fileName || `${timestamp}-${uniqueId}`;
    const filePath = `${folder}/${safeFileName}.${extension}`;

    const storageRef = ref(storage, filePath);
    console.log("Uploading to:", filePath);
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress}%`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload Task Error:", error);
          reject(error);
        },
        async () => {
          try {
            console.log("Upload task completed. Getting download URL...");
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL obtained:", url);
            resolve({ url, path: filePath });
          } catch (err) {
            console.error("Error getting download URL:", err);
            reject(err);
          }
        }
      );
    });
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
