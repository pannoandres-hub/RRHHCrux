import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Upload, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  allowImageUpload?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  title = 'Firma Digital Manuscrita',
  allowImageUpload = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1E3A8A'; // Dark blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setUploadedImage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
        setHasDrawn(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (uploadedImage) {
      onSave(uploadedImage);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-md w-full space-y-4 text-zinc-100 shadow-2xl">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-indigo-400" />
          <h4 className="font-semibold text-sm text-white">{title}</h4>
        </div>
        <span className="text-[11px] text-zinc-500">Dibuja con el dedo o mouse</span>
      </div>

      {uploadedImage ? (
        <div className="w-full h-44 bg-white rounded-lg flex items-center justify-center p-4 border border-zinc-700">
          <img src={uploadedImage} alt="Firma subida" className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div className="relative border border-zinc-700 rounded-lg bg-zinc-950 overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={380}
            height={160}
            className="w-full h-40 touch-none block"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-xs">
              Traza tu firma aquí sobre la línea punteada
            </div>
          )}
          <div className="absolute bottom-4 left-6 right-6 border-b border-dashed border-zinc-700 pointer-events-none" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>

          {allowImageUpload && (
            <label className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cargar Imagen</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasDrawn}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded font-medium transition-colors ${
              hasDrawn
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Estampar Firma</span>
          </button>
        </div>
      </div>
    </div>
  );
};
