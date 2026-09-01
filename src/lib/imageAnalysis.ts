export interface ImageAnalysis {
  dominantColor: string;
  colorHex: string;
  fit: 'Fitted' | 'Regular' | 'Baggy/Oversized';
  styleVibe: string;
  confidence: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

// Generate a descriptive color name from HSL values
function nameFromHsl(h: number, s: number, l: number): string {
  // Near-white
  if (l > 0.88 && s < 0.12) return l > 0.95 ? 'Pure White' : 'Off-White';
  // Near-black
  if (l < 0.12) return 'Black';
  // Greys / charcoal
  if (s < 0.1) {
    if (l < 0.3) return 'Charcoal';
    if (l < 0.5) return 'Dark Grey';
    if (l < 0.7) return 'Grey';
    return 'Light Grey';
  }

  // Hue families
  const hueName = (() => {
    if (h < 12 || h >= 345) return 'Red';
    if (h < 25) return 'Rust';
    if (h < 40) return 'Orange';
    if (h < 55) return 'Mustard';
    if (h < 70) return 'Yellow';
    if (h < 95) return 'Olive';
    if (h < 150) return 'Green';
    if (h < 175) return 'Teal';
    if (h < 200) return 'Cyan';
    if (h < 230) return 'Blue';
    if (h < 255) return 'Indigo';
    if (h < 280) return 'Violet';
    if (h < 310) return 'Purple';
    if (h < 340) return 'Magenta';
    return 'Red';
  })();

  // Lightness/saturation modifiers
  let prefix = '';
  if (l < 0.25) prefix = 'Deep ';
  else if (l < 0.4) prefix = 'Dark ';
  else if (l > 0.7) prefix = 'Light ';
  else if (s < 0.3) prefix = 'Muted ';
  else if (s < 0.5 && l > 0.45) prefix = 'Washed ';
  else if (l > 0.55 && l < 0.75) prefix = 'Faded ';

  // Special cases for common clothing colors
  if (hueName === 'Blue' && l < 0.35 && s < 0.5) return 'Navy';
  if (hueName === 'Blue' && l < 0.5 && s > 0.4) return 'Indigo';
  if (hueName === 'Indigo' && l < 0.45) return 'Faded Indigo';
  if (hueName === 'Green' && l < 0.35 && s < 0.4) return 'Forest Green';
  if (hueName === 'Green' && s < 0.35 && l > 0.4) return 'Sage Green';
  if (hueName === 'Olive' && s < 0.4) return 'Olive Green';
  if (hueName === 'Red' && l < 0.3 && s < 0.6) return 'Burgundy';
  if (hueName === 'Rust' && l < 0.45) return 'Warm Rust';
  if (hueName === 'Mustard' && s < 0.5) return 'Muted Mustard';
  if (hueName === 'Orange' && l > 0.6) return 'Tan';
  if (hueName === 'Yellow' && l > 0.75 && s < 0.3) return 'Cream';
  if (hueName === 'Purple' && l < 0.35) return 'Deep Plum';
  if (hueName === 'Magenta' && l < 0.4) return 'Burgundy';

  return `${prefix}${hueName}`.trim();
}

function isNearWhite(rgb: RGB): boolean {
  return rgb.r > 225 && rgb.g > 225 && rgb.b > 215;
}

function isNearBlack(rgb: RGB): boolean {
  return rgb.r < 30 && rgb.g < 30 && rgb.b < 30;
}

export function analyzeImage(
  dataUrl: string,
  filename?: string
): Promise<ImageAnalysis> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sampleSize = 64;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve({
          dominantColor: 'Unknown',
          colorHex: '#333333',
          fit: 'Regular',
          styleVibe: 'Smart Casual',
          confidence: 0,
        });
        return;
      }

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      // Color quantization: bucket pixels and find dominant
      const buckets: Record<string, { count: number; rgb: RGB }> = {};
      let totalPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue;
        if (isNearWhite({ r, g, b })) continue;

        totalPixels++;
        const key = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
        if (!buckets[key]) {
          buckets[key] = { count: 0, rgb: { r: 0, g: 0, b: 0 } };
        }
        buckets[key].count++;
        buckets[key].rgb.r += r;
        buckets[key].rgb.g += g;
        buckets[key].rgb.b += b;
      }

      let dominantKey = '';
      let maxCount = 0;
      for (const [key, val] of Object.entries(buckets)) {
        if (val.count > maxCount) {
          maxCount = val.count;
          dominantKey = key;
        }
      }

      let dominantColor = 'Unknown';
      let colorHex = '#333333';

      if (dominantKey && buckets[dominantKey]) {
        const b = buckets[dominantKey];
        const avgRgb: RGB = {
          r: Math.round(b.rgb.r / b.count),
          g: Math.round(b.rgb.g / b.count),
          b: Math.round(b.rgb.b / b.count),
        };
        colorHex = rgbToHex(avgRgb.r, avgRgb.g, avgRgb.b);

        if (isNearBlack(avgRgb)) {
          dominantColor = 'Black';
          colorHex = '#1a1a1a';
        } else if (isNearWhite(avgRgb)) {
          dominantColor = 'Off-White';
          colorHex = '#f0f0e8';
        } else {
          const hsl = rgbToHsl(avgRgb);
          dominantColor = nameFromHsl(hsl.h, hsl.s, hsl.l);
        }
      }

      const confidence = totalPixels > 0 ? Math.min((maxCount / totalPixels) * 2, 1) : 0;

      // Aspect ratio analysis for fit
      const aspectRatio = img.width / img.height;
      let fit: 'Fitted' | 'Regular' | 'Baggy/Oversized' = 'Regular';
      if (aspectRatio < 0.75) {
        fit = 'Baggy/Oversized';
      } else if (aspectRatio > 1.1) {
        fit = 'Fitted';
      }

      // Filename heuristics for style vibe
      const name = (filename || '').toLowerCase();
      let styleVibe = 'Smart Casual';
      if (/vintage|retro|90s|2000s|y2k|street|baggy|cargo|denim|henley/.test(name)) {
        styleVibe = 'Late 90s/2000s Streetwear';
      } else if (/off.?duty|casual|tee|sneaker|loose/.test(name)) {
        styleVibe = 'Vintage Off-Duty';
      } else if (/blazer|trouser|shirt|formal|suit|smart/.test(name)) {
        styleVibe = 'Smart Casual';
      }

      resolve({ dominantColor, colorHex, fit, styleVibe, confidence });
    };
    img.onerror = () => {
      resolve({
        dominantColor: 'Unknown',
        colorHex: '#333333',
        fit: 'Regular',
        styleVibe: 'Smart Casual',
        confidence: 0,
      });
    };
    img.src = dataUrl;
  });
}
