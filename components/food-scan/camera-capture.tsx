"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onCapture: (dataUrl: string) => void;
  onReset: () => void;
  hasImage: boolean;
};

/**
 * On mobile this opens the rear camera directly thanks to capture="environment".
 * On desktop it falls back to a normal file picker.
 *
 * We downscale the captured image client-side before sending. A user-captured
 * photo can easily be 6+ MB; we cap to ~1280px on the longest edge and JPEG
 * quality 0.8 — that's plenty for IDDSI visual classification and keeps the
 * vision API call cheap and fast.
 */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function CameraCapture({ onCapture, onReset, hasImage }: Props) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await downscale(file);
      onCapture(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that image. Try another.");
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {hasImage ? (
        <Button variant="outline" size="lg" className="w-full" onClick={onReset}>
          <RotateCcw className="h-5 w-5" />
          Retake
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="lg"
            onClick={() => cameraInput.current?.click()}
            className="w-full"
          >
            <Camera className="h-5 w-5" />
            Camera
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInput.current?.click()}
            className="w-full"
          >
            <ImageUp className="h-5 w-5" />
            Upload
          </Button>
        </div>
      )}

      {error ? <p className="text-sm text-[var(--color-rose)]">{error}</p> : null}
    </div>
  );
}
