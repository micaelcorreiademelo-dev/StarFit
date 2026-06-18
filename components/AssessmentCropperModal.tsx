import React, { useState, useRef, useEffect } from 'react';

interface AssessmentCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
  title?: string;
  aspectRatioLabel?: string;
}

export const AssessmentCropperModal: React.FC<AssessmentCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
  title = "Ajustar Foto de Avaliação",
  aspectRatioLabel = "Proporção 3:4"
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.current.x,
        y: touch.clientY - dragStart.current.y
      });
    }
  };

  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    // Output dimension (higher res for body evaluation, 3:4 proportion)
    const outW = 600;
    const outH = 800;
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a'; // background-dark
    ctx.fillRect(0, 0, outW, outH);

    const rect = img.getBoundingClientRect();
    const viewW = 224; // w-56
    const viewH = 300; // h-[300px]

    const clientW = rect.width / zoom;
    const clientH = rect.height / zoom;

    // Center of canvas
    ctx.translate(outW / 2, outH / 2);
    // Scale from view resolution to output resolution
    ctx.scale(zoom * (outW / viewW), zoom * (outH / viewH));
    
    const scaleRatio = 1;
    ctx.translate(offset.x * scaleRatio / zoom, offset.y * scaleRatio / zoom);

    ctx.drawImage(img, -clientW / 2, -clientH / 2, clientW, clientH);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // Good quality
    onCrop(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark bg-background-dark/50">
          <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-6">
          <p className="text-xs text-text-secondary text-center">
            {aspectRatioLabel} - Arraste a imagem para enquadrar o corpo completamente nas linhas guias.
          </p>

          <div 
            ref={containerRef}
            className="relative w-56 h-[300px] bg-background-dark border border-border-dark rounded-xl overflow-hidden flex items-center justify-center touch-none select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
          >
            {/* Outline / Mask (Portrait) */}
            <div className="absolute pointer-events-none z-10 border-2 border-primary/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] rounded-lg w-56 h-[300px]">
               {/* Reference Grid lines */}
               <div className="absolute top-[33%] w-full border-t border-primary/30 border-dashed" />
               <div className="absolute top-[66%] w-full border-t border-primary/30 border-dashed" />
               <div className="absolute left-[50%] h-full border-l border-primary/30 border-dashed" />
            </div>

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Cropping Body"
              className="max-w-[400%] max-h-[400%] object-contain pointer-events-none select-none"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="material-symbols-outlined text-text-secondary select-none text-lg">zoom_out</span>
            <input 
              type="range" min="1" max="5" step="0.05"
              value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-primary h-1.5 bg-border-dark rounded-lg cursor-pointer"
            />
            <span className="material-symbols-outlined text-text-secondary select-none text-lg">zoom_in</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-background-dark/50 border-t border-border-dark flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-white font-bold transition-colors"
          >Cancelar</button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-primary text-background-dark hover:brightness-110 font-black text-sm rounded-lg transition-all shadow-md hover:scale-[1.02]"
          >
            Confirmar Enquadramento
          </button>
        </div>
      </div>
    </div>
  );
};
