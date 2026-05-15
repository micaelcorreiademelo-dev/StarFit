import React, { useState, useRef } from 'react';
import { uploadImage } from '../services/uploadService';

interface ImageUploadProps {
  currentImageUrl?: string;
  onUploadSuccess: (url: string) => void;
  folder: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  idealText?: string;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onUploadSuccess,
  folder,
  maxSizeMB = 1,
  maxWidthOrHeight = 1200,
  idealText = "Resolução ideal: 1200x1200px. Máximo: 1MB",
  label = "Selecionar Imagem",
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validate File Type
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    // Temporary Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadImage(file, {
        maxSizeMB,
        maxWidthOrHeight,
        folder,
        onProgress: (p) => setProgress(p)
      });
      onUploadSuccess(result.url);
      setPreviewUrl(null); // Reset preview and use the actual uploaded URL passed from parent
    } catch (err: any) {
      let msg = 'Erro ao enviar imagem. Tente novamente.';
      if (err.code === 'storage/unauthorized') {
         msg = 'Permissão negada no Firebase Storage. Ative o Storage no painel do Firebase ou ajuste as regras (firestore.rules não cobre Storage).';
      } else if (err.message) {
         msg = err.message;
      }
      setError(msg);
      console.error("ImageUpload Error:", err);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-bold text-white">{label}</span>
      <p className="text-xs text-text-secondary">{idealText}</p>
      
      <div 
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-border-dark bg-background-dark/50 hover:bg-card-dark'} overflow-hidden group`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg, image/png, image/webp" 
          onChange={handleChange}
          disabled={isUploading}
        />
        
        {displayUrl ? (
          <div className="relative w-full aspect-video md:aspect-auto md:h-48 rounded-lg overflow-hidden flex items-center justify-center bg-black/50">
            <img 
              src={displayUrl} 
              alt="Upload Preview" 
              className="w-full h-full object-cover"
            />
            {!isUploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button 
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="px-4 py-2 bg-primary text-background-dark font-bold text-sm rounded-lg shadow-lg"
                 >
                   Trocar Imagem
                 </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
             <div className="size-12 rounded-full bg-border-dark flex items-center justify-center">
                 <span className="material-symbols-outlined text-text-secondary">add_photo_alternate</span>
             </div>
             <button 
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-lg transition-colors border border-border-dark"
             >
               Selecionar Imagem
             </button>
             <p className="text-[10px] text-text-secondary text-center">Ou arraste e solte o arquivo aqui</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 gap-3 z-10">
             <div className="w-full max-w-[200px] h-2 bg-border-dark rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-300 rounded-full" 
                 style={{ width: `${progress}%` }}
               />
             </div>
             <span className="text-white text-xs font-bold">{Math.round(progress)}% Concluído</span>
             <span className="text-text-secondary text-[10px]">
               {progress === 0 ? "Comprimindo imagem..." : progress < 100 ? "Enviando arquivo..." : "Finalizando..."}
             </span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-400 text-xs font-medium bg-red-400/10 border border-red-400/20 p-2 rounded-lg">{error}</p>
      )}
    </div>
  );
};
