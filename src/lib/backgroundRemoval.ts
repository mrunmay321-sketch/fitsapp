export type BgRemovalProgress = (progress: number) => void;

const MAX_INFER_DIM = 800;

/**
 * Remove the background from an image.
 *
 * Pipeline:
 * 1. Pre-inference canvas downscale to 800px max (90%+ pixel reduction)
 * 2. @imgly/background-removal with lightweight quint8 model + GPU + built-in worker
 * 3. Canvas color-key fallback if AI fails
 *
 * Never returns the original unprocessed image.
 */
export async function removeBackground(
  imageBlob: Blob,
  onProgress?: BgRemovalProgress
): Promise<Blob> {
  try {
    onProgress?.(3);

    // Step 1: Pre-inference downscale
    const downscaledBlob = await downscaleToBlob(imageBlob, MAX_INFER_DIM);
    onProgress?.(10);

    // Step 2: AI removal with optimized config
    const { removeBackground: imglyRemove } = await import('@imgly/background-removal');
    const result = await imglyRemove(downscaledBlob, {
      model: 'isnet_quint8',
      device: 'gpu',
      proxyToWorker: true,
      output: { format: 'image/png', quality: 0.85 },
      progress: (_key: string, current: number, total: number) => {
        if (onProgress && total > 0) {
          // Map 10–95 range to leave room for pre/post steps
          const pct = 10 + Math.round((current / total) * 85);
          onProgress(pct);
        }
      },
    });
    onProgress?.(100);
    return result;
  } catch (err) {
    console.warn('AI background removal failed, using canvas fallback:', err);
    onProgress?.(50);
    const fallbackBlob = await canvasBackgroundRemoval(imageBlob);
    onProgress?.(100);
    return fallbackBlob;
  }
}

/**
 * Pre-fetch and cache ONNX model files in the browser cache.
 * Call on app boot so model binaries are ready when first image is uploaded.
 */
export async function preloadBackgroundRemoval(): Promise<void> {
  try {
    const { preload } = await import('@imgly/background-removal');
    await preload({
      model: 'isnet_quint8',
      device: 'gpu',
      proxyToWorker: true,
    });
  } catch {
    // Non-critical — will lazy-load on first upload
  }
}

/**
 * Downscale an image blob so its largest dimension is <= maxSize.
 * Outputs a PNG blob to preserve quality for AI inference.
 */
async function downscaleToBlob(blob: Blob, maxSize: number): Promise<Blob> {
  const dataUrl = await blobToDataURL(blob);
  const img = await loadImage(dataUrl);

  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > maxSize || h > maxSize) {
    const scale = Math.min(maxSize / w, maxSize / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;

  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (result) => resolve(result ?? blob),
      'image/png'
    );
  });
}

/**
 * Canvas-based solid-color background removal fallback.
 * Samples corner pixels, removes similar colors, produces transparent PNG.
 */
async function canvasBackgroundRemoval(blob: Blob): Promise<Blob> {
  const dataUrl = await blobToDataURL(blob);
  const img = await loadImage(dataUrl);

  // Downscale for fallback too
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > MAX_INFER_DIM || h > MAX_INFER_DIM) {
    const scale = Math.min(MAX_INFER_DIM / w, MAX_INFER_DIM / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const corners = [
    samplePixel(data, w, 0, 0),
    samplePixel(data, w, w - 1, 0),
    samplePixel(data, w, 0, h - 1),
    samplePixel(data, w, w - 1, h - 1),
  ];

  const avg = {
    r: corners.reduce((s, c) => s + c.r, 0) / corners.length,
    g: corners.reduce((s, c) => s + c.g, 0) / corners.length,
    b: corners.reduce((s, c) => s + c.b, 0) / corners.length,
  };

  const tolerance = 40;
  const tolSq = tolerance * tolerance * 3;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - avg.r;
    const dg = data[i + 1] - avg.g;
    const db = data[i + 2] - avg.b;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq < tolSq) {
      data[i + 3] = 0;
    } else if (distSq < tolSq * 2.5) {
      const factor = (distSq - tolSq) / (tolSq * 1.5);
      data[i + 3] = Math.min(255, Math.round(data[i + 3] * factor));
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('toBlob failed'))),
      'image/png'
    );
  });
}

function samplePixel(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const idx = (y * width + x) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
