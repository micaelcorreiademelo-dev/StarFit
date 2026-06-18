import { storage, auth } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  onProgress?: (progress: number) => void;
  folder?: string;
  fileName?: string;
  userId?: string;
}

export const uploadImage = async (
  file: File,
  options: UploadOptions = {}
): Promise<{ url: string; path: string }> => {
  const {
    onProgress,
    folder = 'uploads',
    userId,
  } = options;

  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop() || 'tmp';
  const safeFileName = options.fileName || `${timestamp}-${uniqueId}`;
  
  // storage.rules allows uploads/{userId}/{allPaths=**} only for authenticated user matching userId.
  let finalFolder = folder;
  if (userId) {
    if (folder.startsWith('landing_pages/') || folder.startsWith('landing-page/')) {
      finalFolder = `landing_pages/${userId}`;
    } else {
      finalFolder = `uploads/${userId}`;
    }
  }
  
  const filePath = `${finalFolder}/${safeFileName}.${extension}`;
  const storageRef = ref(storage, filePath);
  
  // DIAGNOSTIC INFO
  const currentBucket = storage.app.options.storageBucket || "NOT_CONFIGURED";
  const currentUserUid = auth.currentUser ? auth.currentUser.uid : 'SEM_AUTH';
  const currentUserEmail = auth.currentUser ? auth.currentUser.email : 'SEM_EMAIL';
  
  console.log(`[STORAGE DIAGNOSTIC START] 
    - File: ${file.name} 
    - Type: ${file.type} 
    - Size: ${(file.size / 1024).toFixed(2)} KB
    - Path: ${filePath}
    - Bucket: ${currentBucket}
    - User ID: ${currentUserUid}
    - User Email: ${currentUserEmail}
  `);

  const metadata = {
    contentType: file.type || 'image/jpeg',
  };

  return new Promise<{ url: string; path: string }>((resolve, reject) => {
    if (onProgress) {
      onProgress(10);
    }

    try {
      console.log("[STORAGE DIAGNOSTIC] Iniciando uploadBytesResumable...");
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      let uploadStarted = false;
      
      const timeoutId = setTimeout(() => {
        const timeoutError = new Error(`TIMEOUT: O upload no Firebase Storage demorou mais de 25 segundos.
Detalhes do Diagnóstico:
- Bucket: ${currentBucket}
- Caminho: ${filePath}
- Usuário Atual: ${currentUserUid} (${currentUserEmail})
- O upload iniciou? ${uploadStarted ? "Sim (mas travou ou não terminou)" : "Não"}
- Nota: Verifique se o Firebase Storage está devidamente ATIVADO no console do Google Firebase (https://console.firebase.google.com/) para este projeto, pois se o serviço não for habilitado ou não houver bucket padrão configurado, as requisições de upload falharão por timeout silencioso ou CORS no navegador.`);
        
        console.error("[STORAGE DIAGNOSTIC TIMEOUT]", timeoutError);
        uploadTask.cancel();
        reject(timeoutError);
      }, 25000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          uploadStarted = true;
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[STORAGE DIAGNOSTIC PROGRESS] Transferred: ${snapshot.bytesTransferred}/${snapshot.totalBytes} B (${pct.toFixed(1)}%) - State: ${snapshot.state}`);
          if (onProgress) {
            // scale progress from 10% to 90%
            onProgress(10 + (pct * 0.8));
          }
        },
        (error: any) => {
          clearTimeout(timeoutId);
          console.error("[STORAGE DIAGNOSTIC ERROR CALLBACK]:", error);
          
          let detailedMsg = `Erro no Firebase Storage: ${error.message} (${error.code})`;
          if (error.code === 'storage/unauthorized') {
            detailedMsg = `Erro de Permissão (storage/unauthorized): O usuário ${currentUserUid} não possui permissão de escrita para o caminho '${filePath}'. Verifique se as regras do Storage (/storage.rules) permitem gravação para este caminho ou se o usuário está devidamente logado.`;
          } else if (error.code === 'storage/project-not-found') {
            detailedMsg = `Projeto Não Encontrado (storage/project-not-found): O projeto do Firebase não pôde ser localizado ou o Storage não está ativo de todo. Verifique o console do Firebase.`;
          } else if (error.code === 'storage/retry-limit-exceeded') {
            detailedMsg = `Limite de Tentativas Excedido: Problema contínuo de conexão ou CORS bloqueando a requisição para o bucket '${currentBucket}'.`;
          } else if (error.code === 'storage/invalid-checksum') {
            detailedMsg = `Erro de soma de verificação (invalid-checksum).`;
          } else if (error.code === 'storage/canceled') {
            detailedMsg = `A operação de upload no Storage foi cancelada.`;
          }
          
          const enhancedError = new Error(detailedMsg);
          // attach original error properties for debugging
          (enhancedError as any).code = error.code;
          (enhancedError as any).serverResponse = error.serverResponse;
          reject(enhancedError);
        },
        async () => {
          clearTimeout(timeoutId);
          console.log("[STORAGE DIAGNOSTIC SUCCESS] Upload finalizado de bytes. Obtendo getDownloadURL...");
          try {
            if (onProgress) {
              onProgress(95);
            }
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("[STORAGE DIAGNOSTIC URL GERACOES] URL Pública gerada com sucesso:", downloadUrl);
            if (onProgress) {
              onProgress(100);
            }
            resolve({ url: downloadUrl, path: filePath });
          } catch (urlErr: any) {
            console.error("[STORAGE DIAGNOSTIC GET_DOWNLOAD_URL ERROR]:", urlErr);
            reject(new Error(`Erro ao obter a URL pública do arquivo enviado: ${urlErr.message}`));
          }
        }
      );
    } catch (startErr: any) {
      console.error("[STORAGE DIAGNOSTIC TRIGGER ERROR]:", startErr);
      reject(new Error(`Falha imediata ao instanciar ou iniciar a tarefa de upload: ${startErr.message}`));
    }
  });
};

export const getStoragePathFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    if (url.includes('firebasestorage.googleapis.com')) {
      const parts = url.split('/o/');
      if (parts.length > 1) {
        const pathWithQuery = parts[1];
        const pathOnly = pathWithQuery.split('?')[0];
        return decodeURIComponent(pathOnly);
      }
    }
  } catch (error) {
    console.error('Error parsing storage URL:', error);
  }
  return null;
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
