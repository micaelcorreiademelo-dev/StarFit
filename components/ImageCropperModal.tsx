import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
  title?: string;
  aspectRatio?: 'circle' | 'square' | 'portrait';
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCrop,
  title = "Ajustar Foto do Perfil",
  aspectRatio = 'circle'
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and offset when a new image is loaded
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

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.current.x,
      y: touch.clientY - dragStart.current.y
    });
  };

  const handleConfirm = () => {
    const img = imageRef.current;
    if (!img) return;

    // Create a 150x150 canvas for highly optimized 1:1 profile photo (forces tiny base64 size)
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background with brand tone
    ctx.fillStyle = '#182c1e'; // Default brand tone
    ctx.fillRect(0, 0, 150, 150);

    // Calculate dimensions of the image relative to the crop box
    const rect = img.getBoundingClientRect();
    const viewSize = 240; // Our viewport UI is 240x240

    // Ratio between original natural image dimensions and its displayed client size
    const clientW = rect.width / zoom;
    const clientH = rect.height / zoom;

    // Translate to the canvas center (75, 75)
    ctx.translate(75, 75);
    ctx.scale(zoom * (150 / viewSize), zoom * (150 / viewSize));
    
    // Convert translation offset from display coordinates
    const scaleRatio = 1;
    ctx.translate(offset.x * scaleRatio / zoom, offset.y * scaleRatio / zoom);

    // Draw the image centered
    const drawW = clientW;
    const drawH = clientH;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    // Convert to a highly compressed jpeg data-url (typically ~3Kb - 5Kb total)
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
    onCrop(croppedDataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card-dark border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-dark bg-background-dark/50">
          <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="flex items-center justify-center size-8 rounded-full bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content - Interactive Crop Area */}
        <div className="p-6 flex flex-col items-center gap-6">
          <p className="text-xs text-text-secondary text-center">
            Arraste para posicionar o seu rosto dentro da marcação e use o slider para ajustar o zoom.
          </p>

          <div 
            ref={containerRef}
            className={`relative bg-background-dark border border-border-dark overflow-hidden flex items-center justify-center touch-none select-none ${
               aspectRatio === 'portrait' ? 'w-56 h-[300px] rounded-xl' : 'size-60 rounded-xl'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
          >
            {/* Viewport Mask Circular/Square Overlay */}
            <div 
              className={`absolute pointer-events-none z-10 border-2 border-primary/50 shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] ${
                aspectRatio === 'circle' ? 'rounded-full size-60' : aspectRatio === 'portrait' ? 'rounded-lg w-56 h-[300px]' : 'rounded-lg size-60'
              }`}
            />

            {/* The Image being transformed */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Cropping Profile"
              className="max-w-[400%] max-h-[400%] object-contain pointer-events-none select-none"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out',
                width: '180px',
                height: '180px'
              }}
            />
          </div>

          {/* Zoom Slider Controls */}
          <div className="w-full flex items-center gap-3">
            <span className="material-symbols-outlined text-text-secondary select-none text-lg">zoom_out</span>
            <input 
              type="range" 
              min="1" 
              max="4" 
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-primary h-1.5 bg-border-dark rounded-lg cursor-pointer"
            />
            <span className="material-symbols-outlined text-text-secondary select-none text-lg">zoom_in</span>
          </div>

          {/* Tips */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-[11px] font-medium">
            <span className="material-symbols-outlined text-sm">face</span>
            <span>Ajuste preferencialmente focando no seu rosto!</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-background-dark/50 border-t border-border-dark flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-white font-bold transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-primary text-background-dark hover:brightness-110 font-black text-sm rounded-lg transition-all shadow-md hover:scale-[1.02]"
          >
            Confirmar Corte
          </button>
        </div>
      </div>
    </div>
  );
};
