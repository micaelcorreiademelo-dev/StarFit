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
      useWebWorker: true,
      fileType: 'image/webp',
    };
    
    // Attempt compression
    const compressedFile = await imageCompression(file, compressionOptions);

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 10);
    const extension = 'webp'; // Since we convert to webp
    const safeFileName = options.fileName || `${timestamp}-${uniqueId}`;
    const filePath = `${folder}/${safeFileName}.${extension}`;

    // 2. Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ url, path: filePath });
          } catch (err) {
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
