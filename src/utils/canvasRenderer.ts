import { BumperConfig } from '../types/bumper';
import {
  WATERMARK_VARIATIONS,
  getWatermarkImage,
  waitForWatermarkImage,
  getDynamicWatermarkWidth,
} from './watermarkTemplates';

export async function waitForConfigFonts(config: BumperConfig): Promise<void> {
  const titleFont =
    config.studioMode === 'video_title'
      ? config.titleFont || config.fontFamily
      : config.logoCountMode === 'single' && config.singleLogoShowTitle
        ? config.singleLogoTitleFont || config.bumperTitleFont || config.fontFamily
        : config.bumperTitleFont || config.fontFamily;
  const fonts = new Set(['Plus Jakarta Sans', titleFont].filter(Boolean) as string[]);

  await Promise.all(
    [...fonts].map((font) => document.fonts.load(`800 16px "${font}"`))
  );
}

// Particle memory cache for deterministic particle animation
interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  seed: number;
}

const particlePool: Record<string, Particle[]> = {};

function getParticles(theme: string, count: number): Particle[] {
  const key = `${theme}_${count}`;
  if (!particlePool[key] || particlePool[key].length !== count) {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.1 + Math.random() * 0.9;
      list.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 3.5,
        color: '#FFFFFF',
        seed: Math.random(),
      });
    }
    particlePool[key] = list;
  }
  return particlePool[key];
}

// Logo image cache
const imageCache = new Map<string, HTMLImageElement>();
interface LogoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LogoOutlinePath {
  points: { x: number; y: number }[];
  length: number;
}

interface LogoOutline {
  width: number;
  height: number;
  paths: LogoOutlinePath[];
  length: number;
}

const logoCropCache = new WeakMap<HTMLImageElement, LogoCrop>();
const logoOutlineCache = new WeakMap<HTMLImageElement, LogoOutline>();

function getOrCreateCachedImage(url: string): HTMLImageElement {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const img = new Image();
  img.onload = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('canvas-assets-ready'));
    }
  };
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache.set(url, img);
  return img;
}

export function getCachedImage(url?: string): HTMLImageElement | null {
  if (!url) return null;
  const img = getOrCreateCachedImage(url);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function getLogoCrop(image: HTMLImageElement): LogoCrop {
  const cached = logoCropCache.get(image);
  if (cached) return cached;

  const scale = Math.min(1, 256 / image.naturalWidth, 256 / image.naturalHeight);
  const scanWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  const scanHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = scanWidth;
  canvas.height = scanHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    const fullImage = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    logoCropCache.set(image, fullImage);
    return fullImage;
  }

  try {
    context.drawImage(image, 0, 0, scanWidth, scanHeight);
    const pixels = context.getImageData(0, 0, scanWidth, scanHeight).data;
    let left = scanWidth;
    let top = scanHeight;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < scanHeight; y++) {
      for (let x = 0; x < scanWidth; x++) {
        if (pixels[(y * scanWidth + x) * 4 + 3] <= 16) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }

    if (right < left || bottom < top) {
      const fullImage = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
      logoCropCache.set(image, fullImage);
      return fullImage;
    }

    const paddingX = Math.max(1, Math.round(scanWidth * 0.01));
    const paddingY = Math.max(1, Math.round(scanHeight * 0.01));
    left = Math.max(0, left - paddingX);
    top = Math.max(0, top - paddingY);
    right = Math.min(scanWidth - 1, right + paddingX);
    bottom = Math.min(scanHeight - 1, bottom + paddingY);
    const crop = {
      x: Math.floor((left / scanWidth) * image.naturalWidth),
      y: Math.floor((top / scanHeight) * image.naturalHeight),
      width: Math.ceil(((right - left + 1) / scanWidth) * image.naturalWidth),
      height: Math.ceil(((bottom - top + 1) / scanHeight) * image.naturalHeight),
    };
    logoCropCache.set(image, crop);
    return crop;
  } catch (error) {
    console.warn('Logo tidak dapat dianalisis untuk pemangkasan transparansi; ukuran gambar asli digunakan.', error);
    const fullImage = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    logoCropCache.set(image, fullImage);
    return fullImage;
  }
}

function getLogoAspect(image: HTMLImageElement): number {
  const crop = getLogoCrop(image);
  return crop.width / crop.height;
}

function drawCroppedLogo(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const crop = getLogoCrop(image);
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, x, y, width, height);
}

