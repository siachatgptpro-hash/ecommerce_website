'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Crop, Download, X } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  /** Receives the cropped PNG as a File (transparency preserved). */
  onCropped: (file: File) => void;
  onCancel: () => void;
}

const ASPECTS = [
  { id: '1:1', label: 'Square 1:1', value: 1 },
  { id: '3:2', label: '3:2', value: 1.5 },
  { id: '2:1', label: 'Wide 2:1', value: 2 },
  { id: '3:1', label: 'Banner 3:1', value: 3 },
] as const;

/** Exported logo height in pixels (width follows the chosen aspect). */
const OUTPUT_HEIGHT = 320;
const MAX_VIEWPORT_H = 340;

/**
 * Lightweight drag-and-zoom image cropper (canvas export, no dependencies).
 * The image always covers the crop frame; drag to reposition, slider to zoom.
 * Exports a PNG so transparent logo backgrounds survive.
 */
export function ImageCropper({ file, onCropped, onCancel }: ImageCropperProps) {
  const [src, setSrc] = useState('');
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState<number>(2);
  const [viewport, setViewport] = useState({ w: 420, h: 210 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Load the chosen file as an object URL.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const computeViewport = (containerW: number, ratio: number) => {
    let w = Math.max(220, Math.min(containerW, 460));
    let h = w / ratio;
    if (h > MAX_VIEWPORT_H) {
      h = MAX_VIEWPORT_H;
      w = h * ratio;
    }
    return { w: Math.round(w), h: Math.round(h) };
  };

  // Size the crop frame to the available width (and re-fit on aspect change).
  useEffect(() => {
    const measure = () => {
      const containerW = wrapRef.current?.clientWidth || 420;
      setViewport(computeViewport(containerW, aspect));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [aspect]);

  const baseScale = natural ? Math.max(viewport.w / natural.w, viewport.h / natural.h) : 1;
  const scale = baseScale * zoom;

  const clampOffset = (x: number, y: number, s: number) => {
    if (!natural) return { x, y };
    return {
      x: Math.min(0, Math.max(viewport.w - natural.w * s, x)),
      y: Math.min(0, Math.max(viewport.h - natural.h * s, y)),
    };
  };

  const centerImage = (s: number) => {
    if (!natural) return;
    setOffset({
      x: (viewport.w - natural.w * s) / 2,
      y: (viewport.h - natural.h * s) / 2,
    });
  };

  // Keep the frame covered whenever size/zoom/image changes.
  useEffect(() => {
    if (!natural) return;
    setOffset((prev) => clampOffset(prev.x, prev.y, scale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, natural, zoom]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    setNatural(size);
    setZoom(1);
    const fit = Math.max(viewport.w / size.w, viewport.h / size.h);
    setOffset({ x: (viewport.w - size.w * fit) / 2, y: (viewport.h - size.h * fit) / 2 });
  };

  const handleZoom = (nextZoom: number) => {
    if (!natural) return;
    const nextScale = baseScale * nextZoom;
    // Anchor on the frame centre so zooming feels stable.
    const cx = (viewport.w / 2 - offset.x) / scale;
    const cy = (viewport.h / 2 - offset.y) / scale;
    setZoom(nextZoom);
    setOffset(clampOffset(viewport.w / 2 - cx * nextScale, viewport.h / 2 - cy * nextScale, nextScale));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset(clampOffset(drag.baseX + (e.clientX - drag.startX), drag.baseY + (e.clientY - drag.startY), scale));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const renderCroppedBlob = (): Promise<Blob | null> => {
    const img = imgRef.current;
    if (!img || !natural) return Promise.resolve(null);
    const outW = Math.round(OUTPUT_HEIGHT * aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = viewport.w / scale;
    const sh = viewport.h / scale;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, OUTPUT_HEIGHT);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    const blob = await renderCroppedBlob();
    if (!blob) {
      setErrorMsg('Could not crop this image in the browser. Try a different file.');
      return;
    }
    onCropped(new File([blob], 'logo-cropped.png', { type: 'image/png' }));
  };

  const handleDownload = async () => {
    const blob = await renderCroppedBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logo-cropped.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Crop logo image">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6] max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <Crop className="w-5 h-5 text-[#1B4332]" aria-hidden="true" />
              Crop Logo
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Drag the image to reposition it, use the slider to zoom. The checkerboard area is transparency.
              A square crop pairs best with the SHLOKVEDA wordmark in the header.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close cropper"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Aspect presets */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Crop shape">
          {ASPECTS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAspect(preset.value)}
              aria-pressed={aspect === preset.value}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
                aspect === preset.value
                  ? 'bg-[#1B4332] text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Crop frame */}
        <div ref={wrapRef}>
          <div
            className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl border border-[#E3DCCB] [background-image:conic-gradient(#e9e4d8_0_25%,#f8f5ef_0_50%,#e9e4d8_0_75%,#f8f5ef_0)] [background-size:16px_16px] cursor-grab active:cursor-grabbing"
            style={{ width: viewport.w, height: viewport.h }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={handleImgLoad}
                className="pointer-events-none absolute left-0 top-0 max-w-none"
                style={{
                  width: natural ? natural.w * scale : undefined,
                  height: natural ? natural.h * scale : undefined,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            )}
            {/* Rule-of-thirds guides */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/50" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/50" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/50" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/50" />
          </div>
        </div>

        {/* Zoom */}
        <label htmlFor="crop-zoom" className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-700">
          <span className="shrink-0">Zoom</span>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="w-full accent-[#1B4332]"
          />
        </label>

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!natural}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1B4332]/30 text-xs font-bold text-[#1B4332] hover:bg-[#F0F1E5] transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural}
            className="flex-1 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all disabled:opacity-60"
          >
            Crop &amp; Upload
          </button>
        </div>
      </div>
    </div>
  );
}