function getLogoOutline(image: HTMLImageElement): LogoOutline {
  const cached = logoOutlineCache.get(image);
  if (cached) return cached;

  const crop = getLogoCrop(image);
  const scale = Math.min(1, 160 / crop.width, 160 / crop.height);
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    const emptyOutline = { width, height, paths: [], length: 0 };
    logoOutlineCache.set(image, emptyOutline);
    return emptyOutline;
  }

  const mask = new Uint8Array(width * height);
  try {
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    let hasTransparency = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 250) {
        hasTransparency = true;
        break;
      }
    }

    const background = [pixels[0], pixels[1], pixels[2]];
    for (let i = 0; i < mask.length; i++) {
      const offset = i * 4;
      const foreground = hasTransparency
        ? pixels[offset + 3] > 48
        : Math.abs(pixels[offset] - background[0]) +
          Math.abs(pixels[offset + 1] - background[1]) +
          Math.abs(pixels[offset + 2] - background[2]) > 60;
      mask[i] = foreground ? 1 : 0;
    }
  } catch (error) {
    console.warn('Kontur logo tidak dapat dibaca; efek line draw memakai sapuan reveal.', error);
    const emptyOutline = { width, height, paths: [], length: 0 };
    logoOutlineCache.set(image, emptyOutline);
    return emptyOutline;
  }

  type Edge = { from: number; to: number; used: boolean };
  const edges: Edge[] = [];
  const byStart = new Map<number, number[]>();
  const addEdge = (x1: number, y1: number, x2: number, y2: number) => {
    const from = y1 * (width + 1) + x1;
    const to = y2 * (width + 1) + x2;
    const index = edges.length;
    edges.push({ from, to, used: false });
    const candidates = byStart.get(from) || [];
    candidates.push(index);
    byStart.set(from, candidates);
  };
  const hasPixel = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!hasPixel(x, y)) continue;
      if (!hasPixel(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!hasPixel(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!hasPixel(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!hasPixel(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }

  const paths: LogoOutlinePath[] = [];
  const point = (id: number) => ({ x: id % (width + 1), y: Math.floor(id / (width + 1)) });
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) continue;
    edges[i].used = true;
    const points = [point(edges[i].from), point(edges[i].to)];
    const start = edges[i].from;
    let current = edges[i].to;
    while (current !== start) {
      const nextIndex = (byStart.get(current) || []).find((candidate) => !edges[candidate].used);
      if (nextIndex === undefined) break;
      edges[nextIndex].used = true;
      current = edges[nextIndex].to;
      points.push(point(current));
    }

    let pathLength = 0;
    for (let j = 1; j < points.length; j++) {
      pathLength += Math.hypot(points[j].x - points[j - 1].x, points[j].y - points[j - 1].y);
    }
    if (pathLength > 0) paths.push({ points, length: pathLength });
  }

  paths.sort((a, b) => b.length - a.length);
  const outline = { width, height, paths, length: paths.reduce((total, path) => total + path.length, 0) };
  logoOutlineCache.set(image, outline);
  return outline;
}

function drawLogoOutline(
  ctx: CanvasRenderingContext2D,
  outline: LogoOutline,
  logoW: number,
  logoH: number,
  progress: number,
  alpha: number,
  scale: number,
  color = '#F5F0E4',
  glow = 'rgba(20, 77, 255, 0.75)',
  sequential = true,
): void {
  if (!outline.length || progress <= 0) return;

  let remaining = outline.length * progress;
  ctx.save();
  ctx.translate(-logoW / 2, -logoH / 2);
  ctx.scale(logoW / outline.width, logoH / outline.height);
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.8, (1.1 * scale) / Math.min(logoW / outline.width, logoH / outline.height));
  ctx.strokeStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 5 * scale;

  for (let pathIndex = 0; pathIndex < outline.paths.length; pathIndex++) {
    const path = outline.paths[pathIndex];
    const delay = Math.min(0.6, pathIndex * 0.04);
    const drawLength = sequential
      ? Math.min(remaining, path.length)
      : path.length * clamp((progress - delay) / (1 - delay));
    if (drawLength <= 0) {
      if (sequential) break;
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    let traversed = 0;
    for (let i = 1; i < path.points.length; i++) {
      const previous = path.points[i - 1];
      const next = path.points[i];
      const segmentLength = Math.hypot(next.x - previous.x, next.y - previous.y);
      if (traversed + segmentLength <= drawLength) {
        ctx.lineTo(next.x, next.y);
        traversed += segmentLength;
      } else {
        const segmentProgress = (drawLength - traversed) / segmentLength;
        ctx.lineTo(
          previous.x + (next.x - previous.x) * segmentProgress,
          previous.y + (next.y - previous.y) * segmentProgress,
        );
        break;
      }
    }
    ctx.stroke();
    if (sequential) remaining -= drawLength;
  }
  ctx.restore();
}

function renderSingleLogoLineEffect(
  ctx: CanvasRenderingContext2D,
  logoW: number,
  logoH: number,
  time: number,
  scale: number,
  effect: string,
  outline: LogoOutline | null,
  drawLogo: () => void,
): void {
  const progress = clamp(time / 1.8);
  const reveal = clamp((time - 1.05) / 0.65);
  const drawOutline = (
    amount: number,
    alpha = 1,
    color = '#F5F0E4',
    glow = 'rgba(20, 77, 255, 0.75)',
    size = 1,
    sequential = true,
  ) => {
    if (!outline?.length) return;
    ctx.save();
    ctx.scale(size, size);
    drawLogoOutline(ctx, outline, logoW, logoH, amount, alpha, scale, color, glow, sequential);
    ctx.restore();
  };
  const paintLogo = (alpha = 1) => {
    ctx.save();
    ctx.globalAlpha *= alpha;
    drawLogo();
    ctx.restore();
  };
  const fallbackOutline = (amount: number, alpha = 1) => {
    if (outline?.length) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = '#F5F0E4';
    ctx.shadowColor = 'rgba(20, 77, 255, 0.75)';
    ctx.shadowBlur = 5 * scale;
    ctx.lineWidth = 1.5 * scale;
    const y = -logoH / 2 + logoH * amount;
    ctx.beginPath();
    ctx.moveTo(-logoW / 2, y);
    ctx.lineTo(logoW / 2, y);
    ctx.stroke();
    ctx.restore();
  };

  ctx.save();
  if (effect === 'line_only') {
    drawOutline(progress, 1, '#F5F0E4', 'rgba(20, 77, 255, 0.75)', 1, false);
    fallbackOutline(progress);
    if (!outline?.length && progress >= 1) paintLogo();
  } else if (effect === 'line_draw') {
    drawOutline(progress, 1 - reveal, '#F5F0E4', 'rgba(20, 77, 255, 0.75)', 1, false);
    fallbackOutline(progress, 1 - reveal);
    paintLogo(reveal);
  } else if (effect === 'line_pen') {
    drawOutline(progress, 1 - reveal);
    fallbackOutline(progress, 1 - reveal);
    paintLogo(reveal);
  } else if (effect === 'line_neon') {
    drawOutline(progress, 1 - reveal * 0.35, '#7DEBFF', 'rgba(0, 200, 255, 0.95)', 1);
    fallbackOutline(progress, 1 - reveal * 0.35);
    paintLogo(reveal);
  } else if (effect === 'line_echo') {
    drawOutline(progress, 0.35 * (1 - reveal), '#DFCEB5', 'rgba(223, 206, 181, 0.5)', 1.08);
    drawOutline(progress, 1 - reveal, '#F5F0E4');
    fallbackOutline(progress, 1 - reveal);
    paintLogo(reveal);
  } else if (effect === 'line_fill') {
    drawOutline(progress, 1 - reveal);
    fallbackOutline(progress, 1 - reveal);
    const fillProgress = clamp((progress - 0.36) / 0.64);
    if (fillProgress > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-logoW, logoH / 2 - logoH * fillProgress, logoW * 2, logoH * fillProgress);
      ctx.clip();
      paintLogo();
      ctx.restore();
    }
  } else if (effect === 'line_glitch') {
    const glitchProgress = clamp(time / 1.1);
    const slices = 9;
    for (let index = 0; index < slices; index++) {
      const delay = (index / slices) * 0.45;
      const sliceProgress = clamp((glitchProgress - delay) / (0.62 - delay));
      if (sliceProgress <= 0) continue;
      const top = -logoH / 2 + (logoH * index) / slices;
      const sliceHeight = logoH / slices + 1;
      const jitter = (1 - sliceProgress) * Math.sin(time * 34 + index * 8) * 12 * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-logoW, top, logoW * 2, sliceHeight);
      ctx.clip();
      ctx.globalAlpha *= 0.5 + sliceProgress * 0.5;
      ctx.translate(jitter, 0);
      drawLogo();
      ctx.restore();
    }
    if (glitchProgress >= 1) paintLogo();
  } else if (effect === 'line_blur') {
    const focus = easeOutCubic(clamp(time / 1.65));
    ctx.save();
    ctx.globalAlpha *= clamp(focus * 1.5);
    ctx.filter = `blur(${(1 - focus) * 18 * scale}px)`;
    ctx.scale(1.12 - focus * 0.12, 1.12 - focus * 0.12);
    drawLogo();
    ctx.restore();
  } else if (effect === 'line_zoom') {
    const zoom = easeOutCubic(clamp(time / 0.9));
    ctx.save();
    ctx.globalAlpha *= clamp(zoom * 1.5);
    ctx.scale(2.2 - zoom * 1.2, 2.2 - zoom * 1.2);
    drawLogo();
    ctx.restore();
    if (time < 0.75) {
      const ringProgress = clamp(time / 0.75);
      ctx.save();
      ctx.globalAlpha *= 1 - ringProgress;
      ctx.strokeStyle = '#F5F0E4';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, logoW * (0.2 + ringProgress), logoH * (0.2 + ringProgress), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  } else if (effect === 'line_slice') {
    const slices = 7;
    for (let index = 0; index < slices; index++) {
      const sliceProgress = clamp(progress * slices - index);
      if (sliceProgress <= 0) continue;
      const top = -logoH / 2 + (logoH * index) / slices;
      const sliceHeight = logoH / slices + 1;
      const direction = index % 2 === 0 ? -1 : 1;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-logoW, top, logoW * 2, sliceHeight);
      ctx.clip();
      ctx.translate(direction * (1 - sliceProgress) * logoW * 0.7, 0);
      drawLogo();
      ctx.restore();
    }
    if (progress >= 1) paintLogo();
  } else if (effect === 'line_pixel') {
    const columns = 8;
    const rows = 6;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const index = row * columns + column;
        const delay = ((index * 37) % (columns * rows)) / (columns * rows) * 0.5;
        const tileProgress = clamp((progress - delay) / 0.52);
        if (tileProgress <= 0) continue;
        const tileW = logoW / columns;
        const tileH = logoH / rows;
        const x = -logoW / 2 + column * tileW;
        const y = -logoH / 2 + row * tileH;
        const offsetX = (1 - tileProgress) * (column % 2 === 0 ? -1 : 1) * tileW * 1.8;
        const offsetY = (1 - tileProgress) * (row % 2 === 0 ? -1 : 1) * tileH * 1.2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, tileW + 0.5, tileH + 0.5);
        ctx.clip();
        ctx.translate(offsetX, offsetY);
        drawLogo();
        ctx.restore();
      }
    }
    if (progress >= 1) paintLogo();
  } else if (effect === 'line_dust') {
    const particleProgress = clamp(time / 1.55);
    const columns = 10;
    const rows = 6;
    const colors = ['#F5F0E4', '#DFCEB5', '#38BDF8', '#FFFFFF'];
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const index = row * columns + column;
        const seed = (index * 37 + 11) % 101 / 101;
        const amount = clamp((particleProgress - seed * 0.42) / 0.58);
        if (amount <= 0) continue;
        const x = -logoW / 2 + ((column + 0.5) / columns) * logoW;
        const y = -logoH / 2 + ((row + 0.5) / rows) * logoH;
        const angle = seed * Math.PI * 2;
        const distance = (1 - amount) * (Math.max(logoW, logoH) * 0.48 + seed * 35 * scale);
        ctx.save();
        ctx.globalAlpha *= 0.25 + amount * 0.75;
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, (1.2 + seed * 1.5) * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    paintLogo(clamp((particleProgress - 0.72) / 0.28));
  } else if (effect === 'line_liquid') {
    const fillProgress = easeOutCubic(progress);
    const wave = (1 - fillProgress) * 5 * scale;
    ctx.save();
    ctx.beginPath();
    for (let index = 0; index <= 24; index++) {
      const x = -logoW / 2 + (logoW * index) / 24;
      const y = logoH / 2 - fillProgress * logoH + Math.sin(index * 0.65 + time * 7) * wave;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(logoW / 2, logoH / 2);
    ctx.lineTo(-logoW / 2, logoH / 2);
    ctx.closePath();
    ctx.clip();
    paintLogo();
    ctx.restore();
    if (progress < 1) {
      ctx.save();
      ctx.strokeStyle = '#DFCEB5';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      for (let index = 0; index <= 24; index++) {
        const x = -logoW / 2 + (logoW * index) / 24;
        const y = logoH / 2 - fillProgress * logoH + Math.sin(index * 0.65 + time * 7) * wave;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
  } else if (effect === 'line_dots') {
    if (outline?.length) {
      ctx.save();
      ctx.translate(-logoW / 2, -logoH / 2);
      ctx.scale(logoW / outline.width, logoH / outline.height);
      ctx.fillStyle = '#F5F0E4';
      ctx.shadowColor = 'rgba(0, 200, 255, 0.85)';
      ctx.shadowBlur = 5 * scale;
      for (const path of outline.paths.slice(0, 18)) {
        const visible = Math.floor(path.points.length * progress);
        const step = Math.max(3, Math.floor(path.points.length / 36));
        for (let index = 0; index < visible; index += step) {
          const point = path.points[index];
          ctx.beginPath();
          ctx.arc(point.x, point.y, 0.9 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else {
      drawOutline(progress);
      fallbackOutline(progress);
    }
    paintLogo(reveal);
  } else {
    drawOutline(progress, 1 - reveal);
    fallbackOutline(progress, 1 - reveal);
    paintLogo(reveal);
  }
  ctx.restore();
}

export async function waitForFrameRenderAssets(config: BumperConfig): Promise<void> {
  const activeLogos = (config.frameLogos || []).filter((logo) => logo.enabled && logo.url);
  const tone = {
    accent1: config.frameAccentColor || '#144DFF',
    accent2: config.frameSecondaryAccent || '#FFB51C',
    accent3: config.frameTertiaryAccent || '#12A52A',
    bgCard: config.frameCardBgColor || '#FFFFFF',
  };

  await Promise.all([
    waitForWatermarkImage(config.frameStyle || 'klasik', tone, activeLogos),
    ...activeLogos.map(async (logo) => {
      const image = getOrCreateCachedImage(logo.url);
      if (!image.complete || image.naturalWidth === 0) {
        try {
          await image.decode();
        } catch (error) {
          throw new Error(`Logo "${logo.name || 'tanpa nama'}" gagal disiapkan untuk ekspor.`, { cause: error });
        }
      }
      if (image.naturalWidth === 0) {
        throw new Error(`Logo "${logo.name || 'tanpa nama'}" gagal disiapkan untuk ekspor.`);
      }
    }),
  ]);
}

// Pre-load the official sliced HD assets immediately
if (typeof window !== 'undefined') {
  getCachedImage('/assets/aistudio/kso_nke_hd.png');
  getCachedImage('/assets/aistudio/kso_jaya_hd.png');
  getCachedImage('/assets/aistudio/kso_wiswa_hd.png');
  getCachedImage('/assets/aistudio/kso_full_hd.png');
  getCachedImage('/assets/aistudio/LOGO_KSO_HD_vektor_edcea276.png');
  getCachedImage('/assets/aistudio/LOGO_WM_NKE_R3_c1d75e16.png');
  getCachedImage('/assets/aistudio/image_737631e5.png');
}

// Smooth easing helpers
function easeOutCubic(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return 1 - Math.pow(1 - t, 3);
}

function easeOutExpo(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t = Math.max(0, Math.min(1, x)) - 1;
  return 1 + c3 * Math.pow(t, 3) + c1 * Math.pow(t, 2);
}

function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  let t = Math.max(0, Math.min(1, x));

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    t -= 1.5 / d1;
    return n1 * t * t + 0.75;
  } else if (t < 2.5 / d1) {
    t -= 2.25 / d1;
    return n1 * t * t + 0.9375;
  } else {
    t -= 2.625 / d1;
    return n1 * t * t + 0.984375;
  }
}

function clamp(val: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Traces an authentic jigsaw edge from (x0, y0) to (x1, y1)
 * matching the 4-piece jigsaw reference (image_460651e4.png).
 * tabDir: +1 for tab on right of vector, -1 for tab on left of vector, 0 for flat outer edge
 */
function addJigsawEdge(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tabDir: number,
  tabSize: number = 0.22
) {
  if (tabDir === 0) {
    ctx.lineTo(x1, y1);
    return;
  }
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    ctx.lineTo(x1, y1);
    return;
  }
  const ux = dx / len;
  const uy = dy / len;
  // Normal perpendicular vector pointing to tab direction
  const nx = (dy / len) * tabDir;
  const ny = (-dx / len) * tabDir;
  const hTab = len * tabSize;

  // Neck start at 38%
  const pA_x = x0 + ux * len * 0.38;
  const pA_y = y0 + uy * len * 0.38;
  ctx.lineTo(pA_x, pA_y);

  // Peak of round circular knob at 50%
  const pPeak_x = x0 + ux * len * 0.50 + nx * hTab;
  const pPeak_y = y0 + uy * len * 0.50 + ny * hTab;

  // Neck end at 62%
  const pB_x = x0 + ux * len * 0.62;
  const pB_y = y0 + uy * len * 0.62;

  // Cubic beziers forming the circular jigsaw knob and socket
  const cp1_x = pA_x - nx * (hTab * 0.12) + ux * len * 0.01;
  const cp1_y = pA_y - ny * (hTab * 0.12) + uy * len * 0.01;
  const cp2_x = pPeak_x - ux * len * 0.14 + nx * (hTab * 0.15);
  const cp2_y = pPeak_y - uy * len * 0.14 + ny * (hTab * 0.15);
  ctx.bezierCurveTo(cp1_x, cp1_y, cp2_x, cp2_y, pPeak_x, pPeak_y);

  const cp3_x = pPeak_x + ux * len * 0.14 + nx * (hTab * 0.15);
  const cp3_y = pPeak_y + uy * len * 0.14 + ny * (hTab * 0.15);
  const cp4_x = pB_x - nx * (hTab * 0.12) - ux * len * 0.01;
  const cp4_y = pB_y - ny * (hTab * 0.12) - uy * len * 0.01;
  ctx.bezierCurveTo(cp3_x, cp3_y, cp4_x, cp4_y, pB_x, pB_y);

  ctx.lineTo(x1, y1);
}

/**
 * Generates the closed path for each of the 4 interlocking jigsaw pieces:
 * Piece 0: Top-Left (Yellow in reference image)
 * Piece 1: Top-Right (Pink in reference image)
 * Piece 2: Bottom-Left (Blue in reference image)
 * Piece 3: Bottom-Right (Green in reference image)
 */
function buildJigsawPiecePath(
  ctx: CanvasRenderingContext2D,
  pieceIndex: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const xm = (x0 + x1) / 2;
  const ym = (y0 + y1) / 2;

  ctx.beginPath();
  if (pieceIndex === 0) {
    // 0: TOP-LEFT
    ctx.moveTo(x0, y0);
    addJigsawEdge(ctx, x0, y0, xm, y0, 0); // top flat
    addJigsawEdge(ctx, xm, y0, xm, ym, 1); // right tab into TR
    addJigsawEdge(ctx, xm, ym, x0, ym, -1); // bottom receives tab from BL (socket)
    addJigsawEdge(ctx, x0, ym, x0, y0, 0); // left flat
  } else if (pieceIndex === 1) {
    // 1: TOP-RIGHT
    ctx.moveTo(xm, y0);
    addJigsawEdge(ctx, xm, y0, x1, y0, 0); // top flat
    addJigsawEdge(ctx, x1, y0, x1, ym, 0); // right flat
    addJigsawEdge(ctx, x1, ym, xm, ym, -1); // bottom tab into BR
    addJigsawEdge(ctx, xm, ym, xm, y0, -1); // left receives tab from TL (socket)
  } else if (pieceIndex === 2) {
    // 2: BOTTOM-LEFT
    ctx.moveTo(x0, ym);
    addJigsawEdge(ctx, x0, ym, xm, ym, 1); // top tab into TL
    addJigsawEdge(ctx, xm, ym, xm, y1, 1); // right tab into BR
    addJigsawEdge(ctx, xm, y1, x0, y1, 0); // bottom flat
    addJigsawEdge(ctx, x0, y1, x0, ym, 0); // left flat
  } else {
    // 3: BOTTOM-RIGHT
    ctx.moveTo(xm, ym);
    addJigsawEdge(ctx, xm, ym, x1, ym, 1); // top receives tab from TR (socket)
    addJigsawEdge(ctx, x1, ym, x1, y1, 0); // right flat
    addJigsawEdge(ctx, x1, y1, xm, y1, 0); // bottom flat
    addJigsawEdge(ctx, xm, y1, xm, ym, -1); // left receives tab from BL (socket)
  }
  ctx.closePath();
}

/**
 * Dynamic tab direction generator for interlocking jigsaw grids (rows x cols).
 * Guarantees complementary tabs (+1) and sockets (-1) between adjacent pieces:
 * - Horizontal boundary between row r and row r+1 at col c
 * - Vertical boundary between col c and col c+1 at row r
 */
function getJigsawTabDir(type: 'h' | 'v', r: number, c: number): number {
  if (type === 'h') {
    return ((r + c) % 2 === 0) ? 1 : -1;
  }
  return ((r * 2 + c) % 2 === 0) ? 1 : -1;
}

function buildGridJigsawPiecePath(
  ctx: CanvasRenderingContext2D,
  r: number,
  c: number,
  rows: number,
  cols: number,
  gridX0: number,
  gridY0: number,
  cellW: number,
  cellH: number
) {
  const x0 = gridX0 + c * cellW;
  const y0 = gridY0 + r * cellH;
  const x1 = x0 + cellW;
  const y1 = y0 + cellH;

  ctx.beginPath();
  ctx.moveTo(x0, y0);

  // 1. Top Edge (left to right)
  if (r === 0) {
    ctx.lineTo(x1, y0);
  } else {
    // In row r-1, the bottom edge had direction getJigsawTabDir('h', r - 1, c).
    // Moving left-to-right on row r, the tab direction is opposite.
    addJigsawEdge(ctx, x0, y0, x1, y0, -getJigsawTabDir('h', r - 1, c), 0.22);
  }

  // 2. Right Edge (top to bottom)
  if (c === cols - 1) {
    ctx.lineTo(x1, y1);
  } else {
    addJigsawEdge(ctx, x1, y0, x1, y1, getJigsawTabDir('v', r, c), 0.22);
  }

  // 3. Bottom Edge (right to left)
  if (r === rows - 1) {
    ctx.lineTo(x0, y1);
  } else {
    addJigsawEdge(ctx, x1, y1, x0, y1, getJigsawTabDir('h', r, c), 0.22);
  }

  // 4. Left Edge (bottom to top)
  if (c === 0) {
    ctx.lineTo(x0, y0);
  } else {
    addJigsawEdge(ctx, x0, y1, x0, y0, -getJigsawTabDir('v', r, c - 1), 0.22);
  }

  ctx.closePath();
}

/**
 * Main Bumper Canvas Entry Point
 * Dispatches to:
 * 1. Bumper Logo (Single or Multiple Logo)
 * 2. Video Title Screen (Inspired by IKN Reference)
 * 3. Frame Video Logo Overlay (Inspired by Diagonal Watermark Reference)
 */
export function renderBumperFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BumperConfig,
  time: number
) {
  const speed = config.motionSpeed || 1;

  ctx.save();

  if (config.studioMode === 'frame_video') {
    // Mode 3: Frame Video Logo Overlay
    renderFrameVideoMode(ctx, width, height, config, time);
  } else if (config.studioMode === 'video_title') {
    // Mode 2: Video Title Screen
    renderMasterBackground(ctx, width, height, config, time);
    renderVideoTitleMode(ctx, width, height, config, time, speed);
  } else {
    // Mode 1: Bumper Logo (Single or Multiple)
    renderMasterBackground(ctx, width, height, config, time);
    renderMasterPresentation(ctx, width, height, config, time, speed);
  }

  // Color Tone Grading (Applied across all modes)
  if (config.colorTone && config.colorTone !== 'none') {
    applyColorTone(ctx, width, height, config.colorTone);
  }

  // Post FX: Film Grain
  if (config.filmGrain && config.studioMode !== 'frame_video') {
    applyFilmGrain(ctx, width, height, time);
  }

  // Post FX: Vignette
  if (config.vignette && config.studioMode !== 'frame_video') {
    applyVignette(ctx, width, height);
  }

  // Post FX: Letterbox Cinematic Bars
  if (config.letterbox && config.aspectRatio === '16:9' && config.studioMode !== 'frame_video') {
    const barHeight = height * 0.1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, barHeight);
    ctx.fillRect(0, height - barHeight, width, barHeight);
  }

  ctx.restore();
}

/**
 * Master Background Renderer
 * Handles solid colors, multi-stop gradients, fully adjustable volumetric spotlight circles,
 * CAD grid, futuristic effects (laser scanner, cyber hex, hologram, light streaks), and photo backdrops.
 */
function renderMasterBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BumperConfig,
  t: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 1000;

  const bgPrimary = cfg.backgroundColor || '#181F2B';
  const bgSecondary = cfg.backgroundSecondaryColor || '#3A0E14';
  const accent = cfg.accentColor || '#DFCEB5';
  const secColor = cfg.secondaryColor || '#DFCEB5';

  // 1. BASE BACKGROUND LAYER
  if (cfg.backgroundStyle === 'solid') {
    ctx.fillStyle = bgPrimary;
    ctx.fillRect(0, 0, w, h);
  } else if (cfg.backgroundStyle === 'custom_image' && cfg.customBackgroundUrl) {
    const bgImg = getCachedImage(cfg.customBackgroundUrl);
    if (bgImg) {
      const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasAspect = w / h;
      let dw = w, dh = h, dx = 0, dy = 0;
      if (imgAspect > canvasAspect) {
        dw = h * imgAspect;
        dx = (w - dw) / 2;
      } else {
        dh = w / imgAspect;
        dy = (h - dh) / 2;
      }
      ctx.drawImage(bgImg, dx, dy, dw, dh);
      ctx.fillStyle = 'rgba(4, 8, 16, 0.72)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = bgPrimary;
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, w * 0.8, h);
    bgGrad.addColorStop(0, bgPrimary);
    bgGrad.addColorStop(0.5, bgSecondary);
    bgGrad.addColorStop(1, bgPrimary);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // 2. BULATAN CAHAYA (Spotlight Circle) - STRICTLY RESPECTS TOGGLE
  const isRadialGlowStyle = cfg.backgroundStyle === 'radial_glow';
  const isSpotlightEnabled = cfg.spotlightEnabled === true;
  const spotIntensity = cfg.spotlightIntensity !== undefined
    ? cfg.spotlightIntensity
    : (isRadialGlowStyle ? 0.9 : 0.65);

  if (isSpotlightEnabled && spotIntensity > 0 && cfg.backgroundStyle !== 'solid') {
    const pulseSpeed = cfg.spotlightPulseSpeed !== undefined ? cfg.spotlightPulseSpeed : 1.0;
    const pulse = 1.0 + Math.sin(t * 1.8 * pulseSpeed) * 0.08 * (pulseSpeed > 0 ? 1 : 0);

    const radiusMultiplier = (cfg.spotlightRadius !== undefined ? cfg.spotlightRadius : (isRadialGlowStyle ? 90 : 70)) / 100;
    const spotRadius = Math.min(w, h) * 0.58 * radiusMultiplier * pulse;

    const yOffsetPercent = (cfg.spotlightYOffset || 0) / 100;
    const spotY = cy + (h * 0.3) * yOffsetPercent;

    const baseColor = cfg.spotlightColor || secColor;
    const softness = cfg.spotlightSoftness !== undefined ? cfg.spotlightSoftness : 0.75;
    const midStop = Math.max(0.1, Math.min(0.9, softness * 0.65));

    const spotGrad = ctx.createRadialGradient(cx, spotY, 0, cx, spotY, spotRadius);
    spotGrad.addColorStop(0, hexToRgba(baseColor, spotIntensity * (isRadialGlowStyle ? 0.65 : 0.42)));
    spotGrad.addColorStop(midStop, hexToRgba(accent, spotIntensity * (isRadialGlowStyle ? 0.28 : 0.16)));
    spotGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    if (softness < 0.35 || isRadialGlowStyle) {
      ctx.strokeStyle = hexToRgba(baseColor, spotIntensity * 0.3);
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(cx, spotY, spotRadius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. EFEK FUTURISTIK & MODERN
  // A. Digital Laser Scanline
  const isLaserActive = cfg.laserScanline || cfg.futuristicEffect === 'laser_scan';
  if (isLaserActive) {
    ctx.save();
    const laserY = (Math.sin(t * 1.6) * 0.5 + 0.5) * h;
    const lGrad = ctx.createLinearGradient(0, laserY - 8 * scale, 0, laserY + 8 * scale);
    lGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    lGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.65)');
    lGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = lGrad;
    ctx.fillRect(0, laserY - 8 * scale, w, 16 * scale);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(0, laserY);
    ctx.lineTo(w, laserY);
    ctx.stroke();
    ctx.restore();
  }

  // B. Cyber Hexagonal Mesh (Always active if cyber_hex style or toggle selected)
  const isHexActive = cfg.cyberHexMesh || cfg.futuristicEffect === 'cyber_hex' || cfg.backgroundStyle === 'cyber_hex';
  if (isHexActive) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(accent, cfg.backgroundStyle === 'cyber_hex' ? 0.18 : 0.08);
    ctx.lineWidth = 1 * scale;
    const hexR = 36 * scale;
    const hDist = hexR * Math.sqrt(3);
    const vDist = hexR * 1.5;

    for (let hy = -vDist; hy < h + vDist; hy += vDist) {
      const rowIdx = Math.floor(hy / vDist);
      const xOff = (rowIdx % 2 === 0) ? 0 : hDist / 2;
      for (let hx = -hDist + xOff; hx < w + hDist; hx += hDist) {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a + Math.PI / 6;
          const px = hx + hexR * Math.cos(angle);
          const py = hy + hexR * Math.sin(angle);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Subtle glowing dot at intersection in cyber_hex mode
        if (cfg.backgroundStyle === 'cyber_hex' && ((Math.floor(hx) + Math.floor(hy)) % 7 === 0)) {
          ctx.fillStyle = hexToRgba(accent, 0.35);
          ctx.beginPath();
          ctx.arc(hx, hy, 1.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // C. Hologram Scanlines (Active if hologram_lines style or toggle)
  const isHoloActive = cfg.hologramLines || cfg.futuristicEffect === 'hologram_lines' || cfg.backgroundStyle === 'hologram_lines';
  if (isHoloActive && cfg.backgroundStyle !== 'solid') {
    ctx.save();
    ctx.fillStyle = hexToRgba(accent, cfg.backgroundStyle === 'hologram_lines' ? 0.06 : 0.025);
    const scanStep = 4 * scale;
    for (let sy = 0; sy < h; sy += scanStep) {
      ctx.fillRect(0, sy, w, 1 * scale);
    }
    // Animated slow vertical sweep beam
    const holoSweepY = ((t * 0.15) % 1.0) * h;
    const holoGrad = ctx.createLinearGradient(0, holoSweepY - 30 * scale, 0, holoSweepY + 30 * scale);
    holoGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    holoGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
    holoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = holoGrad;
    ctx.fillRect(0, holoSweepY - 30 * scale, w, 60 * scale);
    ctx.restore();
  }

  // D. Speed Light Streaks
  const isStreaksActive = cfg.lightStreaks || cfg.futuristicEffect === 'light_streaks';
  if (isStreaksActive && cfg.backgroundStyle !== 'solid') {
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const sProgress = ((t * (0.3 + i * 0.08) + i * 0.22) % 1.0);
      const sx = sProgress * (w * 1.6) - w * 0.3;
      const sy = h * (0.2 + (i * 0.09));
      const sLen = 140 * scale * (0.8 + (i % 3) * 0.4);

      const sGrad = ctx.createLinearGradient(sx - sLen, sy, sx, sy);
      sGrad.addColorStop(0, 'rgba(0,0,0,0)');
      sGrad.addColorStop(0.7, hexToRgba(accent, 0.25));
      sGrad.addColorStop(1, hexToRgba('#FFFFFF', 0.8));

      ctx.fillStyle = sGrad;
      ctx.fillRect(sx - sLen, sy - 1 * scale, sLen, 2 * scale);
    }
    ctx.restore();
  }

  // 4. PRECISION CAD TECHNICAL GRID (Active if technical_grid or showGrid)
  const isCadGridStyle = cfg.backgroundStyle === 'technical_grid';
  const showGrid = (cfg.showGrid || isCadGridStyle) && cfg.backgroundStyle !== 'solid';
  if (showGrid) {
    const gridOp = isCadGridStyle ? 0.09 : (cfg.gridOpacity !== undefined ? cfg.gridOpacity : 0.035);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${gridOp})`;
    ctx.lineWidth = 1 * scale;
    const step = 50 * scale;

    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // High-tech CAD crosshairs at intersections
    if (isCadGridStyle) {
      ctx.strokeStyle = hexToRgba(accent, 0.4);
      ctx.lineWidth = 1.2 * scale;
      const crossStep = step * 2;
      for (let cxp = crossStep; cxp < w; cxp += crossStep) {
        for (let cyp = crossStep; cyp < h; cyp += crossStep) {
          ctx.beginPath();
          ctx.moveTo(cxp - 5 * scale, cyp);
          ctx.lineTo(cxp + 5 * scale, cyp);
          ctx.moveTo(cxp, cyp - 5 * scale);
          ctx.lineTo(cxp, cyp + 5 * scale);
          ctx.stroke();
        }
      }

      // Technical blueprint coordinate tags in corners
      ctx.font = `700 ${9 * scale}px "JetBrains Mono", monospace`;
      ctx.fillStyle = hexToRgba(accent, 0.55);
      ctx.fillText('CAD REF // DATUM WGS84: 0°58\'12"S 116°50\'44"E', 30 * scale, 30 * scale);
      ctx.fillText('SCALE 1:1000 // ARCHITECTURAL SYSTEM', 30 * scale, h - 30 * scale);
      ctx.textAlign = 'right';
      ctx.fillText('NUSA JAYA WISWAKHARMAN [KSO]', w - 30 * scale, h - 30 * scale);
      ctx.textAlign = 'left';
    }

    ctx.strokeStyle = hexToRgba(secColor, 0.35);
    ctx.beginPath();
    ctx.moveTo(cx - 24 * scale, cy);
    ctx.lineTo(cx + 24 * scale, cy);
    ctx.moveTo(cx, cy - 24 * scale);
    ctx.lineTo(cx, cy + 24 * scale);
    ctx.stroke();
    ctx.restore();
  }

  // Floating Dust Particles
  const isParticlesStyle = cfg.backgroundStyle === 'particles';
  const particleCount = isParticlesStyle ? Math.max(90, cfg.particleCount || 90) : (cfg.particleCount !== undefined ? cfg.particleCount : 45);
  if ((particleCount > 0 || isParticlesStyle) && cfg.backgroundStyle !== 'solid') {
    const pColor = cfg.particleColor || secColor;
    const particles = getParticles(cfg.theme || 'default', Math.min(particleCount, 250));
    particles.forEach((pt) => {
      const py = ((pt.y + 0.5 - t * 0.05 * (0.6 + pt.seed * 0.4)) % 1 + 1) % 1;
      const px = ((pt.x + 0.5 + Math.sin(t * 0.45 + pt.seed * 8) * 0.04) % 1 + 1) % 1;
      const alpha = (0.25 + Math.sin(t * 2.0 + pt.seed * 15) * 0.25) * (1 - Math.abs(py - 0.5) * 1.6);
      if (alpha > 0) {
        ctx.fillStyle = hexToRgba(pColor, alpha * (isParticlesStyle ? 1.0 : 0.8));
        ctx.beginPath();
        ctx.arc(px * w, py * h, pt.size * scale * (isParticlesStyle ? 1.5 : 1.0) * (0.6 + pt.seed * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

/**
 * Single Logo Animated Assembly:
 * 1. Logo starts MUCH LARGER and HERO-CENTERED
 * 2. Piece-by-piece reveal according to shape:
 *    - Phase 1: Green Triangle pops in / scales with bounce
 *    - Phase 2: Blue Triangle locks in
 *    - Phase 3: Yellow/Amber Triangle locks in
 * 3. Emblem is complete, holds center with energetic pulsing halo & flare
 * 4. Smoothly glides to the left
 * 5. Logo text ("NUSA KONSTRUKSI ENJINIRING") emerges on the right with beam wipe
 */
/**
 * Single Logo Animated Assembly & Transitions:
 * Supports:
 * 1. Segitiga Bergantian (NKE Sliced Geometric)
 * 2. Smooth Zoom & Flare Sweep
 * 3. 3D Isometric Flip & Glow
 * 4. Elastic Snap & Pulse Ring
 * 5. Digital Matrix Scan Reveal
 */
function renderSingleLogoSlicedAssemble(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BumperConfig,
  tAdj: number,
  scale: number,
  secColor: string
) {
  const logoScale = (cfg.singleLogoScale || 1.25) * (cfg.singleLogo?.scale || 1.0);
  const baseH = 100 * scale * logoScale;
  const animType = cfg.singleLogoTransition || cfg.singleLogoAnimation || 'nke_triangles_assemble';

  const customLogoUrl = cfg.singleLogo?.url || cfg.customLogoUrl || '/assets/aistudio/kso_nke_hd.png';
  const customImg = getCachedImage(customLogoUrl);
  const isNke = Boolean(
    customLogoUrl.includes('kso_nke') ||
    customLogoUrl.includes('Logo_NKE') ||
    cfg.singleLogo?.name?.toLowerCase().includes('nke') ||
    (!customLogoUrl && !customImg)
  );

  // Compute accurate aspect ratio and dimensions for active logo
  let aspect = 1.0;
  if (customImg && customImg.naturalHeight > 0) {
    aspect = getLogoAspect(customImg);
  } else if (isNke) {
    aspect = 1800 / 362; // ~4.97:1 aspect ratio
  } else if (customLogoUrl.includes('jaya')) {
    aspect = 1.0;
  } else if (customLogoUrl.includes('wiswa')) {
    aspect = 1.0;
  }
  const fitScale = Math.min(1, (w * 0.72) / (baseH * aspect), (h * 0.34) / baseH);
  const logoW = baseH * aspect * fitScale;
  const logoH = baseH * fitScale;

  // Title & Text presence (Only slides left if user enabled title or non-empty title provided)
  const titleText = (cfg.singleLogoTitle || (cfg.singleLogoShowTitle ? cfg.title : '') || '').trim();
  const hasTitle = Boolean(cfg.singleLogoShowTitle && titleText.length > 0);
  const shouldSlide = hasTitle;

  // Glide to the left only when title is present
  const pSlide = clamp((tAdj - 1.9) / 0.85);
  const easeSlide = easeOutCubic(pSlide);
  const slideDistance = Math.min(w * 0.24, (logoW / 2 + 110 * scale));
  const curX = shouldSlide ? -slideDistance * easeSlide : 0;

  // Text emerges on the right after gliding left
  const pText = clamp((tAdj - 2.3) / 0.85);
  const easeText = easeOutCubic(pText);
  const alphaText = shouldSlide ? clamp(pText * 1.4) : 0;

  const haloIntensity = clamp(cfg.logoHaloIntensity ?? 0.6);

  ctx.save();
  ctx.translate(curX, 0);

  if (cfg.logoHaloEnabled !== false && haloIntensity > 0) {
    const haloPulse = 1.0 + Math.sin(tAdj * 2.2) * 0.08;
    const haloRadius = Math.max(logoW, logoH) * 0.75 * haloPulse;
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
    haloGrad.addColorStop(0, hexToRgba('#DFCEB5', 0.4 * haloIntensity));
    haloGrad.addColorStop(0.5, hexToRgba('#5C1018', 0.2 * haloIntensity));
    haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Logo with Chosen Animation
  // =========================================================================
  // 1. A. LOGO BESAR MUNCUL MUTER, BERHENTI, TRUS KECIL, KEATAS, TULISAN MUNCUL
  // =========================================================================
  if (animType === 'spin_shrink_up') {
    let sLogo = 1.0;
    let rLogo = 0;
    let yLogo = 0;
    let aLogo = 1.0;

    if (tAdj < 1.15) {
      const pSpin = clamp(tAdj / 1.15);
      const easeSpin = easeOutCubic(pSpin);
      sLogo = 2.15 - 0.75 * easeSpin;
      rLogo = (1 - easeSpin) * Math.PI * 4;
      aLogo = clamp(tAdj / 0.35);
      yLogo = 0;
    } else if (tAdj < 1.70) {
      const pRest = (tAdj - 1.15) / 0.55;
      sLogo = 1.40 + 0.02 * Math.sin(pRest * Math.PI * 2);
      rLogo = 0;
      aLogo = 1.0;
      yLogo = 0;
    } else {
      const pUp = clamp((tAdj - 1.70) / 0.65);
      const easeUp = easeOutCubic(pUp);
      sLogo = 1.40 - 0.40 * easeUp;
      rLogo = 0;
      aLogo = 1.0;
      yLogo = -75 * scale * easeUp;
    }

    ctx.save();
    ctx.translate(0, yLogo);
    ctx.rotate(rLogo);
    ctx.scale(sLogo, sLogo);
    ctx.globalAlpha = aLogo;

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();

    // Center flare during rest (1.15s - 1.85s)
    if (cfg.anamorphicFlare === true && tAdj > 1.15 && tAdj < 1.85) {
      const pFlare = (tAdj - 1.15) / 0.70;
      const flareX = (pFlare * 2 - 1) * (logoW * 0.9);
      const flareA = Math.sin(pFlare * Math.PI) * 0.95;
      ctx.save();
      ctx.translate(flareX, yLogo);
      const fGrad = ctx.createLinearGradient(-logoW * 0.4, 0, logoW * 0.4, 0);
      fGrad.addColorStop(0, 'rgba(255,255,255,0)');
      fGrad.addColorStop(0.5, `rgba(255,255,255,${flareA})`);
      fGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(-logoW * 0.4, -3 * scale, logoW * 0.8, 6 * scale);
      ctx.restore();
    }

    // Title emerges below (tAdj > 2.20s)
    if (tAdj > 2.20) {
      const pTitle = clamp((tAdj - 2.20) / 0.70);
      const easeTitle = easeOutBack(pTitle);
      const alphaTitle = clamp(pTitle * 1.5);
      const titleY = 52 * scale;
      const dispText = titleText || 'NUSA KONSTRUKSI ENJINIRING';

      ctx.save();
      ctx.globalAlpha = alphaTitle;
      const fontFam = cfg.singleLogoTitleFont || cfg.bumperTitleFont || cfg.fontFamily || 'Plus Jakarta Sans';
      const titleCol = cfg.singleLogoTitleColor || cfg.titleColor || '#FFFFFF';

      const beamW = 160 * scale * easeTitle;
      const bGrad = ctx.createLinearGradient(-beamW, 0, beamW, 0);
      bGrad.addColorStop(0, 'rgba(255,255,255,0)');
      bGrad.addColorStop(0.5, hexToRgba('#FFB51C', 0.85));
      bGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-beamW, titleY - 24 * scale, beamW * 2, 2.5 * scale);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fs = (cfg.singleLogoTitleSize || 32) * scale * (0.85 + 0.15 * easeTitle);
      ctx.font = `800 ${fs}px "${fontFam}", sans-serif`;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(dispText, 0, titleY + 3 * scale);
      ctx.fillStyle = titleCol;
      ctx.fillText(dispText, 0, titleY);
      ctx.restore();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // 2. C. HURUF JATOH SATU SATU
  // =========================================================================
  if (animType === 'letters_falling') {
    const pPop = clamp(tAdj / 0.60);
    const sLogo = 0.80 + 0.20 * easeOutBack(pPop);
    const aLogo = clamp(pPop * 1.8);
    const yLogo = -65 * scale;

    ctx.save();
    ctx.translate(0, yLogo);
    ctx.scale(sLogo, sLogo);
    ctx.globalAlpha = aLogo;

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();

    const dispText = titleText || 'NUSA KONSTRUKSI ENJINIRING';
    const fontFam = cfg.singleLogoTitleFont || cfg.bumperTitleFont || cfg.fontFamily || 'Plus Jakarta Sans';
    const titleCol = cfg.singleLogoTitleColor || cfg.titleColor || '#FFFFFF';
    drawFallingLetters(ctx, dispText, 0, 50 * scale, scale, tAdj, fontFam, titleCol, cfg.singleLogoTitleSize || 32);

    ctx.restore();
    return;
  }

  // =========================================================================
  // 3. D. EFFECT CAT TERKELUPAS KETIUP ANGIN, MUNCUL LOGO DAN TULISAN
  // =========================================================================
  if (animType === 'paint_peel_wind') {
    const yLogo = -45 * scale;
    ctx.save();
    ctx.translate(0, yLogo);

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();

    const dispText = titleText || 'NUSA KONSTRUKSI ENJINIRING';
    const fontFam = cfg.singleLogoTitleFont || cfg.bumperTitleFont || cfg.fontFamily || 'Plus Jakarta Sans';
    const titleCol = cfg.singleLogoTitleColor || cfg.titleColor || '#FFFFFF';
    const titleY = 48 * scale;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fs = (cfg.singleLogoTitleSize || 32) * scale;
    ctx.font = `800 ${fs}px "${fontFam}", sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(dispText, 0, titleY + 3 * scale);
    ctx.fillStyle = titleCol;
    ctx.fillText(dispText, 0, titleY);
    ctx.restore();

    drawPaintPeelWindEffect(ctx, w, h, scale, tAdj, cfg.anamorphicFlare === true);

    ctx.restore();
    return;
  }

  if (animType === 'puzzle_assemble') {
    // =========================================================================
    // A. PUZZLE ASSEMBLE: Interlocking Small Jigsaw Pieces (Biru, Oren, Hijau, Gold)
    // - Emblem is constructed from small precision jigsaw pieces
    // - Zero cut-off / clipping: uses exact emblem aspect ratio & safe bounds
    // - Text emerges smoothly with silky wipe after emblem pieces snap together
    // =========================================================================
    const isWideLogoWithText = aspect > 2.0;
    // For NKE logo, the emblem is 954px of 1800px (~0.53 ratio). For other wide logos, ~0.52.
    const emblemRatio = isNke ? (954 / 1800) : (isWideLogoWithText ? 0.52 : 1.0);
    const emblemW = isWideLogoWithText ? logoW * emblemRatio : logoW;
    const emblemH = logoH;

    const emblemX0 = -logoW / 2;
    const emblemY0 = -logoH / 2;
    const emblemX1 = emblemX0 + emblemW;
    const emblemY1 = emblemY0 + emblemH;
    const emblemCenterX = emblemX0 + emblemW / 2;
    const emblemCenterY = 0;

    const rows = 4;
    const cols = isWideLogoWithText ? 6 : 4;
    const cellW = emblemW / cols;
    const cellH = emblemH / rows;

    // Piece colors based on the official NKE / KSO palette (Hijau, Oren, Biru, Gold)
    const getPieceColor = (r: number, c: number) => {
      if (isWideLogoWithText) {
        if (c <= 1) {
          return r % 2 === 0 ? '#00C853' : '#12A727'; // Hijau NKE
        } else if (c <= 3) {
          if (r <= 1) return (r + c) % 2 === 0 ? '#FF7A00' : '#FF9100'; // Oren / Amber
          return (r + c) % 2 === 0 ? '#1E88E5' : '#144DFF'; // Biru Sapphire
        } else {
          if (r === 0) return '#FFB51C'; // Amber / Gold
          if (r === 3 && c === 5) return '#DFCEB5'; // Warm Sand / Gold Accent
          return (r + c) % 2 === 0 ? '#1E88E5' : '#2979FF'; // Biru NKE
        }
      } else {
        const palette = ['#00C853', '#FF7A00', '#1E88E5', '#DFCEB5'];
        return palette[(r * 2 + c) % palette.length];
      }
    };

    ctx.save();

    // 1. Draw small interlocking puzzle pieces flying in and clicking together
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pCenterX = emblemX0 + (c + 0.5) * cellW;
        const pCenterY = emblemY0 + (r + 0.5) * cellH;

        // Angle and distance radiating from emblem center
        const angle = Math.atan2(pCenterY - emblemCenterY, pCenterX - emblemCenterX);
        const distFromCenter = Math.hypot((c - (cols - 1) / 2) / cols, (r - (rows - 1) / 2) / rows);
        const pieceDelay = 0.04 + distFromCenter * 0.18 + ((r * 2 + c) % 3) * 0.04;

        // Silky smooth quintic easing for fluid floating flight
        const pProg = clamp((tAdj - pieceDelay) / 0.52);
        const easeP = 1 - Math.pow(1 - pProg, 4);

        const offDist = (1 - easeP) * 150 * scale;
        const dirX = Math.cos(angle) * (1.1 + ((r * 3 + c) % 3) * 0.2);
        const dirY = Math.sin(angle) * (1.1 + ((r + c * 3) % 3) * 0.2);
        const offX = dirX * offDist;
        const offY = dirY * offDist;
        const curRot = (1 - easeP) * ((((r * 3 + c * 5) % 7) - 3) * 0.07);
        const pAlpha = clamp(pProg * 2.2);
        const pieceColor = getPieceColor(r, c);

        ctx.save();
        ctx.translate(pCenterX + offX, pCenterY + offY);
        ctx.rotate(curRot);
        ctx.translate(-pCenterX, -pCenterY);
        ctx.globalAlpha = pAlpha;

        // Soft colored halo aura
        ctx.shadowColor = hexToRgba(pieceColor, 0.65 * (1 - easeP * 0.4));
        ctx.shadowBlur = 12 * scale * (1 - easeP * 0.3);

        // Clip strictly to this piece's authentic interlocking jigsaw contour
        buildGridJigsawPiecePath(ctx, r, c, rows, cols, emblemX0, emblemY0, cellW, cellH);
        ctx.clip();

        // Render full image inside piece - perfectly aligned with natural aspect ratio
        if (customImg) {
          drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
        } else if (isNke) {
          drawLogo1NKE(ctx, 0, 0, logoH, logoW);
        } else {
          drawNkeEmblemDirect(ctx, emblemX0, emblemY0, emblemY1, emblemW / 2, emblemW / 2, scale);
        }

        // Visible jigsaw tab seam stroke in this piece's color while assembling
        if (easeP < 0.99) {
          ctx.strokeStyle = pieceColor;
          ctx.lineWidth = 1.5 * scale;
          buildGridJigsawPiecePath(ctx, r, c, rows, cols, emblemX0, emblemY0, cellW, cellH);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 2. Once all pieces assemble (tAdj >= 0.82), render unified seamless emblem with zero cracks
    if (tAdj >= 0.82) {
      const pSolid = clamp((tAdj - 0.82) / 0.18);
      ctx.save();
      ctx.globalAlpha = pSolid;
      ctx.beginPath();
      ctx.rect(emblemX0 - 4 * scale, -logoH / 2 - 10 * scale, emblemW + 8 * scale, logoH + 20 * scale);
      ctx.clip();
      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else if (isNke) {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      }
      ctx.restore();
    }

    // 3. Locking ripple wave & energetic sparkles in Blue, Orange, Green, and Gold
    if (tAdj > 0.72 && tAdj < 1.7) {
      const pR = clamp((tAdj - 0.72) / 0.95);
      ctx.save();
      // Ripple ring 1: Warm Sand / Gold
      ctx.strokeStyle = hexToRgba('#DFCEB5', (1 - pR) * 0.9);
      ctx.lineWidth = (3.0 - pR * 2.2) * scale;
      ctx.beginPath();
      ctx.arc(emblemCenterX, emblemCenterY, (emblemW * 0.32) + pR * 90 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Ripple ring 2: Energetic Blue
      ctx.strokeStyle = hexToRgba('#1E88E5', (1 - pR) * 0.7);
      ctx.lineWidth = (2.2 - pR * 1.6) * scale;
      ctx.beginPath();
      ctx.arc(emblemCenterX, emblemCenterY, (emblemW * 0.26) + pR * 70 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Sparkle dots in Green, Orange, and Blue
      const sparkColors = ['#00C853', '#FF7A00', '#1E88E5', '#DFCEB5'];
      for (let s = 0; s < 14; s++) {
        const sAngle = (s / 14) * Math.PI * 2 + pR * 0.4;
        const sDist = (emblemW * 0.35) + pR * (65 + (s % 3) * 30) * scale;
        const sx = emblemCenterX + Math.cos(sAngle) * sDist;
        const sy = emblemCenterY + Math.sin(sAngle) * sDist * 0.7;
        const sAlpha = (1 - pR) * 0.85;
        ctx.fillStyle = hexToRgba(sparkColors[s % sparkColors.length], sAlpha);
        ctx.beginPath();
        ctx.arc(sx, sy, (3.0 - pR * 2.0) * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. "Logo KECUALI tulisan": Logo text reveals cleanly AFTER emblem pieces lock together!
    if (isWideLogoWithText && tAdj > 0.65) {
      const pText = clamp((tAdj - 0.65) / 0.65);
      const easeT = 1 - Math.pow(1 - pText, 3);
      const textAlpha = clamp(pText * 1.5);
      const textSlide = (1 - easeT) * 16 * scale;

      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.translate(textSlide, 0);

      ctx.save();
      ctx.beginPath();
      // Safe clipping bounds: starts exactly at emblemX1 without slicing any text letter
      const textW = (logoW / 2 - emblemX1) + 40 * scale;
      ctx.rect(emblemX1 - 2 * scale, -logoH / 2 - 20 * scale, textW, logoH + 40 * scale);
      ctx.clip();

      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `800 ${logoH * 0.28}px "Plus Jakarta Sans", sans-serif`;
        drawLetterSpacedTextLeft(ctx, 'N  U  S  A', emblemX1 + 18 * scale, -logoH * 0.26, 3.0);
        ctx.font = `700 ${logoH * 0.22}px "Plus Jakarta Sans", sans-serif`;
        drawLetterSpacedTextLeft(ctx, 'KONSTRUKSI', emblemX1 + 18 * scale, 0.02 * logoH, 1.4);
        drawLetterSpacedTextLeft(ctx, 'ENJINIRING', emblemX1 + 18 * scale, 0.30 * logoH, 1.6);
      }
      ctx.restore();
      ctx.restore();
    }

    // 5. Specular shine sweep across assembled logo
    if (cfg.anamorphicFlare === true && tAdj > 1.0 && tAdj < 2.0) {
      const pF = clamp((tAdj - 1.0) / 0.95);
      const fX = (pF * 2 - 1) * (logoW * 0.9);
      ctx.save();
      ctx.translate(fX, 0);
      const fGrad = ctx.createLinearGradient(-logoW * 0.35, 0, logoW * 0.35, 0);
      fGrad.addColorStop(0, 'rgba(255,255,255,0)');
      fGrad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.sin(pF * Math.PI) * 0.90})`);
      fGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(-logoW * 0.35, -3 * scale, logoW * 0.7, 6 * scale);
      ctx.restore();
    }

    ctx.restore();
  } else if (animType === 'faded' || animType === 'minimalist_soft_fade') {
    // B. FADED: Smooth cinematic blur fade with soft scale expansion
    const pFade = clamp(tAdj / 0.95);
    const easeFade = easeOutCubic(pFade);
    const sLogo = 0.92 + 0.08 * easeFade;
    const aLogo = clamp(pFade * 1.5);

    ctx.save();
    ctx.scale(sLogo, sLogo);
    ctx.globalAlpha = aLogo;

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();
  } else if (animType === 'come_from_anywhere') {
    // =========================================================================
    // C. ATOMIC ORBITAL REVOLUTION (4K INTRO REFERENCE: https://youtu.be/bRNlrdfKNd4)
    // - Gyroscopic 3D atomic orbital rings revolving around plasma flare core
    // - High-speed glowing comet electrons with streaming light trails
    // - Intense energy convergence -> blinding supernova shockwave explosion
    // - Brand logo materializes crisply from the epicenter in full hero majesty
    // =========================================================================
    const tBurst = 1.30;
    const pCollapse = clamp((tAdj - 1.05) / 0.25);
    const easeCollapse = Math.pow(pCollapse, 3);

    ctx.save();

    // -------------------------------------------------------------------------
    // 1. REVOLVING 3D ATOMIC ORBITAL RINGS & COMET ELECTRONS (tAdj < 1.45s)
    // -------------------------------------------------------------------------
    if (tAdj < 1.45) {
      const ringAlpha = (1 - clamp((tAdj - 1.25) / 0.18));
      const baseOrbRadius = Math.max(logoW, logoH) * 0.58;
      const curRadius = baseOrbRadius * (1 - easeCollapse * 0.88);
      const speedMultiplier = 1.0 + easeCollapse * 2.8;

      // 5 Precision 3D Orbital Rings (inclination & tilt matching reference YouTube video)
      const orbits = [
        { tilt: -0.62, aspect: 0.38, speed: 2.4, phase: 0.15, color: '#38BDF8' },
        { tilt: 0.62, aspect: 0.38, speed: -2.6, phase: 0.65, color: '#FFFFFF' },
        { tilt: 1.57, aspect: 0.50, speed: 2.1, phase: 0.35, color: '#60A5FA' },
        { tilt: 0.05, aspect: 0.32, speed: -2.8, phase: 0.85, color: '#DFCEB5' },
        { tilt: -1.18, aspect: 0.44, speed: 2.9, phase: 0.45, color: '#38BDF8' },
      ];

      // Ambient Core Glow
      const coreAmbientGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, curRadius * 1.4);
      coreAmbientGrad.addColorStop(0, hexToRgba('#38BDF8', 0.45 * ringAlpha));
      coreAmbientGrad.addColorStop(0.5, hexToRgba('#1E40AF', 0.20 * ringAlpha));
      coreAmbientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreAmbientGrad;
      ctx.beginPath();
      ctx.arc(0, 0, curRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Soft elliptical ground reflection
      ctx.save();
      const shadowGrad = ctx.createRadialGradient(0, curRadius * 0.95, 0, 0, curRadius * 0.95, curRadius * 0.85);
      shadowGrad.addColorStop(0, hexToRgba('#0284C7', 0.35 * ringAlpha));
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, curRadius * 0.95, curRadius * 0.85, curRadius * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw each orbital ellipse and streaming comet electron
      orbits.forEach((orb) => {
        ctx.save();
        ctx.rotate(orb.tilt);
        ctx.scale(1, orb.aspect);

        // A. Full elliptical glowing ring path
        ctx.beginPath();
        ctx.arc(0, 0, curRadius, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(orb.color, 0.45 * ringAlpha);
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        // Inner subtle bright core of the ring
        ctx.strokeStyle = hexToRgba('#FFFFFF', 0.70 * ringAlpha);
        ctx.lineWidth = 0.8 * scale;
        ctx.stroke();

        // B. Traveling Comet Electron with Tapering Light Streak Tail
        const thetaHead = (tAdj * orb.speed * speedMultiplier + orb.phase) * Math.PI * 2;
        const tailSegments = 24;
        const tailArc = Math.PI * 0.55;

        for (let seg = tailSegments; seg >= 0; seg--) {
          const u = seg / tailSegments;
          const a1 = thetaHead - u * tailArc;
          const a2 = thetaHead - Math.max(0, u - 1 / tailSegments) * tailArc;

          const segAlpha = (1 - u) * ringAlpha * 0.95;
          const segWidth = (3.5 - u * 2.5) * scale;

          ctx.beginPath();
          ctx.arc(0, 0, curRadius, a1, a2, false);
          ctx.strokeStyle = hexToRgba(u < 0.3 ? '#FFFFFF' : orb.color, segAlpha);
          ctx.lineWidth = segWidth;
          ctx.stroke();
        }

        // C. Brilliant Glowing Comet Head
        const hx = curRadius * Math.cos(thetaHead);
        const hy = curRadius * Math.sin(thetaHead);

        // Electron halo
        ctx.fillStyle = hexToRgba(orb.color, 0.85 * ringAlpha);
        ctx.beginPath();
        ctx.arc(hx, hy, 7 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Intense White Center
        ctx.fillStyle = hexToRgba('#FFFFFF', ringAlpha);
        ctx.beginPath();
        ctx.arc(hx, hy, 3.2 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Central Pulsing Plasma Star Core (Glowing Sphere from reference video)
      const corePulse = 1.0 + Math.sin(tAdj * 18) * 0.12;
      const coreRadius = (16 * scale * corePulse) * (1 + easeCollapse * 0.8);
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 2.2);
      coreGrad.addColorStop(0, hexToRgba('#FFFFFF', ringAlpha));
      coreGrad.addColorStop(0.25, hexToRgba('#E0F2FE', 0.95 * ringAlpha));
      coreGrad.addColorStop(0.55, hexToRgba('#38BDF8', 0.75 * ringAlpha));
      coreGrad.addColorStop(0.85, hexToRgba('#0284C7', 0.30 * ringAlpha));
      coreGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      if (cfg.anamorphicFlare === true) {
        ctx.save();
        const numRays = 8;
        for (let r = 0; r < numRays; r++) {
          const rayAngle = (r / numRays) * Math.PI * 2 + tAdj * 0.6;
          const rayLen = (36 + Math.sin(tAdj * 15 + r * 1.5) * 12) * scale * (1 - easeCollapse * 0.4);
          const rx = Math.cos(rayAngle) * rayLen;
          const ry = Math.sin(rayAngle) * rayLen;

          ctx.strokeStyle = hexToRgba('#FFFFFF', 0.85 * ringAlpha);
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(rx, ry);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Inward-converging gravitational sparks
      for (let sp = 0; sp < 12; sp++) {
        const spAngle = (sp / 12) * Math.PI * 2 + tAdj * 1.5;
        const spDist = baseOrbRadius * (0.9 - ((tAdj * 0.9 + sp * 0.08) % 0.8));
        const sx = Math.cos(spAngle) * spDist;
        const sy = Math.sin(spAngle) * spDist * 0.55;
        const spAlpha = Math.sin(clamp(spDist / baseOrbRadius) * Math.PI) * ringAlpha * 0.8;
        ctx.fillStyle = hexToRgba('#38BDF8', spAlpha);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.0 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // -------------------------------------------------------------------------
    // 2. SUPERNOVA ENERGY BURST & SHOCKWAVE FLASH (tAdj >= 1.20s & tAdj < 2.2s)
    // -------------------------------------------------------------------------
    if (tAdj >= 1.20 && tAdj < 2.2) {
      const pBurst = clamp((tAdj - 1.20) / 0.85);
      const burstAlpha = Math.sin(clamp((tAdj - 1.20) / 0.70) * Math.PI);

      ctx.save();

      if (cfg.anamorphicFlare === true) {
        const beamHeight = (28 * (1 - pBurst) + 3) * scale;
        const beamGrad = ctx.createLinearGradient(-w * 0.45, 0, w * 0.45, 0);
        beamGrad.addColorStop(0, 'rgba(255,255,255,0)');
        beamGrad.addColorStop(0.35, hexToRgba('#38BDF8', burstAlpha * 0.4));
        beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${burstAlpha * 0.98})`);
        beamGrad.addColorStop(0.65, hexToRgba('#DFCEB5', burstAlpha * 0.4));
        beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(-w * 0.45, -beamHeight / 2, w * 0.9, beamHeight);
      }

      // B. Expanding Concentric Shockwave Rings
      const ring1R = pBurst * 260 * scale;
      const ring1A = (1 - pBurst) * 0.95;
      ctx.strokeStyle = hexToRgba('#38BDF8', ring1A);
      ctx.lineWidth = (3.5 - pBurst * 2.8) * scale;
      ctx.beginPath();
      ctx.arc(0, 0, ring1R, 0, Math.PI * 2);
      ctx.stroke();

      if (pBurst > 0.15) {
        const pR2 = (pBurst - 0.15) / 0.85;
        const ring2R = pR2 * 220 * scale;
        const ring2A = (1 - pR2) * 0.8;
        ctx.strokeStyle = hexToRgba('#FFFFFF', ring2A);
        ctx.lineWidth = (2.5 - pR2 * 2.0) * scale;
        ctx.beginPath();
        ctx.arc(0, 0, ring2R, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (cfg.anamorphicFlare === true) {
        const starSpikes = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4];
        starSpikes.forEach((ang, idx) => {
          const spikeLen = (idx < 2 ? 160 : 90) * scale * (1 - pBurst * 0.8) * burstAlpha;
          const sx1 = Math.cos(ang) * spikeLen;
          const sy1 = Math.sin(ang) * spikeLen;
          ctx.strokeStyle = hexToRgba(idx < 2 ? '#FFFFFF' : '#38BDF8', burstAlpha * 0.9);
          ctx.lineWidth = (idx < 2 ? 2.5 : 1.5) * scale * (1 - pBurst * 0.5);
          ctx.beginPath();
          ctx.moveTo(-sx1, -sy1);
          ctx.lineTo(sx1, sy1);
          ctx.stroke();
        });
      }

      ctx.restore();
    }

    // -------------------------------------------------------------------------
    // 3. BRAND LOGO MATERIALIZES FROM SUPERNOVA EPICENTER (tAdj >= 1.25s)
    // -------------------------------------------------------------------------
    if (tAdj >= 1.25) {
      const pLogo = clamp((tAdj - 1.25) / 0.58);
      const easeLogo = easeOutBack(pLogo);
      const sLogo = 0.55 + 0.45 * easeLogo;
      const aLogo = clamp(pLogo * 1.8);

      ctx.save();
      ctx.scale(sLogo, sLogo);
      ctx.globalAlpha = aLogo;

      // Soft ambient blue & gold back-corona behind revealed logo
      const auraPulse = 1.0 + Math.sin(tAdj * 3.0) * 0.05;
      const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(logoW, logoH) * 0.65 * auraPulse);
      auraGrad.addColorStop(0, hexToRgba('#38BDF8', 0.35));
      auraGrad.addColorStop(0.5, hexToRgba('#DFCEB5', 0.15));
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(logoW, logoH) * 0.65 * auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // Render crisp, complete logo without any clipping
      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else if (isNke) {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      } else {
        drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
      }

      ctx.restore();

      // Anamorphic Specular Glint sweeping across the logo (1.65s - 2.65s)
      if (cfg.anamorphicFlare === true && tAdj > 1.65 && tAdj < 2.65) {
        const pGlint = clamp((tAdj - 1.65) / 0.95);
        const gX = (pGlint * 2 - 1) * (logoW * 0.9);
        ctx.save();
        ctx.translate(gX, 0);
        const gGrad = ctx.createLinearGradient(-logoW * 0.35, 0, logoW * 0.35, 0);
        gGrad.addColorStop(0, 'rgba(255,255,255,0)');
        gGrad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.sin(pGlint * Math.PI) * 0.95})`);
        gGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gGrad;
        ctx.fillRect(-logoW * 0.35, -3 * scale, logoW * 0.7, 6 * scale);
        ctx.restore();
      }
    }

    ctx.restore();
  } else if (animType === 'particle_trail') {
    // =========================================================================
    // D. PARTICLE TRAIL & LIGHT STREAM VORTEX (REFERENCE: https://youtu.be/ZQFFf6_A1eI)
    // - Swirling 3D light streams & luminous particle trails spiraling inward
    // - High-speed cosmic vortex acceleration into center singularity
    // - Blinding starburst flare explosion & concentric energy shockwaves
    // - Brand logo materializes hero-centered with shimmering particle dispersion
    // =========================================================================
    const tBurst = 1.25;
    const pCollapse = clamp((tAdj - 1.0) / 0.25);
    const easeCollapse = Math.pow(pCollapse, 3);

    ctx.save();

    // 1. INWARD SPIRALING LIGHT TRAILS & DUST STREAM (tAdj < 1.45s)
    if (tAdj < 1.45) {
      const trailAlpha = 1 - clamp((tAdj - 1.22) / 0.20);
      const vortexBaseR = Math.max(logoW, logoH) * 0.70;
      const curVortexR = vortexBaseR * (1 - easeCollapse * 0.88);
      const vortexSpeed = 1.0 + easeCollapse * 3.5;

      // Ambient inward vortex glow
      const vGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, curVortexR * 1.5);
      vGrad.addColorStop(0, hexToRgba('#38BDF8', 0.5 * trailAlpha));
      vGrad.addColorStop(0.4, hexToRgba('#144DFF', 0.25 * trailAlpha));
      vGrad.addColorStop(0.8, hexToRgba('#FFB51C', 0.15 * trailAlpha));
      vGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.arc(0, 0, curVortexR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 6 Swirling Spiral Light Beams (Vortex arms)
      const numArms = 6;
      for (let arm = 0; arm < numArms; arm++) {
        const baseAngle = (arm / numArms) * Math.PI * 2 + tAdj * 2.8 * vortexSpeed;
        const armColor = arm % 3 === 0 ? '#38BDF8' : arm % 3 === 1 ? '#FFB51C' : '#FFFFFF';

        ctx.save();
        ctx.beginPath();

        const steps = 36;
        for (let st = 0; st <= steps; st++) {
          const u = st / steps; // 0 (outer) to 1 (inner)
          const rSpiral = curVortexR * (1 - u * 0.92);
          const thetaSpiral = baseAngle + u * Math.PI * 2.2;
          const sx = Math.cos(thetaSpiral) * rSpiral;
          const sy = Math.sin(thetaSpiral) * rSpiral * 0.55; // 3D perspective slant

          if (st === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }

        ctx.strokeStyle = hexToRgba(armColor, 0.65 * trailAlpha);
        ctx.lineWidth = (3.2 - easeCollapse * 1.5) * scale;
        ctx.stroke();

        ctx.strokeStyle = hexToRgba('#FFFFFF', 0.85 * trailAlpha);
        ctx.lineWidth = 1.0 * scale;
        ctx.stroke();
        ctx.restore();
      }

      // 40+ Traveling Particle Dust Sparks with comet tails
      for (let p = 0; p < 45; p++) {
        const pSeed = (p * 137.5) % 1.0;
        const pPhase = (tAdj * (1.2 + pSeed * 1.5) * vortexSpeed + pSeed) % 1.0;
        const pRadius = curVortexR * (1 - pPhase * 0.95);
        const pAngle = pSeed * Math.PI * 2 + pPhase * Math.PI * 4;
        const px = Math.cos(pAngle) * pRadius;
        const py = Math.sin(pAngle) * pRadius * 0.55;
        const pAlpha = Math.sin(pPhase * Math.PI) * trailAlpha * (0.5 + pSeed * 0.5);

        const sparkCol = p % 2 === 0 ? '#38BDF8' : '#FFB51C';
        ctx.fillStyle = hexToRgba(sparkCol, pAlpha);
        ctx.beginPath();
        ctx.arc(px, py, (2.2 + pSeed * 2.0) * scale, 0, Math.PI * 2);
        ctx.fill();

        // White core
        ctx.fillStyle = hexToRgba('#FFFFFF', pAlpha * 0.9);
        ctx.beginPath();
        ctx.arc(px, py, 1.0 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Singularity core pulse
      const corePulse = 1.0 + Math.sin(tAdj * 22) * 0.15;
      const coreR = (18 * scale * corePulse) * (1 + easeCollapse * 1.2);
      const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.0);
      cGrad.addColorStop(0, hexToRgba('#FFFFFF', trailAlpha));
      cGrad.addColorStop(0.3, hexToRgba('#67E8F9', 0.85 * trailAlpha));
      cGrad.addColorStop(0.7, hexToRgba('#0284C7', 0.45 * trailAlpha));
      cGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. SUPER-RADIANT FLARE EXPLOSION & EXPANDING SHOCKWAVE (tAdj >= 1.15s & tAdj < 2.2s)
    if (tAdj >= 1.15 && tAdj < 2.2) {
      const pExp = clamp((tAdj - 1.15) / 0.85);
      const expAlpha = Math.sin(clamp((tAdj - 1.15) / 0.70) * Math.PI);

      ctx.save();

      if (cfg.anamorphicFlare === true) {
        const bHeight = (32 * (1 - pExp) + 4) * scale;
        const bGrad = ctx.createLinearGradient(-w * 0.45, 0, w * 0.45, 0);
        bGrad.addColorStop(0, 'rgba(255,255,255,0)');
        bGrad.addColorStop(0.35, hexToRgba('#38BDF8', expAlpha * 0.5));
        bGrad.addColorStop(0.5, `rgba(255, 255, 255, ${expAlpha * 0.98})`);
        bGrad.addColorStop(0.65, hexToRgba('#FFB51C', expAlpha * 0.45));
        bGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(-w * 0.45, -bHeight / 2, w * 0.9, bHeight);
      }

      // Expanding Shockwave Rings
      const rRing1 = pExp * 250 * scale;
      ctx.strokeStyle = hexToRgba('#38BDF8', (1 - pExp) * 0.95);
      ctx.lineWidth = (3.5 - pExp * 2.8) * scale;
      ctx.beginPath();
      ctx.arc(0, 0, rRing1, 0, Math.PI * 2);
      ctx.stroke();

      if (pExp > 0.12) {
        const pR2 = (pExp - 0.12) / 0.88;
        const rRing2 = pR2 * 200 * scale;
        ctx.strokeStyle = hexToRgba('#FFB51C', (1 - pR2) * 0.85);
        ctx.lineWidth = (2.6 - pR2 * 2.0) * scale;
        ctx.beginPath();
        ctx.arc(0, 0, rRing2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 3. LOGO MATERIALIZATION HERO-CENTERED (tAdj >= 1.22s)
    if (tAdj >= 1.22) {
      const pLogo = clamp((tAdj - 1.22) / 0.60);
      const easeLogo = easeOutBack(pLogo);
      const sLogo = 0.65 + 0.35 * easeLogo;
      const aLogo = clamp(pLogo * 1.8);

      ctx.save();
      ctx.scale(sLogo, sLogo);
      ctx.globalAlpha = aLogo;

      // Radiant back-corona
      const coronaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(logoW, logoH) * 0.7);
      coronaGrad.addColorStop(0, hexToRgba('#38BDF8', 0.35));
      coronaGrad.addColorStop(0.5, hexToRgba('#DFCEB5', 0.15));
      coronaGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(logoW, logoH) * 0.7, 0, Math.PI * 2);
      ctx.fill();

      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else if (isNke) {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      } else {
        drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
      }
      ctx.restore();

      // Flare sweep across logo (1.6s - 2.6s)
      if (cfg.anamorphicFlare === true && tAdj > 1.6 && tAdj < 2.6) {
        const pFlare = clamp((tAdj - 1.6) / 0.95);
        const fX = (pFlare * 2 - 1) * (logoW * 0.9);
        ctx.save();
        ctx.translate(fX, 0);
        const fGrad = ctx.createLinearGradient(-logoW * 0.35, 0, logoW * 0.35, 0);
        fGrad.addColorStop(0, 'rgba(255,255,255,0)');
        fGrad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.sin(pFlare * Math.PI) * 0.95})`);
        fGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fGrad;
        ctx.fillRect(-logoW * 0.35, -3 * scale, logoW * 0.7, 6 * scale);
        ctx.restore();
      }
    }

    ctx.restore();
  } else if (animType === 'biometric_scan') {
    // =========================================================================
    // E. BIOMETRIC HAND SCAN & HUD LAUNCH (REFERENCE: https://youtu.be/qT7ONqsuOvM)
    // - Holographic Sci-Fi HUD reticles, angle brackets [ ], and rotating telemetry
    // - Biometric hand silhouette outline with scanning laser beam
    // - Status readout: "BIOMETRIC SCAN" -> "ACCESS GRANTED" -> "LAUNCH GIMMICK"
    // - Holographic flash deconstruction launches the full brand logo in hero majesty
    // =========================================================================
    const tUnlock = 1.35;
    const hudAlpha = 1 - clamp((tAdj - 1.30) / 0.25);

    ctx.save();

    // 1. SCI-FI HUD & BIOMETRIC HAND SCANNER (tAdj < 1.55s)
    if (tAdj < 1.55) {
      const hudR = Math.max(logoW, logoH) * 0.65;
      const scanCol = tAdj < 1.15 ? '#00E5FF' : '#00E676'; // Cyan during scan, Emerald on auth

      // A. Rotating Outer HUD Ring with tick marks
      ctx.save();
      ctx.rotate(tAdj * 0.85);
      ctx.strokeStyle = hexToRgba(scanCol, 0.65 * hudAlpha);
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, hudR, 0, Math.PI * 2);
      ctx.stroke();

      // Degree ticks on outer ring
      const numTicks = 32;
      for (let tk = 0; tk < numTicks; tk++) {
        const tAngle = (tk / numTicks) * Math.PI * 2;
        const tickLen = (tk % 4 === 0 ? 8 : 4) * scale;
        const x1 = Math.cos(tAngle) * (hudR - tickLen);
        const y1 = Math.sin(tAngle) * (hudR - tickLen);
        const x2 = Math.cos(tAngle) * hudR;
        const y2 = Math.sin(tAngle) * hudR;
        ctx.strokeStyle = hexToRgba(scanCol, (tk % 4 === 0 ? 0.85 : 0.45) * hudAlpha);
        ctx.lineWidth = (tk % 4 === 0 ? 1.6 : 1.0) * scale;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // B. Counter-Rotating Inner Dashed Arc Ring
      ctx.save();
      ctx.rotate(-tAdj * 1.4);
      ctx.strokeStyle = hexToRgba('#FFFFFF', 0.55 * hudAlpha);
      ctx.lineWidth = 1.8 * scale;
      ctx.setLineDash([16 * scale, 12 * scale]);
      ctx.beginPath();
      ctx.arc(0, 0, hudR * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // C. Target Corner Brackets [  ]
      const bSize = hudR * 0.95;
      const bCorner = 24 * scale;
      ctx.strokeStyle = hexToRgba(scanCol, 0.85 * hudAlpha);
      ctx.lineWidth = 2.4 * scale;

      // Top-Left [
      ctx.beginPath();
      ctx.moveTo(-bSize, -bSize + bCorner);
      ctx.lineTo(-bSize, -bSize);
      ctx.lineTo(-bSize + bCorner, -bSize);
      ctx.stroke();

      // Top-Right ]
      ctx.beginPath();
      ctx.moveTo(bSize - bCorner, -bSize);
      ctx.lineTo(bSize, -bSize);
      ctx.lineTo(bSize, -bSize + bCorner);
      ctx.stroke();

      // Bottom-Left [
      ctx.beginPath();
      ctx.moveTo(-bSize, bSize - bCorner);
      ctx.lineTo(-bSize, bSize);
      ctx.lineTo(-bSize + bCorner, bSize);
      ctx.stroke();

      // Bottom-Right ]
      ctx.beginPath();
      ctx.moveTo(bSize - bCorner, bSize);
      ctx.lineTo(bSize, bSize);
      ctx.lineTo(bSize, bSize - bCorner);
      ctx.stroke();

      // D. Biometric Handprint Silhouette (Procedural Vector Hand from reference)
      const handScale = hudR * 0.65;
      const scanPhase = (Math.sin(tAdj * 6.5) * 0.5 + 0.5); // oscillates 0 to 1
      const laserY = (-handScale * 0.9) + scanPhase * (handScale * 1.8);

      ctx.save();
      ctx.strokeStyle = hexToRgba(scanCol, 0.75 * hudAlpha);
      ctx.lineWidth = 1.8 * scale;
      ctx.fillStyle = hexToRgba(scanCol, 0.12 * hudAlpha);

      // Palm & Finger Pods
      ctx.beginPath();
      // Palm base
      ctx.ellipse(0, handScale * 0.28, handScale * 0.38, handScale * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Thumb
      ctx.beginPath();
      ctx.ellipse(-handScale * 0.44, handScale * 0.15, handScale * 0.12, handScale * 0.24, -0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Index finger
      ctx.beginPath();
      ctx.ellipse(-handScale * 0.22, -handScale * 0.26, handScale * 0.10, handScale * 0.32, -0.10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Middle finger (tallest)
      ctx.beginPath();
      ctx.ellipse(0, -handScale * 0.35, handScale * 0.10, handScale * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ring finger
      ctx.beginPath();
      ctx.ellipse(handScale * 0.22, -handScale * 0.27, handScale * 0.09, handScale * 0.32, 0.10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Little finger
      ctx.beginPath();
      ctx.ellipse(handScale * 0.40, -handScale * 0.10, handScale * 0.08, handScale * 0.24, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // E. High-Energy Vertical Laser Scanning Line Beam
      if (tAdj < 1.25) {
        ctx.save();
        const lGrad = ctx.createLinearGradient(-bSize * 0.85, laserY, bSize * 0.85, laserY);
        lGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        lGrad.addColorStop(0.3, hexToRgba(scanCol, 0.6 * hudAlpha));
        lGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.95 * hudAlpha})`);
        lGrad.addColorStop(0.7, hexToRgba(scanCol, 0.6 * hudAlpha));
        lGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = lGrad;
        ctx.fillRect(-bSize * 0.85, laserY - 2.5 * scale, bSize * 1.7, 5 * scale);

        // Laser aura / glow fan
        const fanGrad = ctx.createLinearGradient(0, laserY - 18 * scale, 0, laserY + 18 * scale);
        fanGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        fanGrad.addColorStop(0.5, hexToRgba(scanCol, 0.25 * hudAlpha));
        fanGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = fanGrad;
        ctx.fillRect(-bSize * 0.85, laserY - 18 * scale, bSize * 1.7, 36 * scale);
        ctx.restore();
      }

      // F. Status Readout Banner at Bottom of HUD
      ctx.save();
      ctx.font = `800 ${10 * scale}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (tAdj < 1.15) {
        ctx.fillStyle = hexToRgba('#00E5FF', 0.9 * hudAlpha);
        const dots = '.'.repeat(1 + Math.floor(tAdj * 4) % 4);
        ctx.fillText(`[ BIOMETRIC SCAN IN PROGRESS${dots} ]`, 0, bSize + 18 * scale);
        ctx.font = `600 ${8 * scale}px "JetBrains Mono", monospace`;
        ctx.fillStyle = hexToRgba('#98AFC3', 0.7 * hudAlpha);
        ctx.fillText(`VERIFYING HANDPRINT // PROTOCOL KSO-AUTH`, 0, bSize + 32 * scale);
      } else {
        const blink = Math.sin(tAdj * 25) > 0;
        ctx.fillStyle = blink ? hexToRgba('#00E676', hudAlpha) : hexToRgba('#FFFFFF', hudAlpha);
        ctx.fillText(`[ IDENTITY CONFIRMED // ACCESS GRANTED ]`, 0, bSize + 18 * scale);
        ctx.font = `700 ${8 * scale}px "JetBrains Mono", monospace`;
        ctx.fillStyle = hexToRgba('#00E676', 0.9 * hudAlpha);
        ctx.fillText(`>> LAUNCHING GIMMICK ACTIVATED <<`, 0, bSize + 32 * scale);
      }
      ctx.restore();
    }

    // 2. HOLOGRAPHIC UNLOCK BURST & SHOCKWAVE (tAdj >= 1.25s & tAdj < 2.3s)
    if (tAdj >= 1.25 && tAdj < 2.3) {
      const pShock = clamp((tAdj - 1.25) / 0.85);
      const shockAlpha = Math.sin(clamp((tAdj - 1.25) / 0.70) * Math.PI);

      ctx.save();

      // Expanding Cybernetic Hex Ring
      const rHex = pShock * 240 * scale;
      ctx.strokeStyle = hexToRgba('#00E676', (1 - pShock) * 0.95);
      ctx.lineWidth = (3.2 - pShock * 2.5) * scale;
      ctx.beginPath();
      for (let hx = 0; hx < 6; hx++) {
        const hAngle = (hx / 6) * Math.PI * 2;
        const xPos = Math.cos(hAngle) * rHex;
        const yPos = Math.sin(hAngle) * rHex;
        if (hx === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
      }
      ctx.closePath();
      ctx.stroke();

      if (cfg.anamorphicFlare === true) {
        const beamH = (26 * (1 - pShock) + 3) * scale;
        const bGrad = ctx.createLinearGradient(-w * 0.45, 0, w * 0.45, 0);
        bGrad.addColorStop(0, 'rgba(0, 230, 118, 0)');
        bGrad.addColorStop(0.35, hexToRgba('#00E676', shockAlpha * 0.5));
        bGrad.addColorStop(0.5, `rgba(255, 255, 255, ${shockAlpha * 0.98})`);
        bGrad.addColorStop(0.65, hexToRgba('#00E5FF', shockAlpha * 0.45));
        bGrad.addColorStop(1, 'rgba(0, 230, 118, 0)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(-w * 0.45, -beamH / 2, w * 0.9, beamH);
      }

      ctx.restore();
    }

    // 3. BRAND LOGO MATERIALIZES FROM LAUNCHING GIMMICK (tAdj >= 1.30s)
    if (tAdj >= 1.30) {
      const pLogo = clamp((tAdj - 1.30) / 0.58);
      const easeLogo = easeOutBack(pLogo);
      const sLogo = 0.60 + 0.40 * easeLogo;
      const aLogo = clamp(pLogo * 1.8);

      ctx.save();
      ctx.scale(sLogo, sLogo);
      ctx.globalAlpha = aLogo;

      // Soft cyber aura behind logo
      const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(logoW, logoH) * 0.68);
      auraGrad.addColorStop(0, hexToRgba('#00E676', 0.35));
      auraGrad.addColorStop(0.5, hexToRgba('#00E5FF', 0.15));
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(logoW, logoH) * 0.68, 0, Math.PI * 2);
      ctx.fill();

      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else if (isNke) {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      } else {
        drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
      }
      ctx.restore();

      // High-tech laser sweep across revealed logo
      if (tAdj > 1.65 && tAdj < 2.65) {
        const pSwp = clamp((tAdj - 1.65) / 0.95);
        const sX = (pSwp * 2 - 1) * (logoW * 0.9);
        ctx.save();
        ctx.translate(sX, 0);
        const sGrad = ctx.createLinearGradient(-logoW * 0.35, 0, logoW * 0.35, 0);
        sGrad.addColorStop(0, 'rgba(255,255,255,0)');
        sGrad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.sin(pSwp * Math.PI) * 0.95})`);
        sGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sGrad;
        ctx.fillRect(-logoW * 0.35, -3 * scale, logoW * 0.7, 6 * scale);
        ctx.restore();
      }
    }

    ctx.restore();
  } else if (animType === 'smooth_zoom_flare') {
    // Smooth Zoom & Flare
    const pZoom = clamp(tAdj / 0.85);
    const easeZoom = easeOutCubic(pZoom);
    const sLogo = 0.78 + 0.22 * easeZoom;
    const aLogo = clamp(pZoom * 1.6);

    ctx.save();
    ctx.scale(sLogo, sLogo);
    ctx.globalAlpha = aLogo;

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }

    // Flare Sweep
    if (cfg.anamorphicFlare === true && tAdj > 0.8 && tAdj < 1.9) {
      const pF = clamp((tAdj - 0.8) / 0.9);
      const fX = (pF * 2 - 1) * (logoW * 0.9);
      ctx.save();
      ctx.translate(fX, 0);
      const fGrad = ctx.createLinearGradient(-logoW * 0.35, 0, logoW * 0.35, 0);
      fGrad.addColorStop(0, 'rgba(255,255,255,0)');
      fGrad.addColorStop(0.5, `rgba(255,255,255,${Math.sin(pF * Math.PI) * 0.9})`);
      fGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(-logoW * 0.35, -2 * scale, logoW * 0.7, 4 * scale);
      ctx.restore();
    }
    ctx.restore();
  } else if (animType === 'flip_3d_reveal') {
    // 3. 3D Isometric Flip & Glow
    const pFlip = clamp(tAdj / 0.95);
    const easeFlip = easeOutCubic(pFlip);
    const flipAngle = (1 - easeFlip) * Math.PI * 0.5;
    const sFlip = 0.75 + 0.25 * easeFlip;

    ctx.save();
    ctx.scale(Math.cos(flipAngle) * sFlip, sFlip);
    ctx.globalAlpha = clamp(pFlip * 1.8);

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();
  } else if (animType === 'elastic_snap_pulse') {
    // 4. Elastic Snap & Pulse Ring
    const pSnap = clamp(tAdj / 0.80);
    const easeSnap = easeOutBack(pSnap);
    const sSnap = 0.5 + 0.5 * easeSnap;

    ctx.save();
    ctx.scale(sSnap, sSnap);
    ctx.globalAlpha = clamp(pSnap * 1.6);

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }
    ctx.restore();

    // Shockwave Rings
    if (tAdj > 0.5 && tAdj < 1.7) {
      const pR = clamp((tAdj - 0.5) / 1.0);
      const ringR = (logoH * 0.6) + pR * 140 * scale;
      const ringAlpha = (1 - pR) * 0.8;
      ctx.save();
      ctx.strokeStyle = `rgba(223, 206, 181, ${ringAlpha})`;
      ctx.lineWidth = (3 - pR * 2) * scale;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  } else if (animType === 'matrix_scan_reveal') {
    // 5. Digital Matrix Scan Reveal
    const pScan = clamp(tAdj / 1.0);
    const easeScan = easeOutCubic(pScan);

    ctx.save();
    const clipH = logoH * easeScan;
    ctx.beginPath();
    ctx.rect(-logoW, -logoH / 2, logoW * 2, clipH);
    ctx.clip();

    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }

    if (pScan < 1) {
      const edgeY = -logoH / 2 + clipH;
      ctx.save();
      ctx.globalAlpha = clamp((1 - pScan) * 5);
      ctx.shadowColor = '#DFCEB5';
      ctx.shadowBlur = 8 * scale;
      ctx.strokeStyle = '#F5F0E4';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(-logoW / 2, edgeY);
      ctx.lineTo(logoW / 2, edgeY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  } else if (animType.startsWith('line_')) {
    const outline = customImg ? getLogoOutline(customImg) : null;
    const drawLogo = () => {
      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else if (isNke) {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      } else {
        drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
      }
    };
    renderSingleLogoLineEffect(ctx, logoW, logoH, tAdj, scale, animType, outline, drawLogo);
  } else if (
    animType === 'cinematic_glint_flare' ||
    animType === 'corporate_clean_push' ||
    animType === 'zoom_scale_reveal'
  ) {
    const progress = clamp(tAdj / 0.9);
    const ease = easeOutCubic(progress);
    const scaleLogo =
      animType === 'corporate_clean_push'
        ? 0.9 + 0.1 * ease
        : animType === 'zoom_scale_reveal'
          ? 1.3 - 0.3 * ease
          : 0.96 + 0.04 * ease;
    const alpha = clamp(progress * 1.6);

    ctx.save();
    ctx.translate(0, animType === 'corporate_clean_push' ? (1 - ease) * 28 * scale : 0);
    ctx.scale(scaleLogo, scaleLogo);
    ctx.globalAlpha = alpha;
    if (customImg) {
      drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
    } else if (isNke) {
      drawLogo1NKE(ctx, 0, 0, logoH, logoW);
    } else {
      drawNkeEmblemDirect(ctx, -logoW / 2, -logoH / 2, logoH / 2, logoW / 2, logoW / 2, scale);
    }

    if (cfg.anamorphicFlare === true && animType === 'cinematic_glint_flare' && tAdj > 0.75 && tAdj < 1.9) {
      const shineProgress = clamp((tAdj - 0.75) / 0.9);
      const shineX = (shineProgress * 2 - 1) * logoW;
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      const shine = ctx.createLinearGradient(shineX - 20 * scale, 0, shineX + 20 * scale, 0);
      shine.addColorStop(0, 'rgba(255,255,255,0)');
      shine.addColorStop(0.5, `rgba(255,255,255,${Math.sin(shineProgress * Math.PI) * 0.75})`);
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = shine;
      ctx.fillRect(-logoW / 2, -logoH / 2, logoW, logoH);
      ctx.restore();
    }
    ctx.restore();
  } else {
    // 1. DEFAULT: NKE Triangles Assemble OR Multi-phase Pop
    if (!customImg && isNke) {
      // Procedural Triangles Assemble
      const pGreen = clamp(tAdj / 0.55);
      const pBlue = clamp((tAdj - 0.38) / 0.55);
      const pYellow = clamp((tAdj - 0.75) / 0.55);

      const greenW = logoW / 2;
      const rectW = logoW / 2;
      const startX = -logoW / 2;
      const topY = -logoH / 2;
      const botY = logoH / 2;

      // Green Triangle
      if (pGreen > 0) {
        const sGreen = 0.6 + 0.4 * easeOutBack(pGreen);
        ctx.save();
        ctx.translate(startX + greenW / 2, botY);
        ctx.scale(sGreen, sGreen);
        ctx.translate(-(startX + greenW / 2), -botY);
        ctx.globalAlpha = clamp(pGreen * 1.8);
        ctx.fillStyle = '#12A727';
        ctx.beginPath();
        ctx.moveTo(startX, botY);
        ctx.lineTo(startX + greenW, topY);
        ctx.lineTo(startX + greenW, botY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
        ctx.restore();
      }

      // Blue Triangle
      if (pBlue > 0) {
        const sBlue = 0.6 + 0.4 * easeOutBack(pBlue);
        const emblemEnd = startX + greenW + rectW;
        ctx.save();
        ctx.translate(startX + greenW + rectW / 2, 0);
        ctx.scale(sBlue, sBlue);
        ctx.translate(-(startX + greenW + rectW / 2), 0);
        ctx.globalAlpha = clamp(pBlue * 1.8);
        ctx.fillStyle = '#144DFF';
        ctx.beginPath();
        ctx.moveTo(startX + greenW, topY);
        ctx.lineTo(startX + greenW, botY);
        ctx.lineTo(emblemEnd, botY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
        ctx.restore();
      }

      // Yellow/Amber Triangle
      if (pYellow > 0) {
        const sYellow = 0.6 + 0.4 * easeOutBack(pYellow);
        const emblemEnd = startX + greenW + rectW;
        ctx.save();
        ctx.translate(startX + greenW + rectW / 2, 0);
        ctx.scale(sYellow, sYellow);
        ctx.translate(-(startX + greenW + rectW / 2), 0);
        ctx.globalAlpha = clamp(pYellow * 1.8);
        ctx.fillStyle = '#FFB51C';
        ctx.beginPath();
        ctx.moveTo(startX + greenW, topY);
        ctx.lineTo(emblemEnd, topY);
        ctx.lineTo(emblemEnd, botY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Image based pop with elastic bounce
      const pImg = clamp(tAdj / 0.85);
      const easeImg = easeOutBack(pImg);
      const scaleImg = 0.75 + 0.25 * easeImg;
      ctx.save();
      ctx.scale(scaleImg, scaleImg);
      ctx.globalAlpha = clamp(pImg * 1.5);
      if (customImg) {
        drawCroppedLogo(ctx, customImg, -logoW / 2, -logoH / 2, logoW, logoH);
      } else {
        drawLogo1NKE(ctx, 0, 0, logoH, logoW);
      }
      ctx.restore();
    }

    // Anamorphic flare sweep across the formed emblem
    if (cfg.anamorphicFlare === true && tAdj > 1.2 && tAdj < 2.1) {
      const pFlare = clamp((tAdj - 1.2) / 0.85);
      const flareX = (pFlare * 2 - 1) * (logoW * 0.9);
      const flareA = Math.sin(pFlare * Math.PI) * 0.9;
      ctx.save();
      ctx.translate(flareX, 0);
      const fGrad = ctx.createLinearGradient(-logoW * 0.4, 0, logoW * 0.4, 0);
      fGrad.addColorStop(0, 'rgba(255,255,255,0)');
      fGrad.addColorStop(0.5, `rgba(255,255,255,${flareA})`);
      fGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fGrad;
      ctx.fillRect(-logoW * 0.4, -3 * scale, logoW * 0.8, 6 * scale);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------
  // LOGO TEXT / TITLE ON RIGHT SIDE (ONLY IF hasTitle)
  // ---------------------------------------------------------
  if (alphaText > 0 && hasTitle) {
    const logoRightEdge = logoW / 2;
    const dividerX = logoRightEdge + 24 * scale;
    const textStartX = dividerX + 22 * scale;
    const textSlide = (1 - easeText) * 26 * scale;

    ctx.save();
    ctx.globalAlpha = alphaText;

    // Glowing Divider
    const divH = logoH * 0.72 * easeText;
    const divGrad = ctx.createLinearGradient(0, -divH, 0, divH);
    divGrad.addColorStop(0, 'rgba(255,255,255,0)');
    divGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.95)');
    divGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(dividerX, -divH);
    ctx.lineTo(dividerX, divH);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const fontFam = cfg.singleLogoTitleFont || cfg.bumperTitleFont || cfg.fontFamily || 'Plus Jakarta Sans';
    const titleCol = cfg.singleLogoTitleColor || cfg.titleColor || '#FFFFFF';
    const fs = (cfg.singleLogoTitleSize || 28) * scale;

    ctx.font = `800 ${fs}px "${fontFam}", sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(titleText, textStartX + textSlide, 2 * scale);
    ctx.fillStyle = titleCol;
    ctx.fillText(titleText, textStartX + textSlide, 0);

    // Subtitle if provided
    const subText = (cfg.singleLogoSubtitle || cfg.subtitle || '').trim();
    if (subText) {
      ctx.font = `700 ${fs * 0.42}px "${fontFam}", sans-serif`;
      ctx.fillStyle = hexToRgba(titleCol, 0.85);
      ctx.fillText(subText, textStartX + textSlide, fs * 0.75);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Direct drawing of complete NKE emblem vector
 */
function drawNkeEmblemDirect(
  ctx: CanvasRenderingContext2D,
  startX: number,
  topY: number,
  botY: number,
  greenW: number,
  rectW: number,
  scale: number
) {
  const emblemEnd = startX + greenW + rectW;

  // Green
  ctx.fillStyle = '#12A727';
  ctx.beginPath();
  ctx.moveTo(startX, botY);
  ctx.lineTo(startX + greenW, topY);
  ctx.lineTo(startX + greenW, botY);
  ctx.closePath();
  ctx.fill();

  // Blue
  ctx.fillStyle = '#144DFF';
  ctx.beginPath();
  ctx.moveTo(startX + greenW, topY);
  ctx.lineTo(startX + greenW, botY);
  ctx.lineTo(emblemEnd, botY);
  ctx.closePath();
  ctx.fill();

  // Yellow
  ctx.fillStyle = '#FFB51C';
  ctx.beginPath();
  ctx.moveTo(startX + greenW, topY);
  ctx.lineTo(emblemEnd, topY);
  ctx.lineTo(emblemEnd, botY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.2 * scale;
  ctx.stroke();
}

/**
 * Color Tone (Color Grading) Engine
 */
function applyColorTone(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tone?: string
) {
  if (!tone || tone === 'none') return;

  ctx.save();
  if (tone === 'warm_cinematic') {
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    grad.addColorStop(1, 'rgba(180, 83, 9, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (tone === 'cool_tech') {
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
    grad.addColorStop(1, 'rgba(3, 105, 161, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (tone === 'cyber_neon') {
    ctx.globalCompositeOperation = 'screen';
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
    grad.addColorStop(1, 'rgba(217, 70, 239, 0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (tone === 'emerald_signature') {
    ctx.globalCompositeOperation = 'soft-light';
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    grad.addColorStop(1, 'rgba(234, 179, 8, 0.30)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (tone === 'sunset_amber') {
    ctx.globalCompositeOperation = 'color-dodge';
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
    grad.addColorStop(1, 'rgba(124, 45, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (tone === 'noir_luxe') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/**
 * Helper: Falling letters with gravity bounce impact & particle bursts (Effect C)
 */
function drawFallingLetters(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseX: number,
  baseY: number,
  scale: number,
  tAdj: number,
  titleFont: string,
  primaryColor: string,
  fontSize: number = 32
) {
  const letters = text.split('');
  if (letters.length === 0) return;

  ctx.save();
  ctx.font = `800 ${fontSize * scale}px "${titleFont}", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const letterMetrics = letters.map((ch) => ({ ch, w: ctx.measureText(ch).width }));
  const totalW = letterMetrics.reduce((sum, item) => sum + item.w, 0);
  let curX = baseX - totalW / 2;

  letterMetrics.forEach((item, i) => {
    const tStart = 0.65 + i * 0.055;
    if (tAdj < tStart) {
      curX += item.w;
      return;
    }

    const pDrop = clamp((tAdj - tStart) / 0.48);
    const easeDrop = easeOutBounce(pDrop);
    const dropY = baseY - (1 - easeDrop) * 220 * scale;
    const alpha = clamp(pDrop * 3.0);

    let scaleX = 1.0;
    let scaleY = 1.0;
    if (pDrop > 0.70 && pDrop < 0.95) {
      const impactProg = Math.sin(((pDrop - 0.70) / 0.25) * Math.PI);
      scaleY = 1.0 - 0.20 * impactProg;
      scaleX = 1.0 + 0.18 * impactProg;
    }

    if (pDrop > 0.72 && pDrop < 0.98) {
      ctx.save();
      const sparkAlpha = Math.sin(((pDrop - 0.72) / 0.26) * Math.PI) * 0.9;
      for (let s = 0; s < 4; s++) {
        const sAngle = (s / 4) * Math.PI * 2 + i;
        const sDist = (pDrop - 0.72) * 60 * scale;
        const sx = curX + item.w / 2 + Math.cos(sAngle) * sDist;
        const sy = baseY + 12 * scale + Math.sin(sAngle) * sDist * 0.4;
        ctx.fillStyle = `rgba(255, 181, 28, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.0 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(curX + item.w / 2, dropY);
    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(item.ch, -item.w / 2, 2.5 * scale);

    ctx.fillStyle = primaryColor;
    ctx.fillText(item.ch, -item.w / 2, 0);

    ctx.restore();
    curX += item.w;
  });

  ctx.restore();
}

/**
 * Helper: Paint coat peeling away in the wind with 60+ fluttering flakes and wind streaks (Effect D)
 */
function drawPaintPeelWindEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  tAdj: number,
  showFlare: boolean
) {
  const pPeel = clamp((tAdj - 0.20) / 1.80);
  if (pPeel >= 1.0) {
    if (showFlare && tAdj >= 2.0 && tAdj < 2.8) {
      const pFlare = (tAdj - 2.0) / 0.8;
      const fX = (pFlare * 2 - 1) * (w * 0.4);
      const fAlpha = Math.sin(pFlare * Math.PI) * 0.85;
      ctx.save();
      ctx.translate(fX, 0);
      const bGrad = ctx.createLinearGradient(-w * 0.35, 0, w * 0.35, 0);
      bGrad.addColorStop(0, 'rgba(255,255,255,0)');
      bGrad.addColorStop(0.5, `rgba(255, 215, 0, ${fAlpha})`);
      bGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-w * 0.35, -3 * scale, w * 0.7, 6 * scale);
      ctx.restore();
    }
    return;
  }

  const easeP = easeOutCubic(pPeel);
  const xFront = -w * 0.55 + easeP * w * 1.35;

  ctx.save();

  // 1. Draw the peeling slate paint coat covering the unrevealed portion (from xFront to right edge)
  if (xFront < w) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(xFront, 0);

    const numTeeth = 32;
    for (let j = 0; j <= numTeeth; j++) {
      const py = (j / numTeeth) * h;
      const wave = Math.sin(j * 0.85 + pPeel * 6) * (18 * scale) + Math.cos(j * 1.7) * (12 * scale);
      ctx.lineTo(xFront + wave, py);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.clip();

    const pGrad = ctx.createLinearGradient(xFront, 0, w, h);
    pGrad.addColorStop(0, '#333F50');
    pGrad.addColorStop(0.5, '#2B3644');
    pGrad.addColorStop(1, '#1E2530');
    ctx.fillStyle = pGrad;
    ctx.fillRect(xFront - 30 * scale, 0, w - xFront + 60 * scale, h);

    // Stress cracks in paint
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.0 * scale;
    for (let c = 0; c < 12; c++) {
      const cx = xFront + 40 * scale + (c * 65 * scale) % Math.max(10, w - xFront + 10);
      const cy = (c * 73) % h;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 25 * scale, cy + 15 * scale);
      ctx.lineTo(cx + 40 * scale, cy + 8 * scale);
      ctx.stroke();
    }

    ctx.restore();

    // 2. Glowing fractured peeling boundary edge
    ctx.save();
    ctx.beginPath();
    const numEdgePts = 40;
    for (let k = 0; k <= numEdgePts; k++) {
      const ey = (k / numEdgePts) * h;
      const wave = Math.sin(k * 0.85 + pPeel * 6) * (18 * scale) + Math.cos(k * 1.7) * (12 * scale);
      const ex = xFront + wave;
      if (k === 0) ctx.moveTo(ex, ey);
      else ctx.lineTo(ex, ey);
    }
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
    ctx.lineWidth = 3.5 * scale;
    ctx.shadowColor = '#FFB51C';
    ctx.shadowBlur = 12 * scale;
    ctx.stroke();

    // Under-curl of peeling paint sheet
    ctx.fillStyle = '#485669';
    for (let k = 0; k < numEdgePts; k += 2) {
      const ey1 = (k / numEdgePts) * h;
      const ey2 = ((k + 1.8) / numEdgePts) * h;
      const wave1 = Math.sin(k * 0.85 + pPeel * 6) * (18 * scale) + Math.cos(k * 1.7) * (12 * scale);
      const curlW = (14 + (k % 5) * 4) * scale;
      ctx.beginPath();
      ctx.ellipse(xFront + wave1 - curlW * 0.4, (ey1 + ey2) / 2, curlW, (ey2 - ey1) * 0.55, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Fast aerodynamic wind streaks blowing across canvas from left to right
  ctx.save();
  const numWindLines = 28;
  for (let wIdx = 0; wIdx < numWindLines; wIdx++) {
    const seed = (wIdx * 137.5) % 1;
    const speed = 1.4 + seed * 1.2;
    const lineProg = ((tAdj * speed + seed) % 1.0);
    const lx = -w * 0.2 + lineProg * (w * 1.4);
    const ly = (seed * h * 0.95) + (h * 0.025);
    const lineLen = (80 + seed * 160) * scale;
    const lineAlpha = Math.sin(lineProg * Math.PI) * 0.45;

    const wGrad = ctx.createLinearGradient(lx, 0, lx + lineLen, 0);
    wGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    wGrad.addColorStop(0.5, (wIdx % 3 === 0) ? `rgba(0, 229, 255, ${lineAlpha})` : `rgba(255, 255, 255, ${lineAlpha})`);
    wGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = wGrad;
    ctx.lineWidth = (1.2 + seed * 1.8) * scale;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + lineLen, ly);
    ctx.stroke();
  }
  ctx.restore();

  // 4. 65+ Curled paint chips / flakes detaching and fluttering violently to the right
  ctx.save();
  const numFlakes = 65;
  for (let f = 0; f < numFlakes; f++) {
    const flakeSeed = (f * 97.3) % 1.0;
    const flakeBirth = 0.15 + flakeSeed * 0.65;
    if (pPeel < flakeBirth) continue;

    const flakeProg = (pPeel - flakeBirth) / (1.0 - flakeBirth);
    const fx = xFront + flakeProg * (w * 0.65 + flakeSeed * 200 * scale);
    const fy = ((f * 37) % h) + Math.sin(flakeProg * 8 + f) * 45 * scale - (flakeProg * 60 * scale);
    const fAngle = flakeProg * Math.PI * 6 + f;
    const fScale = (1 - flakeProg * 0.3) * (5 + (f % 5) * 3) * scale;
    const fAlpha = clamp((1 - flakeProg) * 1.4);

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(fAngle);
    ctx.globalAlpha = fAlpha;

    const isFrontSide = Math.cos(fAngle) > 0;
    ctx.fillStyle = isFrontSide ? '#333F50' : '#DFCEB5';
    ctx.beginPath();
    ctx.moveTo(-fScale, -fScale * 0.6);
    ctx.lineTo(fScale * 1.2, -fScale * 0.3);
    ctx.lineTo(fScale * 0.8, fScale * 0.8);
    ctx.lineTo(-fScale * 0.9, fScale * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * ==============================================================================
 * MODE 1: MASTER BUMPER LOGO PRESENTATION
 * Supports:
 * a. Multiple Logo (Up to 2 logos with sequential reveal, dividers, and slide left)
 * b. Single Logo (Hero centered, triangle pieces assemble, slide left, text reveal)
 * ==============================================================================
 */
function renderMasterPresentation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BumperConfig,
  t: number,
  speed: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const dur = Math.max(1, cfg.duration);
  const scale = Math.min(w, h) / 1000;
  const tAdj = t * speed;

  const cameraZoom = 1.0 + 0.025 * clamp(t / dur);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(cameraZoom, cameraZoom);

  const primaryTitleColor = cfg.titleColor || cfg.primaryColor || '#FFFFFF';
  const secColor = cfg.secondaryColor || '#DF9B35';
  const haloIntensity = clamp(cfg.logoHaloIntensity ?? 0.6);
  const isSingleLogo = cfg.logoCountMode === 'single';

  // ===========================================================================
  // SUB-MODE A: SINGLE LOGO (Hero Center, Segmented Triangles, Slide Left, Logo Text Reveal)
  // ===========================================================================
  if (isSingleLogo) {
    renderSingleLogoSlicedAssemble(ctx, w, h, cfg, tAdj, scale, secColor);
    ctx.restore();
    return;
  }

  // ===========================================================================
  // SUB-MODE B: MULTIPLE LOGO (Supports Dynamic Active Logos - No ghost slots!)
  // ===========================================================================
  const targetH = 54 * scale;
  const rawLogos = (cfg.bumperLogos && cfg.bumperLogos.length > 0)
    ? cfg.bumperLogos
    : [
        { id: '1', enabled: true, name: 'Nusa Konstruksi', url: '/assets/aistudio/kso_nke_hd.png' },
        { id: '2', enabled: true, name: 'Jaya Konstruksi', url: '/assets/aistudio/kso_jaya_hd.png' },
      ];

  // Strictly filter only active enabled logos with an image or name
  const activeSlots = rawLogos.filter((s) => s.enabled && (s.url || s.name));

  const logoItems = activeSlots.map((slot) => {
    const img = slot.url ? getCachedImage(slot.url) : null;
    let aspect = 1.5;
    if (img && img.naturalHeight > 0) {
      aspect = img.naturalWidth / img.naturalHeight;
    } else if (slot.url?.includes('kso_nke') || slot.name?.toLowerCase().includes('nke')) {
      aspect = 1800 / 362;
    } else if (slot.url?.includes('jaya')) {
      aspect = 1.0;
    } else if (slot.url?.includes('wiswa')) {
      aspect = 1.0;
    }
    const lw = targetH * aspect;
    return { slot, img, aspect, w: lw };
  });

  const gap = 32 * scale;
  const totalLogosW = logoItems.reduce((acc, it) => acc + it.w, 0) + Math.max(0, logoItems.length - 1) * gap;
  const startX = -totalLogosW / 2;

  // Calculate coordinates for active logos and dividers
  let currentLeft = startX;
  const positionedLogos: { x: number; w: number; slot: any; img: any; idx: number }[] = [];

  logoItems.forEach((it, idx) => {
    const xCenter = currentLeft + it.w / 2;
    positionedLogos.push({ x: xCenter, w: it.w, slot: it.slot, img: it.img, idx });
    currentLeft += it.w;
    if (idx < logoItems.length - 1) {
      currentLeft += gap;
    }
  });

  const displayTitle = (cfg.title || '').trim();
  const titleFont = cfg.bumperTitleFont || cfg.fontFamily || 'Plus Jakarta Sans';
  const transStyle = cfg.transitionStyle || 'spin_shrink_up';

  let clusterX = 0;
  let clusterY = 0;
  let clusterScale = 1.0;
  let clusterRotate = 0;
  let clusterAlpha = 1.0;

  if (transStyle === 'spin_shrink_up') {
    // =========================================================================
    // A. LOGO BESAR MUNCUL MUTER, BERHENTI. TRUS KECIL. KEATAS. TULISAN MUNCUL
    // =========================================================================
    if (tAdj < 1.15) {
      const pSpin = clamp(tAdj / 1.15);
      const easeSpin = easeOutCubic(pSpin);
      clusterScale = 2.05 - 0.70 * easeSpin; // 2.05 down to 1.35
      clusterRotate = (1 - easeSpin) * Math.PI * 4; // 720 deg rotation
      clusterAlpha = clamp(tAdj / 0.35);
      clusterY = 0;
    } else if (tAdj < 1.70) {
      // BERHENTI: Holds center, pauses with subtle energetic breathing wave
      const pRest = (tAdj - 1.15) / 0.55;
      clusterScale = 1.35 + 0.02 * Math.sin(pRest * Math.PI * 2);
      clusterRotate = 0;
      clusterAlpha = 1.0;
      clusterY = 0;
    } else {
      // TRUS KECIL, KEATAS: Shrinks smoothly to 1.0 and ascends upwards
      const pUp = clamp((tAdj - 1.70) / 0.65);
      const easeUp = easeOutCubic(pUp);
      clusterScale = 1.35 - 0.35 * easeUp;
      clusterRotate = 0;
      clusterAlpha = 1.0;
      clusterY = -75 * scale * easeUp;
    }
  } else if (transStyle === 'faded') {
    // =========================================================================
    // B. FADED: Soft optical blur fade with micro-zoom expansion & gentle drift
    // =========================================================================
    const pFade = clamp(tAdj / 1.10);
    const easeFade = easeOutCubic(pFade);
    clusterScale = 0.92 + 0.08 * easeFade;
    clusterAlpha = clamp(pFade * 1.5);
    const pDrift = clamp((tAdj - 1.15) / 0.75);
    clusterY = -50 * scale * easeOutCubic(pDrift);
  } else if (transStyle === 'letters_falling') {
    // =========================================================================
    // C. HURUF JATOH SATU SATU: Logos settle up top, letters drop with bounce
    // =========================================================================
    const pPop = clamp(tAdj / 0.60);
    clusterScale = 0.80 + 0.20 * easeOutBack(pPop);
    clusterAlpha = clamp(pPop * 1.8);
    clusterY = -65 * scale;
  } else if (transStyle === 'paint_peel_wind') {
    // =========================================================================
    // D. EFFECT CAT TERKELUPAS KETIUP ANGIN: Logos underneath revealed by peel
    // =========================================================================
    clusterY = -45 * scale;
    clusterScale = 1.0;
    clusterAlpha = 1.0;
  } else if (transStyle === 'slide_left' || transStyle === 'sequential_slide_left') {
    const slideStart = transStyle === 'sequential_slide_left' ? 0.45 : 1.20;
    const pSlide = clamp((tAdj - slideStart) / 0.85);
    const easeSlide = easeOutCubic(pSlide);
    const targetLeftX = -Math.min(w * 0.22, (totalLogosW / 2 + 100 * scale));
    clusterX = targetLeftX * easeSlide;
  } else if (transStyle === 'slide_up' || transStyle === 'sequential_slide_up') {
    const slideStart = transStyle === 'sequential_slide_up' ? 0.45 : 1.20;
    const pSlide = clamp((tAdj - slideStart) / 0.85);
    clusterY = -70 * scale * easeOutCubic(pSlide);
  } else if (transStyle === 'cinematic_zoom') {
    const pZoom = clamp(tAdj / 1.1);
    clusterScale = 1.18 - 0.18 * easeOutCubic(pZoom);
    clusterAlpha = clamp(pZoom * 1.5);
  }

  // Anamorphic Lens Flare in Warm Sand when paused or settled (1.15s - 1.85s)
  if (cfg.anamorphicFlare === true && tAdj > 1.15 && tAdj < 1.95) {
    const flareP = clamp((tAdj - 1.15) / 0.75);
    const flareX = (flareP * 2.2 - 1.1) * (w * 0.45);
    const flareAlpha = Math.sin(flareP * Math.PI) * 0.85;

    ctx.save();
    ctx.translate(clusterX + flareX, clusterY);
    const beamGrad = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
    beamGrad.addColorStop(0, 'rgba(255,255,255,0)');
    beamGrad.addColorStop(0.35, hexToRgba('#DFCEB5', flareAlpha * 0.35));
    beamGrad.addColorStop(0.5, `rgba(255,255,255,${flareAlpha * 0.95})`);
    beamGrad.addColorStop(0.65, hexToRgba('#DFCEB5', flareAlpha * 0.35));
    beamGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-w * 0.4, -3 * scale, w * 0.8, 6 * scale);
    ctx.restore();
  }

  // Draw Logo Cluster
  ctx.save();
  ctx.translate(clusterX, clusterY);
  ctx.rotate(clusterRotate);
  ctx.scale(clusterScale, clusterScale);
  ctx.globalAlpha = clusterAlpha;

  // Render each active logo: MUNCUL SATU-SATU BERURUTAN (TIDAK BERTUMPUK!)
  positionedLogos.forEach((pl) => {
    const stepDur = (transStyle === 'spin_shrink_up' || transStyle === 'paint_peel_wind') ? 0.05 : 0.45;
    const tAppear = 0.15 + pl.idx * stepDur;
    if (tAdj < tAppear && transStyle !== 'paint_peel_wind') {
      return;
    }

    const pPop = clamp((tAdj - tAppear) / 0.40);
    const scaleLogo = 0.75 + 0.25 * easeOutBack(pPop);
    const alphaLogo = clamp(pPop * 1.8);
    const curLogoX = pl.x;

    // Soft Warm Sand halo at slot while popping in
    if (cfg.logoHaloEnabled !== false && haloIntensity > 0 && pPop > 0.05 && pPop < 0.95) {
      ctx.save();
      const popHalo = ctx.createRadialGradient(curLogoX, 0, 0, curLogoX, 0, targetH * 1.1);
      popHalo.addColorStop(0, hexToRgba('#DFCEB5', 0.35 * alphaLogo * haloIntensity));
      popHalo.addColorStop(0.6, hexToRgba('#5C1018', 0.15 * alphaLogo * haloIntensity));
      popHalo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = popHalo;
      ctx.beginPath();
      ctx.arc(curLogoX, 0, targetH * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(curLogoX, 0);
    ctx.scale(scaleLogo, scaleLogo);
    ctx.globalAlpha = alphaLogo;

    if (pl.img) {
      const aspect = pl.img.naturalWidth / pl.img.naturalHeight;
      const dw = targetH * aspect;
      ctx.drawImage(pl.img, -dw / 2, -targetH / 2, dw, targetH);
    } else if (pl.slot.url?.includes('kso_nke') || pl.slot.name?.toLowerCase().includes('nke')) {
      drawLogo1NKE(ctx, 0, 0, targetH, pl.w);
    } else if (pl.slot.url?.includes('jaya') || pl.slot.name?.toLowerCase().includes('jaya')) {
      drawLogo2Jaya(ctx, 0, 0, targetH, pl.w);
    } else if (pl.slot.url?.includes('wiswa') || pl.slot.name?.toLowerCase().includes('wiswa')) {
      drawLogo3Wiswa(ctx, 0, 0, targetH, pl.w);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${14 * scale}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pl.slot.name, 0, 0);
    }
    ctx.restore();
  });

  // Render dividers strictly between active logos once adjacent logo enters
  for (let idx = 0; idx < positionedLogos.length - 1; idx++) {
    const stepDur = (transStyle === 'spin_shrink_up' || transStyle === 'paint_peel_wind') ? 0.05 : 0.45;
    const nextLogoAppear = 0.15 + (idx + 1) * stepDur;
    const pDiv = clamp((tAdj - nextLogoAppear) / 0.35);

    if (pDiv > 0) {
      const x1 = positionedLogos[idx].x + positionedLogos[idx].w / 2;
      const x2 = positionedLogos[idx + 1].x - positionedLogos[idx + 1].w / 2;
      const divX = (x1 + x2) / 2;
      const divH = targetH * 0.5 * easeOutCubic(pDiv);

      ctx.save();
      ctx.strokeStyle = hexToRgba('#DFCEB5', 0.85);
      ctx.lineWidth = 1.5 * scale;
      ctx.globalAlpha = clamp(pDiv * 1.5);
      ctx.beginPath();
      ctx.moveTo(divX, -divH);
      ctx.lineTo(divX, divH);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();

  // ===========================================================================
  // TITLE RENDERING DISPATCHED BY EFFECT STYLE
  // ===========================================================================
  const effectiveTitle = displayTitle || 'NUSA KONSTRUKSI ENJINIRING';

  if (transStyle === 'letters_falling') {
    // C. HURUF JATOH SATU SATU: Letters drop down with bouncy elastic gravity
    drawFallingLetters(
      ctx,
      effectiveTitle,
      0,
      50 * scale,
      scale,
      tAdj,
      titleFont,
      primaryTitleColor,
      32 * (cfg.fontSize || 1.0)
    );
  } else if (transStyle === 'spin_shrink_up') {
    // A. TULISAN MUNCUL: Emerges after logos shrink and ascend upwards (tAdj > 2.25s)
    if (tAdj > 2.20) {
      const pTitle = clamp((tAdj - 2.20) / 0.70);
      const easeTitle = easeOutBack(pTitle);
      const alphaTitle = clamp(pTitle * 1.5);
      const titleY = 52 * scale;

      ctx.save();
      ctx.globalAlpha = alphaTitle;

      // Horizontal beam wipe divider above title
      const beamW = 180 * scale * easeTitle;
      const bGrad = ctx.createLinearGradient(-beamW, 0, beamW, 0);
      bGrad.addColorStop(0, 'rgba(255,255,255,0)');
      bGrad.addColorStop(0.5, hexToRgba('#FFB51C', 0.85));
      bGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bGrad;
      ctx.fillRect(-beamW, titleY - 26 * scale, beamW * 2, 2.5 * scale);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = 34 * scale * (cfg.fontSize || 1.0) * (0.85 + 0.15 * easeTitle);
      ctx.font = `800 ${fontSize}px "${titleFont}", sans-serif`;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(effectiveTitle, 0, titleY + 3 * scale);

      // Main Golden / Primary fill
      ctx.fillStyle = primaryTitleColor;
      ctx.fillText(effectiveTitle, 0, titleY);

      ctx.restore();
    }
  } else if (
    (transStyle === 'slide_left' || transStyle === 'sequential_slide_left') &&
    cfg.aspectRatio !== '9:16'
  ) {
    const titleStart = transStyle === 'sequential_slide_left' ? 0.95 : 1.40;
    const pText = clamp((tAdj - titleStart) / 0.80);
    const easeText = easeOutCubic(pText);
    const alphaText = clamp(pText * 1.3);

    if (alphaText > 0) {
      ctx.save();
      ctx.globalAlpha = alphaText;

      const logoRightEdge = clusterX + totalLogosW / 2;
      const midDividerX = logoRightEdge + 25 * scale;
      const beamHeight = 58 * scale * easeText;

      ctx.save();
      const divBeamGrad = ctx.createLinearGradient(0, -beamHeight, 0, beamHeight);
      divBeamGrad.addColorStop(0, 'rgba(255,255,255,0)');
      divBeamGrad.addColorStop(0.5, hexToRgba(secColor, 0.9));
      divBeamGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = divBeamGrad;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(midDividerX, -beamHeight);
      ctx.lineTo(midDividerX, beamHeight);
      ctx.stroke();
      ctx.restore();

      const textSlideOffset = (1 - easeText) * 32 * scale;
      const textStartX = midDividerX + 24 * scale + textSlideOffset;

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const fontSize1 = 26 * scale * (cfg.fontSize || 1.0);
      ctx.font = `800 ${fontSize1}px "${titleFont}", sans-serif`;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(effectiveTitle, textStartX, 2 * scale);

      ctx.fillStyle = primaryTitleColor;
      ctx.fillText(effectiveTitle, textStartX, 0);
      ctx.restore();
    }
  } else {
    // Default / Faded / Paint Peel / Slide Up Title Rendering
    const pTitle = clamp((tAdj - 1.25) / 0.80);
    const easeTitle = easeOutCubic(pTitle);
    const alphaTitle = transStyle === 'paint_peel_wind' ? 1.0 : clamp(pTitle * 1.4);
    const titleY = (transStyle === 'paint_peel_wind' ? 48 : 50) * scale;

    if (alphaTitle > 0) {
      ctx.save();
      ctx.globalAlpha = alphaTitle;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const fontSize = 34 * scale * (cfg.fontSize || 1.0);
      ctx.font = `800 ${fontSize}px "${titleFont}", sans-serif`;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(effectiveTitle, 0, titleY + 3 * scale);

      ctx.fillStyle = primaryTitleColor;
      ctx.fillText(effectiveTitle, 0, titleY);
      ctx.restore();
    }
  }

  // D. EFFECT CAT TERKELUPAS KETIUP ANGIN: Top wind overlay revealing the scene
  if (transStyle === 'paint_peel_wind') {
    drawPaintPeelWindEffect(ctx, w, h, scale, tAdj, cfg.anamorphicFlare === true);
  }

  ctx.restore();
}

/**
 * ==============================================================================
 * MODE 2: VIDEO TITLE SCREEN
 * Directly matched from the reference user image (image_737631e5.png):
 * - Radiant Golden Tree of Life (Pohon Hayat IKN) emblem with ambient breathing halo
 * - Category Overline ("SIMULASI KONSTRUKSI")
 * - Main Bold Title ("PEMBANGUNAN")
 * - Secondary Subtitle ("HUNIAN VERTIKAL NEGARA")
 * - Pill Tag Badge ("TIPE 65")
 * - Location Footer ("DI IBU KOTA NUSANTARA")
 * - Precision bottom horizon line with partner icons
 * ==============================================================================
 */
function renderVideoTitleMode(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BumperConfig,
  t: number,
  speed: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 1000;
  const tAdj = t * speed;

  const accentColor = cfg.accentColor || '#DFCEB5';
  const goldColor = cfg.secondaryColor || '#DFCEB5';

  const titleFont = cfg.titleFont || cfg.fontFamily || 'Plus Jakarta Sans';
  const topColor = cfg.titleTopColor || accentColor;
  const mainColor = cfg.titleMainColor || '#FFFFFF';
  const bottomColor = cfg.titleBottomColor || accentColor;

  const hasEmblem = cfg.titleEmblemEnabled !== false;
  const titleMotion = cfg.titleTransition || 'fade_slide';
  const textTop = (cfg.titleTop || '').trim();
  const textMain = (cfg.titleMain || '').trim();
  const rawBadge = (cfg.titleBadgeText || '').trim();
  const hasBadge = Boolean(cfg.titleBadgeEnabled) && Boolean(rawBadge) && rawBadge.toLowerCase() !== 'tipe 65';
  const textBottom = (cfg.titleBottom || '').trim();

  // Transition Timing: Staggered reveal
  const pEmblem = clamp(tAdj / 0.8);
  const pCat = clamp((tAdj - 0.4) / 0.6);
  const pMain = clamp((tAdj - 0.7) / 0.8);
  const pBadge = clamp((tAdj - 1.2) / 0.6);
  const pFooter = clamp((tAdj - 1.5) / 0.6);

  // Dynamic stack elements calculation to prevent unnatural vertical gaps
  interface StackElement {
    type: 'emblem' | 'top' | 'main' | 'badge' | 'bottom';
    height: number;
  }
  const stack: StackElement[] = [];
  const logoScale = cfg.titleLogoScale || 1.0;
  const isMultiTitleLogo = cfg.titleLogoMode === 'multiple';
  if (hasEmblem) {
    stack.push({
      type: 'emblem',
      height: (isMultiTitleLogo ? 58 : 75) * scale * logoScale,
    });
  }
  if (textTop) stack.push({ type: 'top', height: (cfg.titleTopSize || 20) * scale });
  if (textMain) stack.push({ type: 'main', height: (cfg.titleMainSize || 48) * scale * 1.05 });
  if (hasBadge) stack.push({ type: 'badge', height: 38 * scale });
  if (textBottom) stack.push({ type: 'bottom', height: (cfg.titleBottomSize || 18) * scale });

  const spacing = (cfg.videoTitleSpacing !== undefined ? cfg.videoTitleSpacing : 22) * scale;
  const totalStackH = stack.reduce((sum, item) => sum + item.height, 0) + Math.max(0, stack.length - 1) * spacing;

  let currentY = -totalStackH / 2;

  ctx.save();
  ctx.translate(cx, cy);

  stack.forEach((item) => {
    const itemCenterY = currentY + item.height / 2;

    if (item.type === 'emblem' && pEmblem > 0) {
      const emblemEase =
        titleMotion === 'fade_slide' ||
        titleMotion === 'beam_wipe' ||
        titleMotion === 'vertical_wipe' ||
        titleMotion === 'soft_scale'
          ? easeOutCubic(pEmblem)
          : easeOutBack(pEmblem);
      const emblemScale = (0.92 + 0.08 * emblemEase) * logoScale;
      const emblemAlpha = clamp(pEmblem * 1.5);
      ctx.save();
      ctx.translate(0, itemCenterY);
      ctx.scale(emblemScale, emblemScale);
      ctx.globalAlpha = emblemAlpha;

      if (cfg.titleLogoGlow !== false) {
        const haloPulse = 1.0 + Math.sin(t * 2.0) * 0.1;
        const haloRadius = (isMultiTitleLogo ? 120 : 70) * scale * haloPulse;
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
        haloGrad.addColorStop(0, 'rgba(223, 155, 53, 0.45)');
        haloGrad.addColorStop(0.5, 'rgba(223, 155, 53, 0.12)');
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isMultiTitleLogo) {
        // Render Multiple Logos Row for Video Title
        const activeSlots = (cfg.titleLogos || cfg.bumperLogos || []).filter((s) => s.enabled);
        if (activeSlots.length > 0) {
          const targetH = 50 * scale;
          const gap = 28 * scale;
          const loadedLogos = activeSlots.map((slot) => {
            const img = slot.url ? getCachedImage(slot.url) : null;
            const aspect = img && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 2.5;
            const wLogo = targetH * aspect;
            return { slot, img, w: wLogo };
          });
          const totalW = loadedLogos.reduce((acc, l) => acc + l.w, 0) + (loadedLogos.length - 1) * gap;
          let currentLogoX = -totalW / 2;

          loadedLogos.forEach((pl, lIdx) => {
            const centerX = currentLogoX + pl.w / 2;
            ctx.save();
            ctx.translate(centerX, 0);
            if (pl.img) {
              ctx.drawImage(pl.img, -pl.w / 2, -targetH / 2, pl.w, targetH);
            } else if (pl.slot.url?.includes('kso_nke') || pl.slot.name?.toLowerCase().includes('nke')) {
              drawLogo1NKE(ctx, 0, 0, targetH, pl.w);
            } else if (pl.slot.url?.includes('jaya') || pl.slot.name?.toLowerCase().includes('jaya')) {
              drawLogo2Jaya(ctx, 0, 0, targetH, pl.w);
            } else if (pl.slot.url?.includes('wiswa') || pl.slot.name?.toLowerCase().includes('wiswa')) {
              drawLogo3Wiswa(ctx, 0, 0, targetH, pl.w);
            } else {
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `700 ${14 * scale}px "Plus Jakarta Sans", sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(pl.slot.name, 0, 0);
            }
            ctx.restore();

            // Divider between logos
            if (lIdx < loadedLogos.length - 1) {
              const divX = currentLogoX + pl.w + gap / 2;
              ctx.save();
              ctx.strokeStyle = hexToRgba(goldColor, 0.6);
              ctx.lineWidth = 1.5 * scale;
              ctx.beginPath();
              ctx.moveTo(divX, -targetH * 0.4);
              ctx.lineTo(divX, targetH * 0.4);
              ctx.stroke();
              ctx.restore();
            }

            currentLogoX += pl.w + gap;
          });
        }
      } else {
        // Single Emblem / Logo
        const customEmblem = cfg.titleEmblemUrl ? getCachedImage(cfg.titleEmblemUrl) : null;
        if (customEmblem) {
          const eAspect = customEmblem.naturalWidth / customEmblem.naturalHeight;
          const eH = 70 * scale;
          const eW = eH * eAspect;
          ctx.drawImage(customEmblem, -eW / 2, -eH / 2, eW, eH);
        } else if (cfg.titleEmblemUrl && (cfg.titleEmblemUrl.includes('kso_nke') || cfg.titleEmblemUrl.includes('nke'))) {
          drawLogo1NKE(ctx, 0, 0, 70 * scale, 180 * scale);
        } else if (cfg.titleEmblemUrl && cfg.titleEmblemUrl.includes('jaya')) {
          drawLogo2Jaya(ctx, 0, 0, 70 * scale, 160 * scale);
        } else if (cfg.titleEmblemUrl && cfg.titleEmblemUrl.includes('wiswa')) {
          drawLogo3Wiswa(ctx, 0, 0, 70 * scale, 160 * scale);
        } else {
          drawTreeOfLifeEmblem(ctx, 0, 0, 62 * scale, goldColor);
        }
      }
      ctx.restore();
    } else if (item.type === 'top' && pCat > 0) {
      const catAlpha = clamp(pCat * 1.4);
      const catSlide = (1 - easeOutCubic(pCat)) * 14 * scale;
      const topFontSize = (cfg.titleTopSize || 20) * scale;
      ctx.save();
      ctx.globalAlpha = catAlpha;
      ctx.font = `700 ${topFontSize}px "${titleFont}", sans-serif`;
      ctx.fillStyle = topColor;
      drawLetterSpacedText(ctx, textTop.toUpperCase(), 0, itemCenterY + catSlide, 6 * scale);
      ctx.restore();
    } else if (item.type === 'main' && pMain > 0) {
      const mainEase = easeOutCubic(pMain);
      const mainAlpha =
        titleMotion === 'beam_wipe' || titleMotion === 'vertical_wipe'
          ? 1
          : clamp(pMain * 1.5);
      const mainScale =
        titleMotion === 'kinetic_typography'
          ? 0.88 + 0.12 * easeOutBack(pMain)
          : titleMotion === 'soft_scale'
            ? 0.9 + 0.1 * mainEase
            : 1;
      const mainFontSize = (cfg.titleMainSize || 48) * scale;
      const fullMainText = textMain.toUpperCase();
      const mainText =
        titleMotion === 'typewriter'
          ? fullMainText.slice(0, Math.ceil(fullMainText.length * mainEase))
          : fullMainText;

      ctx.save();
      ctx.globalAlpha = mainAlpha;
      const riseOffset = titleMotion === 'fade_slide' ? (1 - mainEase) * 16 * scale : 0;
      ctx.translate(0, itemCenterY + riseOffset);
      ctx.scale(mainScale, mainScale);

      ctx.font = `900 ${mainFontSize}px "${titleFont}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (titleMotion === 'beam_wipe') {
        const reveal = easeOutCubic(pMain);
        const clipLeft = -w * 0.45;
        const clipWidth = w * 0.9 * reveal;
        ctx.beginPath();
        ctx.rect(clipLeft, -mainFontSize, clipWidth, mainFontSize * 2);
        ctx.clip();
      }

      if (titleMotion === 'vertical_wipe') {
        const revealHeight = mainFontSize * 1.4 * mainEase;
        ctx.beginPath();
        ctx.rect(-w * 0.45, -mainFontSize * 0.7, w * 0.9, revealHeight);
        ctx.clip();
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillText(mainText, 0, 3 * scale);

      ctx.fillStyle = mainColor;
      ctx.fillText(mainText, 0, 0);

      if (titleMotion === 'beam_wipe' && pMain < 1) {
        const sweepX = -w * 0.45 + w * 0.9 * easeOutCubic(pMain);
        const sweep = ctx.createLinearGradient(sweepX - 14 * scale, 0, sweepX + 14 * scale, 0);
        sweep.addColorStop(0, 'rgba(255,255,255,0)');
        sweep.addColorStop(0.5, 'rgba(255,255,255,0.95)');
        sweep.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sweep;
        ctx.fillRect(sweepX - 14 * scale, -mainFontSize, 28 * scale, mainFontSize * 2);
      }

      if (titleMotion === 'kinetic_typography') {
        const underlineWidth = Math.min(ctx.measureText(fullMainText).width, w * 0.8) * mainEase;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(-underlineWidth / 2, mainFontSize * 0.48);
        ctx.lineTo(underlineWidth / 2, mainFontSize * 0.48);
        ctx.stroke();
      }

      // Optional specular shine pass across letters
      if (cfg.anamorphicFlare === true && tAdj > 1.2) {
        const shineP = ((tAdj - 1.2) * 0.6) % 2.5;
        if (shineP < 1.0) {
          ctx.save();
          ctx.globalCompositeOperation = 'source-atop';
          const sX = (shineP * 2 - 1) * (w * 0.35);
          const sGrad = ctx.createLinearGradient(sX - 60 * scale, 0, sX + 60 * scale, 0);
          sGrad.addColorStop(0, 'rgba(255,255,255,0)');
          sGrad.addColorStop(0.5, 'rgba(255,255,255,0.85)');
          sGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sGrad;
          ctx.fillRect(-w * 0.4, -50 * scale, w * 0.8, 100 * scale);
          ctx.restore();
        }
      }
      ctx.restore();
    } else if (item.type === 'badge' && pBadge > 0) {
      const badgeAlpha = clamp(pBadge * 1.5);
      const badgeScale = 0.8 + 0.2 * easeOutBack(pBadge);
      const textBadge = cfg.titleBadgeText;

      ctx.save();
      ctx.translate(0, itemCenterY);
      ctx.scale(badgeScale, badgeScale);
      ctx.globalAlpha = badgeAlpha;

      ctx.font = `900 ${18 * scale}px "${titleFont}", sans-serif`;
      const bW = ctx.measureText(textBadge).width + 42 * scale;
      const bH = 34 * scale;
      const bR = 8 * scale;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawRoundedRect(ctx, -bW / 2, -bH / 2 + 3 * scale, bW, bH, bR);
      ctx.fill();

      // Badge Background
      const badgeBgGrad = ctx.createLinearGradient(0, -bH / 2, 0, bH / 2);
      badgeBgGrad.addColorStop(0, '#EAB308');
      badgeBgGrad.addColorStop(1, '#DF9B35');
      ctx.fillStyle = cfg.titleBadgeBgColor || badgeBgGrad;
      drawRoundedRect(ctx, -bW / 2, -bH / 2, bW, bH, bR);
      ctx.fill();

      ctx.fillStyle = cfg.titleBadgeTextColor || '#08101E';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textBadge, 0, 1 * scale);
      ctx.restore();
    } else if (item.type === 'bottom' && pFooter > 0) {
      const footerAlpha = clamp(pFooter * 1.4);
      const footerSlide = (1 - easeOutCubic(pFooter)) * 12 * scale;
      const bottomFontSize = (cfg.titleBottomSize || 18) * scale;

      ctx.save();
      ctx.globalAlpha = footerAlpha;
      ctx.font = `700 ${bottomFontSize}px "${titleFont}", sans-serif`;
      ctx.fillStyle = bottomColor;
      drawLetterSpacedText(ctx, textBottom.toUpperCase(), 0, itemCenterY + footerSlide, 6 * scale);
      ctx.restore();
    }

    currentY += item.height + spacing;
  });

  // 6. BOTTOM HORIZON DIVIDER
  const baselineY = h * 0.44;
  ctx.save();
  const lineGrad = ctx.createLinearGradient(-w * 0.4, 0, w * 0.4, 0);
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  lineGrad.addColorStop(0.3, hexToRgba(goldColor, 0.3));
  lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  lineGrad.addColorStop(0.7, hexToRgba(goldColor, 0.3));
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, baselineY);
  ctx.lineTo(w * 0.42, baselineY);
  ctx.stroke();

  // Central dot marker
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, baselineY, 3 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * ==============================================================================
 * MODE 3: FRAME VIDEO LOGO OVERLAY
 * Directly matched from the reference user image (LOGO_WM_NKE_R3_c1d75e16.png):
 * - Top-Right corner modern diagonal architectural badge
 * - Dual dynamic racing accent stripes: Electric Cyan & Amber Gold
 * - Crisp white or frosted interior surface
 * - Displays up to 3 partner / contractor logos cleanly inside
 * - Multiple style options: Diagonal badge, Glassmorphism bar, Cyber HUD,
 *   Broadcast lower third, Minimal watermark, Cinema letterbox.
 * ==============================================================================
 */
function renderFrameVideoMode(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cfg: BumperConfig,
  t: number
) {
  const scale = Math.min(w, h) / 1000;
  const bgMode = cfg.frameBackgroundMode || 'slate';

  // 1. Render the selected background: slate, white, sample video, or transparency.
  if (bgMode === 'transparent' || bgMode === 'alpha') {
    ctx.clearRect(0, 0, w, h);
  } else if (bgMode === 'putih') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
  } else if (bgMode === 'video' || bgMode === 'simulated_video') {
    // Sample-video gradient for previewing watermark contrast.
    const vGrad = ctx.createLinearGradient(0, 0, w, h * 0.9);
    vGrad.addColorStop(0, '#0E2A47');
    vGrad.addColorStop(0.45, '#2C6E6A');
    vGrad.addColorStop(1, '#D9A45B');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);
  } else if (bgMode === 'slate') {
    // Neutral slate background.
    ctx.fillStyle = '#333F50';
    ctx.fillRect(0, 0, w, h);
  } else if (bgMode === 'solid') {
    ctx.fillStyle = cfg.backgroundColor || '#333F50';
    ctx.fillRect(0, 0, w, h);
  } else {
    // Gradient mode
    const gGrad = ctx.createLinearGradient(0, 0, w, h);
    gGrad.addColorStop(0, cfg.backgroundColor || '#333F50');
    gGrad.addColorStop(1, cfg.backgroundSecondaryColor || '#181F2B');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // 2. RENDER THE CHOSEN TEMPLATE FRAME AND ITS BRAND OR CUSTOM LOGOS.
  const rawFrameLogos = cfg.frameLogos || [];
  const activeLogos = rawFrameLogos.filter((logo) => logo.enabled && logo.url);
  const logoCount = Math.max(1, activeLogos.length);

  const frameStyle = cfg.frameStyle || 'klasik';

  const selectedStyle = WATERMARK_VARIATIONS.some((variation) => variation.id === frameStyle)
    ? frameStyle
    : 'klasik';

  // All templates share the reference's 240 x 64 layout.
  const baseW = getDynamicWatermarkWidth(logoCount);
  const wmScale = cfg.frameWatermarkScale ?? 1.0;
  const wmWidth = Math.round(w * (baseW / 1280) * wmScale);
  const wmHeight = Math.round((wmWidth * 64) / baseW);
  const wmX = w - wmWidth;
  const wmY = 0;

  const toneOptions = {
    accent1: cfg.frameAccentColor || '#144DFF',
    accent2: cfg.frameSecondaryAccent || '#FFB51C',
    accent3: cfg.frameTertiaryAccent || '#12A52A',
    bgCard: cfg.frameCardBgColor || '#FFFFFF',
  };

  const wmImg = getWatermarkImage(selectedStyle, toneOptions, activeLogos);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = (cfg.frameGlowIntensity ?? 0.7) * 16 * scale;
  ctx.shadowOffsetY = 4 * scale;

  if (wmImg.complete && wmImg.naturalWidth > 0) {
    ctx.drawImage(wmImg, wmX, wmY, wmWidth, wmHeight);
  }

  ctx.restore();
}

/**
 * Procedural Vector Drawing:
 * Indonesian Golden Tree of Life (Pohon Hayat Nusantara)
 */
function drawTreeOfLifeEmblem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  goldColor: string
) {
  ctx.save();
  ctx.translate(x, y);

  const R = size * 0.22;
  const numRays = 15;

  // Central Solar Sun Core
  const sunGrad = ctx.createRadialGradient(0, -size * 0.15, 0, 0, -size * 0.15, R);
  sunGrad.addColorStop(0, '#FFFBEB');
  sunGrad.addColorStop(0.5, '#F59E0B');
  sunGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(0, -size * 0.15, R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Radiating Golden Crown Fan Rays
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';

  for (let i = 0; i < numRays; i++) {
    const angle = -Math.PI / 2 + ((i - (numRays - 1) / 2) / (numRays - 1)) * (Math.PI * 0.82);
    const innerR = R * 0.8;
    const outerR = size * 0.52 - Math.abs(i - (numRays - 1) / 2) * 1.8;

    const x1 = Math.cos(angle) * innerR;
    const y1 = -size * 0.15 + Math.sin(angle) * innerR;
    const x2 = Math.cos(angle) * outerR;
    const y2 = -size * 0.15 + Math.sin(angle) * outerR;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Intertwined Organic Tree Trunk & Roots Below
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 2.4;
  ctx.beginPath();

  // Left symmetric branches
  ctx.moveTo(0, -size * 0.05);
  ctx.bezierCurveTo(-size * 0.2, size * 0.1, -size * 0.05, size * 0.25, -size * 0.22, size * 0.45);

  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size * 0.12, size * 0.15, -size * 0.15, size * 0.3, 0, size * 0.48);

  // Right symmetric branches
  ctx.moveTo(0, -size * 0.05);
  ctx.bezierCurveTo(size * 0.2, size * 0.1, size * 0.05, size * 0.25, size * 0.22, size * 0.45);

  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.12, size * 0.15, size * 0.15, size * 0.3, 0, size * 0.48);

  ctx.stroke();

  ctx.restore();
}

/**
 * Sliced Ultra-HD Logo Renderers
 */
function drawLogo1NKE(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  w: number
) {
  const imgNKE = getCachedImage('/assets/aistudio/kso_nke_hd.png');
  if (imgNKE) {
    ctx.drawImage(imgNKE, x - w / 2, y - h / 2, w, h);
    return;
  }

  // Fallback Procedural
  ctx.save();
  ctx.translate(x, y);
  const startX = -w / 2;
  const topY = -h / 2;
  const botY = h / 2;

  const greenW = 1.33 * h;
  ctx.fillStyle = '#12A727';
  ctx.beginPath();
  ctx.moveTo(startX, botY);
  ctx.lineTo(startX + greenW, topY);
  ctx.lineTo(startX + greenW, botY);
  ctx.closePath();
  ctx.fill();

  const rectW = 1.33 * h;
  const emblemEnd = startX + greenW + rectW;
  ctx.fillStyle = '#144DFF';
  ctx.beginPath();
  ctx.moveTo(startX + greenW, topY);
  ctx.lineTo(startX + greenW, botY);
  ctx.lineTo(emblemEnd, botY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FFB51C';
  ctx.beginPath();
  ctx.moveTo(startX + greenW, topY);
  ctx.lineTo(emblemEnd, topY);
  ctx.lineTo(emblemEnd, botY);
  ctx.closePath();
  ctx.fill();

  const textX = emblemEnd + 0.22 * h;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${h * 0.28}px "Plus Jakarta Sans", sans-serif`;
  drawLetterSpacedTextLeft(ctx, 'N  U  S  A', textX, -h * 0.26, 3.0);
  ctx.font = `700 ${h * 0.22}px "Plus Jakarta Sans", sans-serif`;
  drawLetterSpacedTextLeft(ctx, 'KONSTRUKSI', textX, 0.02 * h, 1.4);
  drawLetterSpacedTextLeft(ctx, 'ENJINIRING', textX, 0.30 * h, 1.6);
  ctx.restore();
}

function drawLogo2Jaya(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  w: number
) {
  const imgJaya = getCachedImage('/assets/aistudio/kso_jaya_hd.png');
  if (imgJaya) {
    ctx.drawImage(imgJaya, x - w / 2, y - h / 2, w, h);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  const R = h / 2;
  const strokeW = Math.max(2.6, h * 0.065);

  ctx.strokeStyle = '#FFAE19';
  ctx.lineWidth = strokeW;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R - strokeW / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0.08 * R, 0.65 * R);
  ctx.lineTo(0.08 * R, -0.72 * R);
  ctx.lineTo(0.22 * R, -0.62 * R);
  ctx.lineTo(0.22 * R, -0.15 * R);
  ctx.lineTo(0.38 * R, 0);
  ctx.lineTo(0.38 * R, 0.40 * R);
  ctx.lineTo(0.55 * R, 0.65 * R);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-0.55 * R, 0.65 * R);
  ctx.lineTo(-0.38 * R, 0.40 * R);
  ctx.lineTo(-0.38 * R, -0.15 * R);
  ctx.lineTo(-0.20 * R, -0.28 * R);
  ctx.lineTo(-0.20 * R, 0.35 * R);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-0.55 * R, 0.65 * R);
  ctx.lineTo(0.55 * R, 0.65 * R);
  ctx.stroke();
  ctx.restore();
}

function drawLogo3Wiswa(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  w: number
) {
  const imgWiswa = getCachedImage('/assets/aistudio/kso_wiswa_hd.png');
  if (imgWiswa) {
    ctx.drawImage(imgWiswa, x - w / 2, y - h / 2, w, h);
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  const H = h;
  const strokeW = Math.max(2.4, H * 0.06);

  ctx.strokeStyle = '#C92B27';
  ctx.lineWidth = strokeW;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, -H * 0.46);
  ctx.lineTo(H * 0.44, 0);
  ctx.lineTo(0, H * 0.46);
  ctx.lineTo(-H * 0.44, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -H * 0.46);
  ctx.lineTo(0, H * 0.46);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-H * 0.44, 0);
  ctx.lineTo(H * 0.44, 0);
  ctx.stroke();
  ctx.restore();
}

/**
 * Text Typography Helpers
 */
function drawLetterSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  const chars = text.split('');
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + (chars.length - 1) * spacing;
  let curX = x - totalWidth / 2;

  chars.forEach((char, idx) => {
    ctx.fillText(char, curX + widths[idx] / 2, y);
    curX += widths[idx] + spacing;
  });
}

function drawLetterSpacedTextLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  let curX = x;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + spacing;
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function applyFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = 120;
  grainCanvas.height = 120;
  const gctx = grainCanvas.getContext('2d');
  if (!gctx) return;

  const imgData = gctx.createImageData(120, 120);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 16;
  }
  gctx.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pattern = ctx.createPattern(grainCanvas, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const radius = Math.max(w, h) * 0.75;
  const vig = ctx.createRadialGradient(w / 2, h / 2, radius * 0.35, w / 2, h / 2, radius);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex || !hex.startsWith('#')) return `rgba(255,255,255,${alpha})`;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
